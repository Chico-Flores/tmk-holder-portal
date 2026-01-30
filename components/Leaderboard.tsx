'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/hooks/usePoints';
import { formatPoints, formatWalletAddress } from '@/lib/points';
import { UserProfileModal } from './UserProfileModal';

// R2 public URL for images
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

interface LeaderboardProps {
  walletAddress: string | null;
}

export function Leaderboard({ walletAddress }: LeaderboardProps) {
  const { 
    leaderboard, 
    totalUsers, 
    currentUser, 
    pointsToNextRank, 
    isLoading, 
    error 
  } = useLeaderboard(walletAddress);

  const [selectedUserWallet, setSelectedUserWallet] = useState<string | null>(null);

  const handleUserClick = (userWallet: string) => {
    setSelectedUserWallet(userWallet);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-tmk-gray-900 rounded-xl p-4 border border-tmk-gray-800">
            <div className="h-6 bg-tmk-gray-800 rounded w-full"></div>
          </div>
        ))}
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-900/30 border-yellow-700/50';
      case 2: return 'bg-gray-600/20 border-gray-500/50';
      case 3: return 'bg-orange-900/20 border-orange-700/50';
      default: return 'bg-tmk-gray-900 border-tmk-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white font-heading">TMK LEADERBOARD</h2>
        <p className="text-tmk-gray-400 mt-1">{totalUsers} total holders</p>
      </div>

      {/* Current User Stats (if not in top visible) */}
      {currentUser && currentUser.rank > 50 && (
        <div className="bg-tmk-red/20 border border-tmk-red/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-tmk-red font-bold">#{currentUser.rank}</span>
              {/* Profile Picture */}
              {currentUser.profile_nft_id && R2_PUBLIC_URL ? (
                <img
                  src={`${R2_PUBLIC_URL}/images/${currentUser.profile_nft_id}.png`}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-tmk-red/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-tmk-gray-800 border border-tmk-red/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-tmk-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              <span className="text-white">{currentUser.username || 'You'}</span>
              <span className="text-tmk-gray-400 text-sm">{currentUser.nftCount} NFTs</span>
            </div>
            <span className="text-white font-bold">{formatPoints(currentUser.total_points)} pts</span>
          </div>
          {pointsToNextRank && (
            <p className="text-tmk-gray-400 text-sm mt-2">
              {formatPoints(pointsToNextRank)} points behind #{currentUser.rank - 1}
            </p>
          )}
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-3">
        {leaderboard.map((user) => {
          const isCurrentUser = walletAddress?.toLowerCase() === user.wallet_address;
          const rankIcon = getRankIcon(user.rank);
          const rankStyle = getRankStyle(user.rank);

          return (
            <button
              key={user.wallet_address}
              onClick={() => handleUserClick(user.wallet_address)}
              className={`w-full rounded-xl p-4 border transition-all cursor-pointer hover:bg-tmk-gray-800/50 ${rankStyle} ${
                isCurrentUser ? 'ring-2 ring-tmk-red' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="w-10 text-center flex-shrink-0">
                    {rankIcon ? (
                      <span className="text-2xl">{rankIcon}</span>
                    ) : (
                      <span className="text-tmk-gray-400 font-mono">#{user.rank}</span>
                    )}
                  </div>
                  
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    {user.profile_nft_id && R2_PUBLIC_URL ? (
                      <img
                        src={`${R2_PUBLIC_URL}/images/${user.profile_nft_id}.png`}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-tmk-gray-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-tmk-gray-800 border border-tmk-gray-700 flex items-center justify-center">
                        <svg className="w-5 h-5 text-tmk-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Name and Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${isCurrentUser ? 'text-tmk-red' : 'text-white'}`}>
                        {isCurrentUser 
                          ? (user.username || 'You')
                          : (user.username || formatWalletAddress(user.wallet_address))
                        }
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs bg-tmk-red/20 text-tmk-red px-2 py-0.5 rounded flex-shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-tmk-gray-500 text-sm">
                      <span>{user.nftCount} NFTs</span>
                      {!user.username && <span>• {formatWalletAddress(user.wallet_address)}</span>}
                    </div>
                  </div>
                </div>
                
                {/* Points and Twitter */}
                <div className="flex items-center gap-3">
                  {/* Twitter Link */}
                  {user.twitter_handle && (
                    <a
                      href={`https://x.com/${user.twitter_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-tmk-gray-400 hover:text-white hover:bg-tmk-gray-800 rounded-lg transition-colors"
                      title={`@${user.twitter_handle}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                  )}
                  
                  {/* Points */}
                  <div className="text-right">
                    <div className="text-white font-bold">{formatPoints(user.total_points)}</div>
                    <div className="text-tmk-gray-500 text-sm">points</div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Your Stats Section */}
      {currentUser && (
        <div className="bg-tmk-gray-900 rounded-2xl p-6 border border-tmk-gray-800 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Your Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-tmk-red">#{currentUser.rank}</div>
              <div className="text-tmk-gray-500 text-sm">Rank</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {totalUsers > 0 ? Math.round((1 - (currentUser.rank - 1) / totalUsers) * 100) : 0}%
              </div>
              <div className="text-tmk-gray-500 text-sm">Top</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {pointsToNextRank ? formatPoints(pointsToNextRank) : '—'}
              </div>
              <div className="text-tmk-gray-500 text-sm">To Next Rank</div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {leaderboard.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Rankings Yet</h3>
          <p className="text-tmk-gray-400">Be the first to earn points and claim the top spot!</p>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={selectedUserWallet !== null}
        onClose={() => setSelectedUserWallet(null)}
        walletAddress={selectedUserWallet}
      />
    </div>
  );
}
