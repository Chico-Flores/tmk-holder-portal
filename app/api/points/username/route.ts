import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, username } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate username
    const trimmedUsername = username?.trim() || null;
    
    if (trimmedUsername) {
      // Check length
      if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
        return NextResponse.json(
          { error: 'Username must be 3-20 characters' },
          { status: 400 }
        );
      }

      // Check for valid characters (alphanumeric, underscore, dash)
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        return NextResponse.json(
          { error: 'Username can only contain letters, numbers, underscores, and dashes' },
          { status: 400 }
        );
      }

      // Check if username is already taken
      const supabase = getSupabaseAdmin();
      const { data: existingUser } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('username', trimmedUsername)
        .neq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .update({ username: trimmedUsername })
      .eq('wallet_address', walletAddress.toLowerCase())
      .select()
      .single();

    if (error) {
      console.error('Error updating username:', error);
      return NextResponse.json(
        { error: 'Failed to update username' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Username update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
