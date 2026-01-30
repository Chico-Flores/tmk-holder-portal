import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, profile_nft_id, twitter_handle } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const supabase = getSupabaseAdmin();

    // Validate profile_nft_id if provided
    if (profile_nft_id !== null && profile_nft_id !== undefined) {
      // Verify the user owns this NFT
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      try {
        const owner = await contract.ownerOf(profile_nft_id);
        if (owner.toLowerCase() !== normalizedAddress) {
          return NextResponse.json(
            { error: 'You do not own this NFT' },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid NFT ID' },
          { status: 400 }
        );
      }
    }

    // Validate twitter_handle if provided
    let cleanTwitterHandle: string | null = null;
    if (twitter_handle) {
      // Remove @ prefix if present
      const trimmed = twitter_handle.replace(/^@/, '').trim();
      
      // Validate format (alphanumeric and underscore only, max 15 chars)
      if (trimmed.length > 0) {
        if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
          return NextResponse.json(
            { error: 'Twitter handle can only contain letters, numbers, and underscores' },
            { status: 400 }
          );
        }
        if (trimmed.length > 15) {
          return NextResponse.json(
            { error: 'Twitter handle must be 15 characters or less' },
            { status: 400 }
          );
        }
        cleanTwitterHandle = trimmed;
      }
    }

    // Build update data - always include both fields to ensure they're set
    const updateData: Record<string, unknown> = {
      profile_nft_id: profile_nft_id ?? null,
      twitter_handle: cleanTwitterHandle,
    };

    console.log('Updating profile for:', normalizedAddress, 'with data:', updateData);

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('wallet_address', normalizedAddress)
      .select('wallet_address, total_points, first_verified_at, last_seen_at, created_at, username, profile_nft_id, twitter_handle')
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile: ' + error.message },
        { status: 500 }
      );
    }

    if (!data) {
      console.error('No data returned after profile update');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Profile updated successfully:', data);
    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
