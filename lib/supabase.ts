import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Client for browser/public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (cron jobs, etc.)
// Only use this in API routes, never expose to client
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

// Database types
export interface User {
  wallet_address: string;
  total_points: number;
  first_verified_at: string | null;
  last_seen_at: string | null;
  created_at: string;
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
