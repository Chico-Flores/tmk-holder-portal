/**
 * TMK NFT Image Upload Script
 * 
 * Downloads all NFT images from IPFS and uploads them to Cloudflare R2.
 * Supports resuming from where it left off if interrupted.
 * 
 * Usage: node scripts/upload-images-to-r2.js [--start=N] [--end=N] [--test]
 * 
 * Options:
 *   --start=N   Start from token ID N (default: 1)
 *   --end=N     End at token ID N (default: 1503)
 *   --test      Only process first 5 tokens for testing
 */

require('dotenv').config({ path: '.env.local' });

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  CONTRACT_ADDRESS: '0x16F67329271fac6922d7650f87EA59C4C4C3304D',
  RPC_URL: 'https://evm.cronos.org',
  TOTAL_SUPPLY: 1503,
  
  // R2 Configuration
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'tmk-blender-files',
  
  // IPFS Gateways (multiple for fallback)
  IPFS_GATEWAYS: [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://w3s.link/ipfs/',
    'https://dweb.link/ipfs/',
  ],
  
  // Rate limiting
  DELAY_BETWEEN_TOKENS: 500, // ms between each token
  DELAY_BETWEEN_RETRIES: 2000, // ms between retries
  MAX_RETRIES: 3,
  FETCH_TIMEOUT: 30000, // 30 seconds
};

const CONTRACT_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function totalSupply() external view returns (uint256)',
];

// Progress tracking
const PROGRESS_FILE = path.join(__dirname, 'upload-progress.json');
const FAILED_FILE = path.join(__dirname, 'failed-tokens.json');

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${CONFIG.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CONFIG.R2_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.R2_SECRET_ACCESS_KEY,
  },
});

// Helper functions
function ipfsToHttp(uri, gatewayIndex = 0) {
  if (!uri) return null;
  
  const gateway = CONFIG.IPFS_GATEWAYS[gatewayIndex % CONFIG.IPFS_GATEWAYS.length];
  
  if (uri.startsWith('ipfs://')) {
    return gateway + uri.replace('ipfs://', '');
  }
  if (uri.includes('/ipfs/')) {
    const hash = uri.split('/ipfs/')[1];
    return gateway + hash;
  }
  return uri;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, timeout = CONFIG.FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('Could not load progress file, starting fresh');
  }
  return { completed: [], lastProcessed: 0 };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function loadFailed() {
  try {
    if (fs.existsSync(FAILED_FILE)) {
      return JSON.parse(fs.readFileSync(FAILED_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveFailed(failed) {
  fs.writeFileSync(FAILED_FILE, JSON.stringify(failed, null, 2));
}

async function checkIfExists(tokenId) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: CONFIG.R2_BUCKET_NAME,
      Key: `images/${tokenId}.png`,
    }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    // Other errors - assume doesn't exist
    return false;
  }
}

async function fetchMetadata(tokenURI) {
  for (let gatewayIndex = 0; gatewayIndex < CONFIG.IPFS_GATEWAYS.length; gatewayIndex++) {
    const url = ipfsToHttp(tokenURI, gatewayIndex);
    
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log(`  Gateway ${gatewayIndex + 1} failed for metadata: ${error.message}`);
    }
  }
  throw new Error('All gateways failed for metadata');
}

async function downloadImage(imageUri) {
  for (let gatewayIndex = 0; gatewayIndex < CONFIG.IPFS_GATEWAYS.length; gatewayIndex++) {
    const url = ipfsToHttp(imageUri, gatewayIndex);
    
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer);
      }
    } catch (error) {
      console.log(`  Gateway ${gatewayIndex + 1} failed for image: ${error.message}`);
    }
  }
  throw new Error('All gateways failed for image');
}

async function uploadToR2(tokenId, imageBuffer) {
  const contentType = 'image/png';
  
  await s3Client.send(new PutObjectCommand({
    Bucket: CONFIG.R2_BUCKET_NAME,
    Key: `images/${tokenId}.png`,
    Body: imageBuffer,
    ContentType: contentType,
  }));
}

async function processToken(contract, tokenId, progress, failed) {
  console.log(`\nProcessing token #${tokenId}...`);
  
  // Check if already uploaded
  const exists = await checkIfExists(tokenId);
  if (exists) {
    console.log(`  Already exists in R2, skipping`);
    return true;
  }
  
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      // Step 1: Get tokenURI from contract
      console.log(`  Fetching tokenURI (attempt ${attempt})...`);
      const tokenURI = await contract.tokenURI(tokenId);
      
      // Step 2: Fetch metadata from IPFS
      console.log(`  Fetching metadata...`);
      const metadata = await fetchMetadata(tokenURI);
      
      if (!metadata.image) {
        console.log(`  No image in metadata, skipping`);
        return false;
      }
      
      // Step 3: Download image from IPFS
      console.log(`  Downloading image...`);
      const imageBuffer = await downloadImage(metadata.image);
      console.log(`  Downloaded ${(imageBuffer.length / 1024).toFixed(1)} KB`);
      
      // Step 4: Upload to R2
      console.log(`  Uploading to R2...`);
      await uploadToR2(tokenId, imageBuffer);
      console.log(`  ✓ Successfully uploaded token #${tokenId}`);
      
      return true;
    } catch (error) {
      console.log(`  Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < CONFIG.MAX_RETRIES) {
        console.log(`  Retrying in ${CONFIG.DELAY_BETWEEN_RETRIES / 1000}s...`);
        await delay(CONFIG.DELAY_BETWEEN_RETRIES);
      }
    }
  }
  
  console.log(`  ✗ Failed after ${CONFIG.MAX_RETRIES} attempts`);
  return false;
}

async function main() {
  console.log('========================================');
  console.log('TMK NFT Image Upload Script');
  console.log('========================================\n');
  
  // Validate config
  if (!CONFIG.R2_ACCESS_KEY_ID || !CONFIG.R2_SECRET_ACCESS_KEY) {
    console.error('ERROR: R2 credentials not found in .env.local');
    console.error('Make sure R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are set');
    process.exit(1);
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  let startToken = 1;
  let endToken = CONFIG.TOTAL_SUPPLY;
  let testMode = false;
  
  for (const arg of args) {
    if (arg.startsWith('--start=')) {
      startToken = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--end=')) {
      endToken = parseInt(arg.split('=')[1]);
    } else if (arg === '--test') {
      testMode = true;
      endToken = Math.min(startToken + 4, CONFIG.TOTAL_SUPPLY);
    }
  }
  
  console.log(`Configuration:`);
  console.log(`  Contract: ${CONFIG.CONTRACT_ADDRESS}`);
  console.log(`  R2 Bucket: ${CONFIG.R2_BUCKET_NAME}`);
  console.log(`  Token range: ${startToken} to ${endToken}`);
  console.log(`  Test mode: ${testMode}`);
  console.log('');
  
  // Connect to blockchain
  console.log('Connecting to Cronos blockchain...');
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
  const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  
  // Load progress
  const progress = loadProgress();
  const failed = loadFailed();
  
  console.log(`Loaded progress: ${progress.completed.length} already completed`);
  console.log(`Loaded failed: ${failed.length} previously failed\n`);
  
  // Process tokens
  const totalTokens = endToken - startToken + 1;
  let processed = 0;
  let succeeded = 0;
  let skipped = 0;
  let failedCount = 0;
  
  const startTime = Date.now();
  
  for (let tokenId = startToken; tokenId <= endToken; tokenId++) {
    processed++;
    
    // Show progress
    const percent = ((processed / totalTokens) * 100).toFixed(1);
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processed / elapsed;
    const remaining = (totalTokens - processed) / rate;
    
    console.log(`\n[${percent}%] Token ${tokenId}/${endToken} | Elapsed: ${elapsed.toFixed(0)}s | ETA: ${remaining.toFixed(0)}s`);
    
    // Skip if already in completed list
    if (progress.completed.includes(tokenId)) {
      console.log(`  Already completed, skipping`);
      skipped++;
      continue;
    }
    
    const success = await processToken(contract, tokenId, progress, failed);
    
    if (success) {
      succeeded++;
      progress.completed.push(tokenId);
      
      // Remove from failed list if it was there
      const failIndex = failed.indexOf(tokenId);
      if (failIndex > -1) {
        failed.splice(failIndex, 1);
      }
    } else {
      failedCount++;
      if (!failed.includes(tokenId)) {
        failed.push(tokenId);
      }
    }
    
    // Save progress periodically
    if (processed % 10 === 0) {
      saveProgress(progress);
      saveFailed(failed);
    }
    
    progress.lastProcessed = tokenId;
    
    // Rate limiting
    await delay(CONFIG.DELAY_BETWEEN_TOKENS);
  }
  
  // Final save
  saveProgress(progress);
  saveFailed(failed);
  
  // Summary
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log('\n========================================');
  console.log('UPLOAD COMPLETE');
  console.log('========================================');
  console.log(`Total processed: ${processed}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Skipped (already done): ${skipped}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Total time: ${totalTime} minutes`);
  
  if (failed.length > 0) {
    console.log(`\nFailed tokens saved to: ${FAILED_FILE}`);
    console.log(`To retry failed tokens, run: node scripts/retry-failed.js`);
  }
}

main().catch(console.error);
