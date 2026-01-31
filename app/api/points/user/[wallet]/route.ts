import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { calculateDailyPoints, calculateDaysHeld, getNextMilestone } from '@/lib/points';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const walletAddress = wallet.toLowerCase();
    const supabase = getSupabaseAdmin();

    // Use an update query that returns data to force fresh read (bypasses any Supabase caching)
    // This is a workaround for stale SELECT queries
    const now = new Date().toISOString();
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({ last_seen_at: now })
      .eq('wallet_address', walletAddress)
      .select('wallet_address, total_points, first_verified_at, last_seen_at, created_at, username, profile_nft_id, twitter_handle')
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get current holdings
    const { data: holdings } = await supabase
      .from('holdings')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('is_current', true)
      .order('first_seen_at', { ascending: true });

    // Get points history (last 20 entries)
    const { data: pointsHistory } = await supabase
      .from('points_log')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get user rank
    const { count: higherRankedCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', user.total_points);

    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const rank = (higherRankedCount || 0) + 1;

    // Calculate holding stats
    const nftCount = holdings?.length || 0;
    const dailyEarnings = calculateDailyPoints(nftCount);
    
    // Calculate holdings with days held and next milestone
    const holdingsWithStats = holdings?.map(holding => {
      const daysHeld = calculateDaysHeld(holding.first_seen_at);
      const nextMilestone = getNextMilestone(daysHeld);
      const daysUntilMilestone = nextMilestone ? nextMilestone.days - daysHeld : null;

      return {
        ...holding,
        daysHeld,
        nextMilestone,
        daysUntilMilestone,
      };
    }) || [];

    const response = NextResponse.json({
      user: {
        ...user,
        rank,
        totalUsers: totalUsers || 0,
      },
      holdings: holdingsWithStats,
      pointsHistory: pointsHistory || [],
      stats: {
        nftCount,
        dailyEarnings,
        rank,
        totalUsers: totalUsers || 0,
      },
      _debug: {
        serverTime: new Date().toISOString(),
        version: 'v4-update-to-read',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
    });
    
    // Prevent any caching at CDN/edge level
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
