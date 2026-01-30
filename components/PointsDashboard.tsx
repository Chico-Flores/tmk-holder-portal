'use client';

import { useEffect, useState } from 'react';
import { usePoints } from '@/hooks/usePoints';
import { formatPoints, getDailyRateDescription, POINTS_CONFIG } from '@/lib/points';

interface PointsDashboardProps {
  walletAddress: string;
  onLogin: () => Promise<void>;
}

export function PointsDashboard({ walletAddress, onLogin }: PointsDashboardProps) {
  const { user, holdings, pointsHistory, stats, isLoading, error, login, refetch, updateUsername } = usePoints(walletAddress);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeBonus, setWelcomeBonus] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Auto-login when user doesn't exist
  useEffect(() => {
    async function registerUser() {
      if (!isLoading && !user && walletAddress && !isRegistering) {
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
  }, [isLoading, user, walletAddress, login, isRegistering]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleSaveUsername = async () => {
    setUsernameError(null);
    setIsSavingUsername(true);
    
    const result = await updateUsername(usernameInput);
    
    if (result.success) {
      setIsEditingUsername(false);
    } else {
      setUsernameError(result.error || 'Failed to save username');
    }
    
    setIsSavingUsername(false);
  };

  const startEditingUsername = () => {
    setUsernameInput(user?.username || '');
    setUsernameError(null);
    setIsEditingUsername(true);
  };

  if (isLoading || isRegistering) {
    return (
      <div className="space-y-6">
        <div className="bg-tmk-gray-900 rounded-2xl p-8 border border-tmk-gray-800 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-tmk-red border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-white font-medium">
                {isRegistering ? 'Registering your wallet...' : 'Loading your points...'}
              </p>
              <p className="text-tmk-gray-400 text-sm mt-1">
                {isRegistering ? 'Syncing your NFT holdings' : 'Please wait'}
              </p>
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
        
        {/* Username Display/Editor */}
        {!isEditingUsername ? (
          <div className="flex items-center justify-center gap-2 mb-4">
            {user?.username ? (
              <span className="text-xl font-semibold text-white">{user.username}</span>
            ) : (
              <span className="text-tmk-gray-500 italic">No username set</span>
            )}
            <button
              onClick={startEditingUsername}
              className="p-1 text-tmk-gray-400 hover:text-white transition-colors"
              title="Edit username"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter username"
                maxLength={20}
                className="flex-1 px-3 py-2 bg-tmk-gray-800 border border-tmk-gray-700 rounded-lg
                           text-white placeholder-tmk-gray-500 focus:outline-none focus:border-tmk-red"
              />
              <button
                onClick={handleSaveUsername}
                disabled={isSavingUsername}
                className="px-3 py-2 bg-tmk-red hover:bg-tmk-red-hover text-white rounded-lg
                           disabled:opacity-50 transition-colors"
              >
                {isSavingUsername ? '...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditingUsername(false)}
                className="px-3 py-2 bg-tmk-gray-700 hover:bg-tmk-gray-600 text-white rounded-lg
                           transition-colors"
              >
                Cancel
              </button>
            </div>
            {usernameError && (
              <p className="text-red-400 text-sm mt-2">{usernameError}</p>
            )}
            <p className="text-tmk-gray-500 text-xs mt-2">3-20 characters, letters, numbers, _ and - only</p>
          </div>
        )}
        
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
