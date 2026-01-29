'use client';

import { useEffect, useState } from 'react';
import { BLOCK_EXPLORER, CONTRACT_ADDRESS, COLLECTION_NAME } from '@/lib/constants';

interface Attribute {
  trait_type: string;
  value: string | number;
}

interface NFTDetailModalProps {
  isOpen: boolean;
  tokenId: number;
  imageUrl: string;
  walletAddress: string;
  onClose: () => void;
}

export function NFTDetailModal({ isOpen, tokenId, imageUrl, walletAddress, onClose }: NFTDetailModalProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [totalSupply, setTotalSupply] = useState<number>(1500);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metadata when modal opens
  useEffect(() => {
    if (!isOpen || !tokenId) return;

    const fetchMetadata = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/metadata/${tokenId}`);
        if (response.ok) {
          const data = await response.json();
          setAttributes(data.attributes || []);
          setRank(data.rank || null);
          setTotalSupply(data.totalSupply || 1500);
        } else {
          setError('Could not load traits');
        }
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
        setError('Could not load traits');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [isOpen, tokenId]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter out traits with "none" value
  const displayAttributes = attributes.filter(
    attr => String(attr.value).toLowerCase() !== 'none'
  );

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = `/api/image/${tokenId}`;
    link.download = `TMK_${tokenId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload3D = async () => {
    try {
      const response = await fetch(`/api/download/${tokenId}`, {
        headers: {
          'x-wallet-address': walletAddress,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Download failed');
        return;
      }

      window.open(data.downloadUrl, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed. Please try again.');
    }
  };

  const explorerUrl = `${BLOCK_EXPLORER}/token/${CONTRACT_ADDRESS}?a=${tokenId}`;

  // Determine rank tier for styling
  const getRankTier = (rank: number) => {
    if (rank <= 50) return 'legendary'; // Top 50
    if (rank <= 150) return 'epic';     // Top 10%
    if (rank <= 375) return 'rare';     // Top 25%
    return 'common';
  };

  const rankTier = rank ? getRankTier(rank) : 'common';
  const rankColors = {
    legendary: 'from-yellow-500 to-amber-600 text-black',
    epic: 'from-purple-500 to-pink-600 text-white',
    rare: 'from-blue-500 to-cyan-600 text-white',
    common: 'from-tmk-gray-600 to-tmk-gray-700 text-white',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white 
                   bg-tmk-gray-800 hover:bg-tmk-gray-700 rounded-full transition-colors z-10"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Modal Content - Wider: max-w-6xl */}
      <div 
        className="bg-tmk-gray-900 rounded-2xl overflow-hidden max-w-6xl w-full max-h-[90vh] overflow-y-auto
                   flex flex-col lg:flex-row shadow-2xl border border-tmk-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side - Image + All Action Buttons */}
        <div className="lg:w-2/5 bg-tmk-dark p-4 flex flex-col">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-tmk-gray-800">
            <img
              src={imageUrl}
              alt={`TMK #${tokenId}`}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* All Action Buttons - Under Image */}
          <div className="mt-4 space-y-2">
            {/* Save Image Button */}
            <button
              onClick={handleDownloadImage}
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                         bg-tmk-gray-800 hover:bg-tmk-gray-700 text-white
                         font-medium rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Save Image
            </button>

            {/* Download 3D Button */}
            <button
              onClick={handleDownload3D}
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                         bg-tmk-red hover:bg-tmk-red-hover text-white
                         font-semibold rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download 3D File
            </button>

            {/* View on Explorer Button */}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                         bg-tmk-gray-800 hover:bg-tmk-gray-700 text-white
                         font-medium rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on Explorer
            </a>
          </div>
        </div>

        {/* Right Side - Header + Rank + Traits */}
        <div className="lg:w-3/5 p-6 flex flex-col">
          {/* Header with Rank Badge */}
          <div className="mb-6">
            <p className="text-tmk-gray-400 text-sm uppercase tracking-wider mb-1">
              {COLLECTION_NAME}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-3xl font-bold text-white font-heading">
                TMK #{tokenId}
              </h2>
              
              {/* Rank Badge */}
              {rank && !isLoading && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${rankColors[rankTier]} font-bold shadow-lg`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>Rank #{rank}</span>
                  <span className="text-sm opacity-75">/ {totalSupply}</span>
                </div>
              )}
              
              {/* Rank Loading State */}
              {isLoading && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-tmk-gray-800 animate-pulse">
                  <div className="w-5 h-5 bg-tmk-gray-700 rounded"></div>
                  <div className="w-20 h-5 bg-tmk-gray-700 rounded"></div>
                </div>
              )}
            </div>
          </div>

          {/* Traits Section */}
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-tmk-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Traits
            </h3>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-tmk-gray-800 rounded-xl p-3 animate-pulse">
                    <div className="h-3 bg-tmk-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-tmk-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="text-tmk-gray-400 text-sm">{error}</p>
            ) : displayAttributes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {displayAttributes.map((attr, index) => (
                  <div 
                    key={index}
                    className="bg-tmk-gray-800 border border-tmk-gray-700 rounded-xl p-3
                               hover:border-tmk-red/30 transition-colors"
                  >
                    <p className="text-tmk-gray-400 text-xs uppercase tracking-wider mb-1">
                      {attr.trait_type}
                    </p>
                    <p className="text-white font-medium text-sm truncate" title={String(attr.value)}>
                      {attr.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-tmk-gray-400 text-sm">No traits available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
