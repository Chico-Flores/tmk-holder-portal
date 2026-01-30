import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client for browser/public operations
// Creates a fresh client each request to avoid stale data in serverless environments
export const getSupabase = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!url || !anonKey) {
    throw new Error('Supabase URL and Anon Key are required');
  }
  
  return createClient(url, anonKey);
};

// Admin client for server-side operations (cron jobs, etc.)
// Creates a fresh client each request to avoid stale data in serverless environments
export const getSupabaseAdmin = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!url) {
    throw new Error('Supabase URL is required');
  }
  
  const key = serviceKey || anonKey;
  if (!key) {
    throw new Error('Supabase key is required');
  }
  
  return createClient(url, key);
};

// Legacy exports for backward compatibility
export const supabase = { get client() { return getSupabase(); } };
export const supabaseAdmin = { get client() { return getSupabaseAdmin(); } };

// Database types
export interface User {
  wallet_address: string;
  total_points: number;
  first_verified_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  username: string | null;
  profile_nft_id: number | null;
  twitter_handle: string | null;
}

export interface Holding {
  id: number;
  wallet_address: string;
  token_id: number;
  first_seen_at: string;
  last_seen_at: string;
  is_current: boolean;
  milestone_30d_awarded: boolean;
  milestone_90d_awarded: boolean;
  milestone_365d_awarded: boolean;
}

export interface PointsLog {
  id: number;
  wallet_address: string;
  amount: number;
  source: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  point_cost: number;
  image_url: string | null;
  quantity_available: number | null;
  quantity_claimed: number;
  is_active: boolean;
}
