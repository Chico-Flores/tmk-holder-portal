import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { POINTS_CONFIG, POINT_SOURCES } from '@/lib/points';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const supabase = getSupabaseAdmin();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', normalizedAddress)
      .single();

    const now = new Date().toISOString();

    if (existingUser) {
      // Update last_seen_at and get fresh user data
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ last_seen_at: now })
        .eq('wallet_address', normalizedAddress)
        .select('wallet_address, total_points, first_verified_at, last_seen_at, created_at, username, profile_nft_id, twitter_handle')
        .single();

      // Sync holdings
      await syncHoldings(normalizedAddress);

      return NextResponse.json({
        user: updatedUser || existingUser,
        isNewUser: false,
        bonusAwarded: 0,
      });
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        wallet_address: normalizedAddress,
        total_points: POINTS_CONFIG.FIRST_VERIFICATION_BONUS,
        first_verified_at: now,
        last_seen_at: now,
        created_at: now,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Log the first verification bonus
    await supabase.from('points_log').insert({
      wallet_address: normalizedAddress,
      amount: POINTS_CONFIG.FIRST_VERIFICATION_BONUS,
      source: POINT_SOURCES.FIRST_VERIFICATION,
      description: 'First wallet verification bonus',
      metadata: {},
    });

    // Sync holdings for new user
    await syncHoldings(normalizedAddress);

    return NextResponse.json({
      user: newUser,
      isNewUser: true,
      bonusAwarded: POINTS_CONFIG.FIRST_VERIFICATION_BONUS,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Sync user's current NFT holdings from on-chain
 */
async function syncHoldings(walletAddress: string) {
  try {
    const supabase = getSupabaseAdmin();
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    // Get current token IDs owned
    const tokenIds = await contract.tokensOfOwner(walletAddress);
    const currentTokenIds = tokenIds.map((id: bigint) => Number(id));

    const now = new Date().toISOString();

    // Get existing holdings
    const { data: existingHoldings } = await supabase
      .from('holdings')
      .select('*')
      .eq('wallet_address', walletAddress);

    const existingTokenIds = existingHoldings?.map(h => h.token_id) || [];

    // Mark sold NFTs as not current
    const soldTokenIds = existingTokenIds.filter(id => !currentTokenIds.includes(id));
    if (soldTokenIds.length > 0) {
      await supabase
        .from('holdings')
        .update({ is_current: false, last_seen_at: now })
        .eq('wallet_address', walletAddress)
        .in('token_id', soldTokenIds);
    }

    // Add new holdings or update existing
    for (const tokenId of currentTokenIds) {
      const existing = existingHoldings?.find(h => h.token_id === tokenId);

      if (existing) {
        // Update last_seen and mark as current
        await supabase
          .from('holdings')
          .update({ is_current: true, last_seen_at: now })
          .eq('id', existing.id);
      } else {
        // Insert new holding
        await supabase.from('holdings').insert({
          wallet_address: walletAddress,
          token_id: tokenId,
          first_seen_at: now,
          last_seen_at: now,
          is_current: true,
        });
      }
    }
  } catch (error) {
    console.error('Error syncing holdings:', error);
  }
}
