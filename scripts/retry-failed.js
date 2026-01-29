/**
 * TMK NFT Image Retry Script
 * 
 * Retries uploading failed tokens from the failed-tokens.json file.
 * 
 * Usage: node scripts/retry-failed.js
 */

require('dotenv').config({ path: '.env.local' });

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration (same as upload script)
const CONFIG = {
  CONTRACT_ADDRESS: '0x16F67329271fac6922d7650f87EA59C4C4C3304D',
  RPC_URL: 'https://evm.cronos.org',
  
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'tmk-blender-files',
  
  IPFS_GATEWAYS: [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://w3s.link/ipfs/',
    'https://dweb.link/ipfs/',
  ],
  
  DELAY_BETWEEN_TOKENS: 1000,
  DELAY_BETWEEN_RETRIES: 3000,
  MAX_RETRIES: 5,
  FETCH_TIMEOUT: 45000,
};

const CONTRACT_ABI = [
  'function tokenURI(uint256 tokenId) external view returns (string)',
];

const PROGRESS_FILE = path.join(__dirname, 'upload-progress.json');
const FAILED_FILE = path.join(__dirname, 'failed-tokens.json');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${CONFIG.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CONFIG.R2_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.R2_SECRET_ACCESS_KEY,
  },
});

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
  } catch (e) {}
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

async function fetchMetadata(tokenURI) {
  for (let gatewayIndex = 0; gatewayIndex < CONFIG.IPFS_GATEWAYS.length; gatewayIndex++) {
    const url = ipfsToHttp(tokenURI, gatewayIndex);
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log(`  Gateway ${gatewayIndex + 1} failed for metadata`);
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
      console.log(`  Gateway ${gatewayIndex + 1} failed for image`);
    }
  }
  throw new Error('All gateways failed for image');
}

async function uploadToR2(tokenId, imageBuffer) {
  await s3Client.send(new PutObjectCommand({
    Bucket: CONFIG.R2_BUCKET_NAME,
    Key: `images/${tokenId}.png`,
    Body: imageBuffer,
    ContentType: 'image/png',
  }));
}

async function processToken(contract, tokenId) {
  console.log(`\nRetrying token #${tokenId}...`);
  
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      console.log(`  Attempt ${attempt}/${CONFIG.MAX_RETRIES}...`);
      
      const tokenURI = await contract.tokenURI(tokenId);
      console.log(`  Got tokenURI`);
      
      const metadata = await fetchMetadata(tokenURI);
      if (!metadata.image) {
        console.log(`  No image in metadata`);
        return false;
      }
      
      console.log(`  Downloading image...`);
      const imageBuffer = await downloadImage(metadata.image);
      console.log(`  Downloaded ${(imageBuffer.length / 1024).toFixed(1)} KB`);
      
      console.log(`  Uploading to R2...`);
      await uploadToR2(tokenId, imageBuffer);
      console.log(`  ✓ Success!`);
      
      return true;
    } catch (error) {
      console.log(`  Failed: ${error.message}`);
      if (attempt < CONFIG.MAX_RETRIES) {
        console.log(`  Waiting ${CONFIG.DELAY_BETWEEN_RETRIES / 1000}s before retry...`);
        await delay(CONFIG.DELAY_BETWEEN_RETRIES);
      }
    }
  }
  
  return false;
}

async function main() {
  console.log('========================================');
  console.log('TMK NFT Image Retry Script');
  console.log('========================================\n');
  
  const failed = loadFailed();
  
  if (failed.length === 0) {
    console.log('No failed tokens to retry!');
    return;
  }
  
  console.log(`Found ${failed.length} failed tokens to retry`);
  console.log(`Tokens: ${failed.slice(0, 10).join(', ')}${failed.length > 10 ? '...' : ''}\n`);
  
  const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
  const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  
  const progress = loadProgress();
  const stillFailed = [];
  let succeeded = 0;
  
  for (const tokenId of failed) {
    const success = await processToken(contract, tokenId);
    
    if (success) {
      succeeded++;
      progress.completed.push(tokenId);
    } else {
      stillFailed.push(tokenId);
    }
    
    await delay(CONFIG.DELAY_BETWEEN_TOKENS);
  }
  
  saveProgress(progress);
  saveFailed(stillFailed);
  
  console.log('\n========================================');
  console.log('RETRY COMPLETE');
  console.log('========================================');
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Still failed: ${stillFailed.length}`);
  
  if (stillFailed.length > 0) {
    console.log(`\nStill failed tokens: ${stillFailed.join(', ')}`);
  }
}

main().catch(console.error);
