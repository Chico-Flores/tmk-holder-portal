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

export function UserProfileModal({ isOpen, onClose, walletAddress }: UserProfileModalProps) {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalHoldings, setTotalHoldings] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && walletAddress) {
      fetchUserProfile();
    }
  }, [isOpen, walletAddress]);

  const fetchUserProfile = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/points/user-profile/${walletAddress}`, {
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

            {/* NFT Holdings */}
            {holdings.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-tmk-gray-400 mb-3">TMK NFTs Owned</h3>
                <div className="grid grid-cols-4 gap-2">
                  {holdings.map((holding) => {
                    const imageUrl = R2_PUBLIC_URL 
                      ? `${R2_PUBLIC_URL}/images/${holding.token_id}.png`
                      : '';

                    return (
                      <div
                        key={holding.token_id}
                        className="relative aspect-square rounded-lg overflow-hidden border border-tmk-gray-700"
                      >
                        <img
                          src={imageUrl}
                          alt={`TMK #${holding.token_id}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-0.5 text-center">
                          #{holding.token_id}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalHoldings > 12 && (
                  <p className="text-tmk-gray-500 text-sm text-center mt-3">
                    +{totalHoldings - 12} more NFTs
                  </p>
                )}
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
    </div>
  );
}
