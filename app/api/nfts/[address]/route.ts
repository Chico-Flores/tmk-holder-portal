import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x16F67329271fac6922d7650f87EA59C4C4C3304D';
const RPC_URL = 'https://evm.cronos.org';

const CONTRACT_ABI = [
  'function tokensOfOwner(address owner) external view returns (uint256[])',
];

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

    // Get token IDs (this is fast - single contract call)
    const tokenIds: bigint[] = await contract.tokensOfOwner(address);

    if (tokenIds.length === 0) {
      return NextResponse.json({ nfts: [], count: 0 });
    }

    // Convert to NFT objects with just token IDs
    // Images will be loaded from R2 by the client using the token ID
    const nfts = tokenIds
      .map(id => {
        const tokenId = Number(id);
        return {
          tokenId,
          name: `TMK #${tokenId}`,
          description: '',
          image: '', // Will be loaded from R2
          rawImage: '',
          attributes: [],
        };
      })
      .sort((a, b) => a.tokenId - b.tokenId);

    return NextResponse.json({ nfts, count: nfts.length });
  } catch (error) {
    console.error('Failed to fetch NFTs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFTs. Please try again.' },
      { status: 500 }
    );
  }
}

// Fast endpoint - should complete quickly
export const maxDuration = 10;
