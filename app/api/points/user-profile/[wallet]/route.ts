import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST to avoid Vercel edge caching
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const walletAddress = wallet.toLowerCase();
    const supabase = getSupabaseAdmin();

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('wallet_address, total_points, username, profile_nft_id, twitter_handle, created_at')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's rank
    const { count: usersAbove } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', user.total_points);

    const rank = (usersAbove || 0) + 1;

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get user's current NFT holdings (limited to first 12 for display)
    const { data: holdings } = await supabase
      .from('holdings')
      .select('token_id, first_seen_at')
      .eq('wallet_address', walletAddress)
      .eq('is_current', true)
      .order('token_id', { ascending: true })
      .limit(12);

    // Get total holdings count
    const { count: totalHoldings } = await supabase
      .from('holdings')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_address', walletAddress)
      .eq('is_current', true);

    const response = NextResponse.json({
      user: {
        ...user,
        rank,
        totalUsers: totalUsers || 0,
      },
      holdings: holdings || [],
      totalHoldings: totalHoldings || 0,
    });
    
    // Prevent any caching at CDN/edge level
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
