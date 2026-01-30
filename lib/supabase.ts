import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// Client for browser/public operations
export const getSupabase = (): SupabaseClient => {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key are required');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
};

// Admin client for server-side operations (cron jobs, etc.)
export const getSupabaseAdmin = (): SupabaseClient => {
  if (!_supabaseAdmin) {
    if (!supabaseUrl) {
      throw new Error('Supabase URL is required');
    }
    const key = supabaseServiceKey || supabaseAnonKey;
    if (!key) {
      throw new Error('Supabase key is required');
    }
    _supabaseAdmin = createClient(supabaseUrl, key);
  }
  return _supabaseAdmin;
};

// Legacy exports for backward compatibility (lazy loaded)
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
