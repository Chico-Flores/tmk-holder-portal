'use client';

import { useLeaderboard } from '@/hooks/usePoints';
import { formatPoints, formatWalletAddress } from '@/lib/points';

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
            <div className="flex items-center gap-4">
              <span className="text-tmk-red font-bold">#{currentUser.rank}</span>
              <span className="text-white">You</span>
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
            <div
              key={user.wallet_address}
              className={`rounded-xl p-4 border transition-all ${rankStyle} ${
                isCurrentUser ? 'ring-2 ring-tmk-red' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 text-center">
                    {rankIcon ? (
                      <span className="text-2xl">{rankIcon}</span>
                    ) : (
                      <span className="text-tmk-gray-400 font-mono">#{user.rank}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isCurrentUser ? 'text-tmk-red' : 'text-white'}`}>
                        {isCurrentUser 
                          ? (user.username || 'You')
                          : (user.username || formatWalletAddress(user.wallet_address))
                        }
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs bg-tmk-red/20 text-tmk-red px-2 py-0.5 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-tmk-gray-500 text-sm">
                      {user.nftCount} NFTs {!user.username && `• ${formatWalletAddress(user.wallet_address)}`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{formatPoints(user.total_points)}</div>
                  <div className="text-tmk-gray-500 text-sm">points</div>
                </div>
              </div>
            </div>
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
    </div>
  );
}
