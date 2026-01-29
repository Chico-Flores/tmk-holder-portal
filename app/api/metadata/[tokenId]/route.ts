import { NextRequest, NextResponse } from 'next/server';

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;

  // Validate token ID
  const tokenIdNum = parseInt(tokenId, 10);
  if (isNaN(tokenIdNum) || tokenIdNum < 1) {
    return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
  }

  if (!R2_PUBLIC_URL) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 500 });
  }

  try {
    const metadataUrl = `${R2_PUBLIC_URL}/metadata/${tokenIdNum}.json`;
    
    const response = await fetch(metadataUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Metadata not found' },
        { status: 404 }
      );
    }

    const metadata = await response.json();

    return NextResponse.json(metadata, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
