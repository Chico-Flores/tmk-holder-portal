import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x16F67329271fac6922d7650f87EA59C4C4C3304D';
const RPC_URL = 'https://evm.cronos.org';

const CONTRACT_ABI = [
  'function tokensOfOwner(address owner) external view returns (uint256[])',
  'function tokenURI(uint256 tokenId) external view returns (string)',
];

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

// Fetch single NFT metadata with timeout
async function fetchNFTMetadata(
  contract: ethers.Contract,
  tokenId: bigint,
  timeoutMs: number = 5000
): Promise<{
  tokenId: number;
  name: string;
  description: string;
  image: string;
  rawImage: string;
  attributes: unknown[];
}> {
  const tokenIdNum = Number(tokenId);
  
  try {
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeoutMs);
    });

    // Fetch tokenURI with timeout
    const tokenURI = await Promise.race([
      contract.tokenURI(tokenId),
      timeoutPromise,
    ]) as string;

    const metadataUrl = ipfsToHttp(tokenURI);
    
    // Fetch metadata with timeout
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(metadataUrl, { signal: controller.signal });
      clearTimeout(fetchTimeout);
      
      if (response.ok) {
        const metadata = await response.json();
        return {
          tokenId: tokenIdNum,
          name: metadata.name || `TMK #${tokenIdNum}`,
          description: metadata.description || '',
          image: ipfsToHttp(metadata.image || ''),
          rawImage: metadata.image || '',
          attributes: metadata.attributes || [],
        };
      }
    } catch {
      clearTimeout(fetchTimeout);
    }
  } catch (error) {
    console.log(`Token ${tokenIdNum} fetch failed:`, error);
  }

  // Return fallback
  return {
    tokenId: tokenIdNum,
    name: `TMK #${tokenIdNum}`,
    description: '',
    image: '',
    rawImage: '',
    attributes: [],
  };
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

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    // Get token IDs (this is fast)
    const tokenIds: bigint[] = await contract.tokensOfOwner(address);

    if (tokenIds.length === 0) {
      return NextResponse.json({ nfts: [], count: 0 });
    }

    // Fetch all metadata in parallel with individual timeouts
    const nftPromises = tokenIds.map(tokenId => 
      fetchNFTMetadata(contract, tokenId, 5000)
    );

    const nfts = await Promise.all(nftPromises);

    // Sort by token ID
    nfts.sort((a, b) => a.tokenId - b.tokenId);

    return NextResponse.json({ nfts, count: nfts.length });
  } catch (error) {
    console.error('Failed to fetch NFTs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFTs. Please try again.' },
      { status: 500 }
    );
  }
}

// Set max duration for Vercel (hobby = 10s, pro = 60s)
export const maxDuration = 10;
