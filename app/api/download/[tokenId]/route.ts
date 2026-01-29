import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x16F67329271fac6922d7650f87EA59C4C4C3304D';
const CRONOS_RPC = process.env.NEXT_PUBLIC_CRONOS_RPC || 'https://evm.cronos.org';
const TOTAL_SUPPLY = 1503;

// R2 Client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  const walletAddress = request.headers.get('x-wallet-address');

  // Validate wallet address
  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address required' },
      { status: 401 }
    );
  }

  // Validate address format
  if (!ethers.isAddress(walletAddress)) {
    return NextResponse.json(
      { error: 'Invalid wallet address' },
      { status: 400 }
    );
  }

  // Validate token ID
  const tokenIdNum = parseInt(tokenId);
  if (isNaN(tokenIdNum) || tokenIdNum < 1 || tokenIdNum > TOTAL_SUPPLY) {
    return NextResponse.json(
      { error: 'Invalid token ID' },
      { status: 400 }
    );
  }

  try {
    // Verify ownership on-chain
    const provider = new ethers.JsonRpcProvider(CRONOS_RPC);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ['function ownerOf(uint256 tokenId) view returns (address)'],
      provider
    );

    const owner = await contract.ownerOf(tokenIdNum);

    if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'You do not own this NFT' },
        { status: 403 }
      );
    }

    // Generate signed URL (expires in 10 minutes)
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `${tokenIdNum}.blend`,
    });

    const signedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 600, // 10 minutes
    });

    return NextResponse.json({ downloadUrl: signedUrl });

  } catch (error: unknown) {
    console.error('Download error:', error);
    
    const err = error as { message?: string; code?: string };
    
    // Handle "token doesn't exist" error from contract
    if (err.message?.includes('nonexistent') || err.message?.includes('invalid token')) {
      return NextResponse.json(
        { error: 'Token does not exist' },
        { status: 404 }
      );
    }

    // Handle R2 errors
    if (err.code === 'NoSuchKey') {
      return NextResponse.json(
        { error: 'Blender file not found for this token' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify ownership. Please try again.' },
      { status: 500 }
    );
  }
}
