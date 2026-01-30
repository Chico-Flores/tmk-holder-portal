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

interface UsePointsReturn {
  user: UserWithRank | null;
  holdings: HoldingWithStats[];
  pointsHistory: PointsLog[];
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  login: () => Promise<{ isNewUser: boolean; bonusAwarded: number } | null>;
}

export function usePoints(walletAddress: string | null): UsePointsReturn {
  const [user, setUser] = useState<UserWithRank | null>(null);
  const [holdings, setHoldings] = useState<HoldingWithStats[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsLog[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!walletAddress) {
      setUser(null);
      setHoldings([]);
      setPointsHistory([]);
      setStats(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/points/user/${walletAddress}`);
      
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
    error,
    refetch: fetchUserData,
    login,
  };
}

// Hook for leaderboard data
interface LeaderboardUser {
  wallet_address: string;
  total_points: number;
  created_at: string;
  rank: number;
  nftCount: number;
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
      const params = new URLSearchParams({ limit: '50' });
      if (walletAddress) {
        params.set('wallet', walletAddress);
      }

      const response = await fetch(`/api/points/leaderboard?${params}`);
      
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
