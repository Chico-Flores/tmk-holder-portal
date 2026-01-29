import { NextRequest, NextResponse } from 'next/server';

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

// Cache rankings in memory (they don't change)
let rankingsCache: Record<string, number> | null = null;

async function getRankings(): Promise<Record<string, number>> {
  if (rankingsCache) return rankingsCache;
  
  try {
    const response = await fetch(`${R2_PUBLIC_URL}/rankings.json`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    if (response.ok) {
      rankingsCache = await response.json();
      return rankingsCache!;
    }
  } catch (error) {
    console.error('Failed to fetch rankings:', error);
  }
  
  return {};
}

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
    // Fetch metadata and rankings in parallel
    const [metadataResponse, rankings] = await Promise.all([
      fetch(`${R2_PUBLIC_URL}/metadata/${tokenIdNum}.json`, {
        next: { revalidate: 3600 },
      }),
      getRankings(),
    ]);
    
    if (!metadataResponse.ok) {
      return NextResponse.json(
        { error: 'Metadata not found' },
        { status: 404 }
      );
    }

    const metadata = await metadataResponse.json();
    
    // Add rank to metadata
    const rank = rankings[String(tokenIdNum)] || null;

    return NextResponse.json(
      { ...metadata, rank, totalSupply: 1500 },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      }
    );
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
