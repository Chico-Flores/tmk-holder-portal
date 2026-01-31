import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Mark this route as dynamic - uses POST to avoid Vercel edge caching
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse parameters from request body (POST to avoid caching)
    const body = await request.json().catch(() => ({}));
    const limit = parseInt(body.limit || '50');
    const offset = parseInt(body.offset || '0');
    const walletAddress = body.wallet?.toLowerCase();
    const supabase = getSupabaseAdmin();

    // Get top users
    const { data: topUsers, error } = await supabase
      .from('users')
      .select('wallet_address, total_points, created_at, username, profile_nft_id, twitter_handle')
      .order('total_points', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Get NFT counts for each user
    const usersWithNftCounts = await Promise.all(
      (topUsers || []).map(async (user, index) => {
        const { count } = await supabase
          .from('holdings')
          .select('*', { count: 'exact', head: true })
          .eq('wallet_address', user.wallet_address)
          .eq('is_current', true);

        return {
          ...user,
          rank: offset + index + 1,
          nftCount: count || 0,
        };
      })
    );

    // Get total user count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // If wallet provided, get their rank if not in top results
    let currentUserData = null;
    if (walletAddress) {
      const userInList = usersWithNftCounts.find(
        u => u.wallet_address === walletAddress
      );

      if (!userInList) {
        // User not in current page, fetch their data
        const { data: user } = await supabase
          .from('users')
          .select('wallet_address, total_points, created_at, username, profile_nft_id, twitter_handle')
          .eq('wallet_address', walletAddress)
          .single();

        if (user) {
          // Get their rank
          const { count: higherRankedCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gt('total_points', user.total_points);

          // Get their NFT count
          const { count: nftCount } = await supabase
            .from('holdings')
            .select('*', { count: 'exact', head: true })
            .eq('wallet_address', walletAddress)
            .eq('is_current', true);

          currentUserData = {
            ...user,
            rank: (higherRankedCount || 0) + 1,
            nftCount: nftCount || 0,
          };
        }
      } else {
        currentUserData = userInList;
      }
    }

    // Calculate points needed for next rank for current user
    let pointsToNextRank = null;
    if (currentUserData && currentUserData.rank > 1) {
      const nextRankUser = usersWithNftCounts.find(
        u => u.rank === currentUserData!.rank - 1
      );
      if (nextRankUser) {
        pointsToNextRank = nextRankUser.total_points - currentUserData.total_points;
      }
    }

    const response = NextResponse.json({
      leaderboard: usersWithNftCounts,
      totalUsers: totalUsers || 0,
      currentUser: currentUserData,
      pointsToNextRank,
    });
    
    // Prevent any caching at CDN/edge level
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
