'use client';

import { useEffect, useState } from 'react';
import { usePoints } from '@/hooks/usePoints';
import { formatPoints, getDailyRateDescription, POINTS_CONFIG } from '@/lib/points';
import { ProfileSettings } from './ProfileSettings';

// R2 public URL for images
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

interface PointsDashboardProps {
  walletAddress: string;
  onLogin: () => Promise<void>;
}

export function PointsDashboard({ walletAddress, onLogin }: PointsDashboardProps) {
  const { user, holdings, pointsHistory, stats, isLoading, hasFetched, error, login, refetch, updateUsername, updateProfile } = usePoints(walletAddress);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeBonus, setWelcomeBonus] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // Auto-login only when we've fetched and confirmed user doesn't exist
  useEffect(() => {
    async function registerUser() {
      // Only register if: we've fetched data, user doesn't exist, not already registering
      if (hasFetched && !isLoading && !user && walletAddress && !isRegistering) {
        setIsRegistering(true);
        const result = await login();
        if (result?.isNewUser && result.bonusAwarded > 0) {
          setWelcomeBonus(result.bonusAwarded);
          setShowWelcome(true);
          setTimeout(() => setShowWelcome(false), 5000);
        }
        setIsRegistering(false);
      }
    }
    registerUser();
  }, [hasFetched, isLoading, user, walletAddress, login, isRegistering]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleSaveProfile = async (username: string | null, profileNftId: number | null, twitterHandle: string | null) => {
    // Save username if changed
    if (username !== user?.username) {
      const usernameResult = await updateUsername(username || '');
      if (!usernameResult.success) {
        return usernameResult;
      }
    }
    // Save profile settings
    return await updateProfile({ profile_nft_id: profileNftId, twitter_handle: twitterHandle });
  };

  // Get profile picture URL
  const profilePicUrl = user?.profile_nft_id && R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/images/${user.profile_nft_id}.png`
    : null;

  // Show loading only for initial load or registration
  if (isLoading || isRegistering) {
    // Determine what message to show
    let title = 'Loading your points...';
    let subtitle = 'Please wait';
    
    if (isRegistering) {
      title = 'Registering your wallet...';
      subtitle = 'Syncing your NFT holdings';
    } else if (!hasFetched) {
      title = 'Loading your points...';
      subtitle = 'Fetching your data';
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-tmk-gray-900 rounded-2xl p-8 border border-tmk-gray-800 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-tmk-red border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-white font-medium">{title}</p>
              <p className="text-tmk-gray-400 text-sm mt-1">{subtitle}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-tmk-gray-900 rounded-xl p-6 border border-tmk-gray-800 animate-pulse">
              <div className="h-4 bg-tmk-gray-800 rounded w-20 mb-2"></div>
              <div className="h-8 bg-tmk-gray-800 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 text-red-200 px-6 py-4 rounded-xl">
        {error}
      </div>
    );
  }

  const totalPoints = user?.total_points || 0;
  const nftCount = stats?.nftCount || 0;
  const dailyEarnings = stats?.dailyEarnings || 0;
  const rank = user?.rank || 0;
  const totalUsers = user?.totalUsers || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Bonus Toast */}
      {showWelcome && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in">
          <div className="bg-green-900/90 border border-green-700 text-green-100 px-6 py-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold">Welcome Bonus!</p>
                <p className="text-sm">+{welcomeBonus} points awarded</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Points Display */}
      <div className="bg-tmk-gray-900 rounded-2xl p-8 border border-tmk-gray-800 text-center relative">
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="absolute top-4 right-4 p-2 text-tmk-gray-400 hover:text-white 
                     hover:bg-tmk-gray-800 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh points"
        >
          <svg 
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        {/* Profile Section */}
        <div className="flex flex-col items-center gap-3 mb-6">
          {/* Profile Picture */}
          <div className="relative">
            {profilePicUrl ? (
              <img
                src={profilePicUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-tmk-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-tmk-gray-800 border-2 border-tmk-gray-700 flex items-center justify-center">
                <svg className="w-10 h-10 text-tmk-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Username and Twitter */}
          <div className="flex flex-col items-center gap-1">
            {user?.username ? (
              <span className="text-xl font-semibold text-white">{user.username}</span>
            ) : (
              <span className="text-tmk-gray-500 italic">No username set</span>
            )}
            {user?.twitter_handle && (
              <a
                href={`https://x.com/${user.twitter_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-tmk-gray-400 hover:text-white transition-colors text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>@{user.twitter_handle}</span>
              </a>
            )}
            {/* Edit Profile Button */}
            <button
              onClick={() => setShowProfileSettings(true)}
              className="mt-2 px-4 py-1.5 text-sm text-tmk-gray-400 hover:text-white 
                         border border-tmk-gray-700 hover:border-tmk-gray-600 rounded-lg transition-colors
                         flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </button>
          </div>
        </div>
        
        <h2 className="text-tmk-gray-400 text-lg mb-2">YOUR POINTS</h2>
        <div className="text-5xl sm:text-6xl font-bold text-white mb-4 font-heading">
          {formatPoints(totalPoints)}
        </div>
        {rank > 0 && (
          <p className="text-tmk-gray-400">
            Rank <span className="text-tmk-red font-semibold">#{rank}</span> of {totalUsers} holders
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-tmk-gray-900 rounded-xl p-6 border border-tmk-gray-800">
          <div className="text-tmk-gray-400 text-sm mb-1">HOLDING</div>
          <div className="text-2xl font-bold text-white">{nftCount} NFT{nftCount !== 1 ? 's' : ''}</div>
          <div className="text-tmk-gray-500 text-sm mt-1">
            {getDailyRateDescription(nftCount)}
          </div>
        </div>

        <div className="bg-tmk-gray-900 rounded-xl p-6 border border-tmk-gray-800">
          <div className="text-tmk-gray-400 text-sm mb-1">DAILY EARNINGS</div>
          <div className="text-2xl font-bold text-green-400">+{formatPoints(dailyEarnings)}</div>
          <div className="text-tmk-gray-500 text-sm mt-1">points per day</div>
        </div>

        <div className="bg-tmk-gray-900 rounded-xl p-6 border border-tmk-gray-800">
          <div className="text-tmk-gray-400 text-sm mb-1">BONUS RATE</div>
          <div className="text-2xl font-bold text-white">
            {nftCount >= POINTS_CONFIG.BONUS_THRESHOLD ? (
              <span className="text-tmk-red">Active!</span>
            ) : (
              <span>{POINTS_CONFIG.BONUS_THRESHOLD - nftCount} more</span>
            )}
          </div>
          <div className="text-tmk-gray-500 text-sm mt-1">
            {nftCount >= POINTS_CONFIG.BONUS_THRESHOLD 
              ? '15 pts/NFT/day' 
              : `to unlock ${POINTS_CONFIG.DAILY_POINTS_PER_NFT_BONUS} pts/day`}
          </div>
        </div>
      </div>

      {/* Holdings with Milestones */}
      {holdings.length > 0 && (
        <div className="bg-tmk-gray-900 rounded-2xl p-6 border border-tmk-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Your Holdings</h3>
          <div className="space-y-3">
            {holdings.slice(0, 5).map((holding) => (
              <div 
                key={holding.token_id}
                className="flex items-center justify-between py-3 border-b border-tmk-gray-800 last:border-0"
              >
                <div>
                  <span className="text-white font-medium">Token #{holding.token_id}</span>
                  <span className="text-tmk-gray-500 text-sm ml-2">
                    {holding.daysHeld} days held
                  </span>
                </div>
                {holding.nextMilestone && (
                  <div className="text-right">
                    <span className="text-tmk-gray-400 text-sm">
                      {holding.daysUntilMilestone} days to
                    </span>
                    <span className="text-tmk-red text-sm ml-1">
                      +{formatPoints(holding.nextMilestone.points)} pts
                    </span>
                  </div>
                )}
                {!holding.nextMilestone && (
                  <span className="text-green-400 text-sm">All milestones achieved!</span>
                )}
              </div>
            ))}
            {holdings.length > 5 && (
              <p className="text-tmk-gray-500 text-sm text-center pt-2">
                +{holdings.length - 5} more NFTs
              </p>
            )}
          </div>
        </div>
      )}

      {/* Points History */}
      <div className="bg-tmk-gray-900 rounded-2xl p-6 border border-tmk-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Points History</h3>
        {pointsHistory.length === 0 ? (
          <p className="text-tmk-gray-500 text-center py-4">
            No points activity yet. Hold NFTs to start earning!
          </p>
        ) : (
          <div className="space-y-3">
            {pointsHistory.map((entry) => (
              <div 
                key={entry.id}
                className="flex items-center justify-between py-3 border-b border-tmk-gray-800 last:border-0"
              >
                <div>
                  <span className="text-green-400 font-medium">+{formatPoints(entry.amount)}</span>
                  <span className="text-tmk-gray-400 ml-2">{entry.description}</span>
                </div>
                <span className="text-tmk-gray-500 text-sm">
                  {formatTimeAgo(entry.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to Earn More */}
      <div className="bg-tmk-gray-900 rounded-2xl p-6 border border-tmk-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">How to Earn More</h3>
        <ul className="space-y-3 text-tmk-gray-300">
          <li className="flex items-start gap-3">
            <span className="text-tmk-red">•</span>
            <span>Hold more NFTs — 5+ NFTs unlocks bonus rate (15 pts/NFT/day)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-tmk-red">•</span>
            <span>Hold longer — Earn milestone bonuses at 30, 90, and 365 days</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-tmk-gray-500">•</span>
            <span className="text-tmk-gray-500">Coming soon: Discord integration rewards</span>
          </li>
        </ul>
      </div>

      {/* Profile Settings Modal */}
      <ProfileSettings
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        holdings={holdings}
        currentUsername={user?.username || null}
        currentProfileNftId={user?.profile_nft_id || null}
        currentTwitterHandle={user?.twitter_handle || null}
        onSave={handleSaveProfile}
      />
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
