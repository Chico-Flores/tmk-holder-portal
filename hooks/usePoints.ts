'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Holding, PointsLog } from '@/lib/supabase';

interface HoldingWithStats extends Holding {
  daysHeld: number;
  nextMilestone: { days: number; points: number } | null;
  daysUntilMilestone: number | null;
}

interface UserWithRank extends User {
  rank: number;
  totalUsers: number;
}

interface UserStats {
  nftCount: number;
  dailyEarnings: number;
  rank: number;
  totalUsers: number;
}

interface ProfileUpdate {
  profile_nft_id?: number | null;
  twitter_handle?: string | null;
}

interface UsePointsReturn {
  user: UserWithRank | null;
  holdings: HoldingWithStats[];
  pointsHistory: PointsLog[];
  stats: UserStats | null;
  isLoading: boolean;
  hasFetched: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  login: () => Promise<{ isNewUser: boolean; bonusAwarded: number } | null>;
  updateUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (profile: ProfileUpdate) => Promise<{ success: boolean; error?: string }>;
}

export function usePoints(walletAddress: string | null): UsePointsReturn {
  const [user, setUser] = useState<UserWithRank | null>(null);
  const [holdings, setHoldings] = useState<HoldingWithStats[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsLog[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true to prevent premature registration
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false); // Track if we've done initial fetch

  const fetchUserData = useCallback(async () => {
    if (!walletAddress) {
      setUser(null);
      setHoldings([]);
      setPointsHistory([]);
      setStats(null);
      setIsLoading(false);
      setHasFetched(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use POST to avoid Vercel edge caching
      const response = await fetch(`/api/points/user/${walletAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // User not registered yet - this is fine, they need to login first
          setUser(null);
          setHoldings([]);
          setPointsHistory([]);
          setStats(null);
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUser(data.user);
      setHoldings(data.holdings);
      setPointsHistory(data.pointsHistory);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching points data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [walletAddress]);

  const login = useCallback(async () => {
    if (!walletAddress) return null;

    try {
      const response = await fetch('/api/points/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to login');
      }

      const data = await response.json();
      
      // Refetch user data after login
      await fetchUserData();

      return {
        isNewUser: data.isNewUser,
        bonusAwarded: data.bonusAwarded,
      };
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login');
      return null;
    }
  }, [walletAddress, fetchUserData]);

  const updateUsername = useCallback(async (username: string): Promise<{ success: boolean; error?: string }> => {
    if (!walletAddress) return { success: false, error: 'No wallet connected' };

    try {
      const response = await fetch('/api/points/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update username' };
      }

      // Don't refetch here - let updateProfile handle the final refetch
      // Just update local state optimistically
      if (data.user) {
        setUser(prev => prev ? { ...prev, ...data.user } : null);
      }

      return { success: true };
    } catch (err) {
      console.error('Update username error:', err);
      return { success: false, error: 'Failed to update username' };
    }
  }, [walletAddress]);

  const updateProfile = useCallback(async (profile: ProfileUpdate): Promise<{ success: boolean; error?: string }> => {
    if (!walletAddress) return { success: false, error: 'No wallet connected' };

    try {
      const response = await fetch('/api/points/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, ...profile }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update profile' };
      }

      // Refetch all user data to ensure we have the latest from database
      await fetchUserData();

      return { success: true };
    } catch (err) {
      console.error('Update profile error:', err);
      return { success: false, error: 'Failed to update profile' };
    }
  }, [walletAddress, fetchUserData]);

  // Auto-fetch when wallet changes
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    user,
    holdings,
    pointsHistory,
    stats,
    isLoading,
    hasFetched,
    error,
    refetch: fetchUserData,
    login,
    updateUsername,
    updateProfile,
  };
}

// Hook for leaderboard data
interface LeaderboardUser {
  wallet_address: string;
  total_points: number;
  created_at: string;
  rank: number;
  nftCount: number;
  username: string | null;
  profile_nft_id: number | null;
  twitter_handle: string | null;
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardUser[];
  totalUsers: number;
  currentUser: LeaderboardUser | null;
  pointsToNextRank: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLeaderboard(walletAddress: string | null): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [pointsToNextRank, setPointsToNextRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use POST to avoid Vercel edge caching
      const response = await fetch('/api/points/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 50,
          wallet: walletAddress || undefined,
        }),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard);
      setTotalUsers(data.totalUsers);
      setCurrentUser(data.currentUser);
      setPointsToNextRank(data.pointsToNextRank);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    totalUsers,
    currentUser,
    pointsToNextRank,
    isLoading,
    error,
    refetch: fetchLeaderboard,
  };
}
