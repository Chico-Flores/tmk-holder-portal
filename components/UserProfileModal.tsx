'use client';

import { useState, useEffect } from 'react';
import { formatPoints, formatWalletAddress } from '@/lib/points';

// R2 public URL for images
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

interface UserProfileData {
  wallet_address: string;
  total_points: number;
  username: string | null;
  profile_nft_id: number | null;
  twitter_handle: string | null;
  created_at: string;
  rank: number;
  totalUsers: number;
}

interface Holding {
  token_id: number;
  first_seen_at: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string | null;
}

// NFT rank tier colors (same as NFTDetailModal)
const getRankTier = (rank: number) => {
  if (rank <= 50) return 'legendary';
  if (rank <= 150) return 'epic';
  if (rank <= 375) return 'rare';
  if (rank <= 750) return 'uncommon';
  if (rank <= 1200) return 'common';
  return 'basic';
};

const rankColors: Record<string, string> = {
  legendary: 'from-yellow-400 to-amber-500 text-black',
  epic: 'from-purple-500 to-pink-500 text-white',
  rare: 'from-blue-500 to-cyan-500 text-white',
  uncommon: 'from-emerald-500 to-green-600 text-white',
  common: 'from-teal-600 to-cyan-700 text-white',
  basic: 'from-slate-400 to-slate-500 text-white',
};

export function UserProfileModal({ isOpen, onClose, walletAddress }: UserProfileModalProps) {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalHoldings, setTotalHoldings] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enlargedNft, setEnlargedNft] = useState<number | null>(null);
  const [nftRank, setNftRank] = useState<number | null>(null);
  const [nftRankLoading, setNftRankLoading] = useState(false);

  useEffect(() => {
    if (isOpen && walletAddress) {
      fetchUserProfile();
    }
  }, [isOpen, walletAddress]);

  // Fetch NFT rank when an NFT is enlarged
  useEffect(() => {
    if (enlargedNft) {
      setNftRankLoading(true);
      setNftRank(null);
      
      fetch(`/api/metadata/${enlargedNft}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.rank) {
            setNftRank(data.rank);
          }
        })
        .catch(console.error)
        .finally(() => setNftRankLoading(false));
    }
  }, [enlargedNft]);

  const fetchUserProfile = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use POST to avoid Vercel edge caching
      const response = await fetch(`/api/points/user-profile/${walletAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setUser(data.user);
      setHoldings(data.holdings);
      setTotalHoldings(data.totalHoldings);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const profilePicUrl = user?.profile_nft_id && R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/images/${user.profile_nft_id}.png`
    : null;

  const displayName = user?.username || formatWalletAddress(walletAddress || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-tmk-gray-900 border border-tmk-gray-800 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-tmk-gray-400 hover:text-white transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-tmk-red border-t-transparent rounded-full animate-spin"></div>
            <p className="text-tmk-gray-400 mt-4">Loading profile...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : user ? (
          <>
            {/* Profile Header */}
            <div className="p-6 text-center border-b border-tmk-gray-800">
              {/* Profile Picture */}
              <div className="flex justify-center mb-4">
                {profilePicUrl ? (
                  <img
                    src={profilePicUrl}
                    alt={displayName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-tmk-gray-700"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-tmk-gray-800 border-4 border-tmk-gray-700 flex items-center justify-center">
                    <svg className="w-12 h-12 text-tmk-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Name */}
              <h2 className="text-xl font-bold text-white mb-1">{displayName}</h2>
              
              {/* Wallet Address (if different from username) */}
              {user.username && (
                <p className="text-tmk-gray-500 text-sm mb-2">
                  {formatWalletAddress(user.wallet_address)}
                </p>
              )}

              {/* Twitter Handle */}
              {user.twitter_handle && (
                <a
                  href={`https://x.com/${user.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-tmk-gray-800 hover:bg-tmk-gray-700 
                             rounded-full text-tmk-gray-300 hover:text-white transition-colors text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>@{user.twitter_handle}</span>
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-tmk-gray-800 border-b border-tmk-gray-800">
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{formatPoints(user.total_points)}</div>
                <div className="text-tmk-gray-500 text-sm">Points</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-tmk-red">#{user.rank}</div>
                <div className="text-tmk-gray-500 text-sm">Rank</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{totalHoldings}</div>
                <div className="text-tmk-gray-500 text-sm">NFTs</div>
              </div>
            </div>

            {/* NFT Holdings - Scrollable */}
            {holdings.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-tmk-gray-400 mb-3">
                  TMK NFTs Owned ({totalHoldings})
                </h3>
                <div className="max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  <div className="grid grid-cols-4 gap-2">
                    {holdings.map((holding) => {
                      const imageUrl = R2_PUBLIC_URL 
                        ? `${R2_PUBLIC_URL}/images/${holding.token_id}.png`
                        : '';

                      return (
                        <button
                          key={holding.token_id}
                          onClick={() => setEnlargedNft(holding.token_id)}
                          className="relative aspect-square rounded-lg overflow-hidden border border-tmk-gray-700 
                                     hover:border-tmk-red transition-colors cursor-pointer group"
                        >
                          <img
                            src={imageUrl}
                            alt={`TMK #${holding.token_id}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-0.5 text-center">
                            #{holding.token_id}
                          </div>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-tmk-red/0 group-hover:bg-tmk-red/20 transition-colors flex items-center justify-center">
                            <svg 
                              className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Member Since */}
            <div className="p-4 border-t border-tmk-gray-800 text-center">
              <span className="text-tmk-gray-500 text-sm">
                Member since {new Date(user.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* Enlarged NFT Viewer (Lightbox) */}
      {enlargedNft && R2_PUBLIC_URL && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setEnlargedNft(null)}
        >
          {/* Dark backdrop */}
          <div className="absolute inset-0 bg-black/90" />
          
          {/* Image container */}
          <div 
            className="relative max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setEnlargedNft(null)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* NFT Image */}
            <div className="bg-tmk-gray-900 rounded-2xl overflow-hidden border border-tmk-gray-700 shadow-2xl">
              <img
                src={`${R2_PUBLIC_URL}/images/${enlargedNft}.png`}
                alt={`TMK #${enlargedNft}`}
                className="w-full h-auto"
              />
              
              {/* Footer with Rank, Title, and Message */}
              <div className="p-4 border-t border-tmk-gray-800">
                <div className="flex items-center justify-between">
                  {/* Left: Rank Badge */}
                  <div className="flex-1">
                    {nftRankLoading ? (
                      <div className="w-20 h-8 bg-tmk-gray-800 rounded-lg animate-pulse" />
                    ) : nftRank ? (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${rankColors[getRankTier(nftRank)]} text-sm font-bold shadow-lg`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span>#{nftRank}</span>
                      </div>
                    ) : (
                      <div className="w-20" /> // Placeholder for alignment
                    )}
                  </div>
                  
                  {/* Center: NFT Title */}
                  <div className="flex-1 text-center">
                    <h3 className="text-xl font-bold text-white">TMK #{enlargedNft}</h3>
                  </div>
                  
                  {/* Right: Message Icon */}
                  <div className="flex-1 flex justify-end">
                    {user?.twitter_handle ? (
                      <a
                        href={`https://x.com/messages/compose?recipient_screen_name=${user.twitter_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-tmk-gray-800 hover:bg-tmk-red rounded-lg transition-colors group"
                        title={`Message @${user.twitter_handle}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg 
                          className="w-5 h-5 text-tmk-gray-400 group-hover:text-white transition-colors" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                          />
                        </svg>
                      </a>
                    ) : (
                      <div className="w-10" /> // Placeholder for alignment
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
