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
    const imageUrl = `${R2_PUBLIC_URL}/images/${tokenIdNum}.png`;
    
    // Fetch image from R2
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Get the image data
    const imageData = await response.arrayBuffer();

    // Return as downloadable file
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="TMK_${tokenIdNum}.png"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image download error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
