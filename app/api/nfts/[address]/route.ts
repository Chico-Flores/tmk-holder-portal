import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x16F67329271fac6922d7650f87EA59C4C4C3304D';
const RPC_URL = 'https://evm.cronos.org';

const CONTRACT_ABI = [
  'function tokensOfOwner(address owner) external view returns (uint256[])',
  'function tokenURI(uint256 tokenId) external view returns (string)',
];

// Simple in-memory cache (persists across requests in same server instance)
const metadataCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// IPFS to HTTP conversion
function ipfsToHttp(uri: string): string {
  if (!uri) return '';
  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`;
  }
  if (uri.includes('/ipfs/')) {
    const hash = uri.split('/ipfs/')[1];
    return `https://ipfs.io/ipfs/${hash}`;
  }
  return uri;
}

// Delay helper
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// Fetch with timeout
async function fetchWithTimeout(url: string, timeout: number = 10000): Promise<Response> {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  // Validate address
  if (!ethers.isAddress(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

  // Check cache
  const cacheKey = address.toLowerCase();
  const cached = metadataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    // Get token IDs
    const tokenIds: bigint[] = await contract.tokensOfOwner(address);

    if (tokenIds.length === 0) {
      const result = { nfts: [], count: 0 };
      metadataCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    // Fetch metadata one at a time with delays (more reliable)
    const nfts = [];
    
    for (const tokenId of tokenIds) {
      const tokenIdNum = Number(tokenId);
      
      try {
        // Add delay between requests to avoid rate limiting
        if (nfts.length > 0) {
          await delay(200); // 200ms between each request
        }

        const tokenURI = await contract.tokenURI(tokenId);
        const metadataUrl = ipfsToHttp(tokenURI);
        
        try {
          const response = await fetchWithTimeout(metadataUrl, 10000);
          if (response.ok) {
            const metadata = await response.json();
            nfts.push({
              tokenId: tokenIdNum,
              name: metadata.name || `TMK #${tokenIdNum}`,
              description: metadata.description || '',
              image: ipfsToHttp(metadata.image || ''),
              rawImage: metadata.image || '',
              attributes: metadata.attributes || [],
            });
            continue;
          }
        } catch {
          // IPFS fetch failed, use defaults
        }
        
        // Fallback
        nfts.push({
          tokenId: tokenIdNum,
          name: `TMK #${tokenIdNum}`,
          description: '',
          image: '',
          rawImage: '',
          attributes: [],
        });
      } catch (error) {
        console.error(`Failed to fetch token ${tokenIdNum}:`, error);
        nfts.push({
          tokenId: tokenIdNum,
          name: `TMK #${tokenIdNum}`,
          description: '',
          image: '',
          rawImage: '',
          attributes: [],
        });
      }
    }

    // Sort by token ID
    nfts.sort((a, b) => a.tokenId - b.tokenId);

    const result = { nfts, count: nfts.length };
    metadataCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch NFTs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}
