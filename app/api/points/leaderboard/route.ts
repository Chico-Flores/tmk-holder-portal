import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Mark this route as dynamic since it uses searchParams
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const walletAddress = searchParams.get('wallet')?.toLowerCase();

    // Get top users
    const { data: topUsers, error } = await supabaseAdmin
      .from('users')
      .select('wallet_address, total_points, created_at')
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
        const { count } = await supabaseAdmin
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
    const { count: totalUsers } = await supabaseAdmin
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
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('wallet_address, total_points, created_at')
          .eq('wallet_address', walletAddress)
          .single();

        if (user) {
          // Get their rank
          const { count: higherRankedCount } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gt('total_points', user.total_points);

          // Get their NFT count
          const { count: nftCount } = await supabaseAdmin
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

    return NextResponse.json({
      leaderboard: usersWithNftCounts,
      totalUsers: totalUsers || 0,
      currentUser: currentUserData,
      pointsToNextRank,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
