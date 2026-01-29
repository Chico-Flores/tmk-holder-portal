'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { NFTMetadata } from '@/hooks/useNFTs';
import { BLOCK_EXPLORER, CONTRACT_ADDRESS } from '@/lib/constants';
import { getIpfsUrls } from '@/lib/utils';
import { ImageModal } from './ImageModal';

interface NFTCardProps {
  nft: NFTMetadata;
  walletAddress: string;
}

export function NFTCard({ nft, walletAddress }: NFTCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get all possible image URLs for fallbacks
  const imageUrls = nft.image ? getIpfsUrls(nft.image) : [];
  const currentImageUrl = imageUrls[currentImageIndex] || '';

  // Try next gateway if image fails
  const handleImageError = () => {
    if (currentImageIndex < imageUrls.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else {
      setImageError(true);
    }
  };

  // Reset image state when NFT changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageError(false);
    setImageLoaded(false);
  }, [nft.tokenId, nft.image]);

  const handleDownload3D = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const response = await fetch(`/api/download/${nft.tokenId}`, {
        headers: {
          'x-wallet-address': walletAddress,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Download failed');
      }

      // Open download URL in new tab
      window.open(data.downloadUrl, '_blank');
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('Download failed:', error);
      setError(error.message || 'Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!currentImageUrl) return;
    
    setIsDownloadingImage(true);
    
    try {
      // Fetch the image
      const response = await fetch(currentImageUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TMK_${nft.tokenId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Image download failed:', err);
      // Fallback: open in new tab
      window.open(currentImageUrl, '_blank');
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const explorerUrl = `${BLOCK_EXPLORER}/token/${CONTRACT_ADDRESS}?a=${nft.tokenId}`;

  // Show skeleton if NFT is still loading
  if (nft.isLoading) {
    return (
      <div className="bg-tmk-gray-900 border border-tmk-gray-800 rounded-2xl overflow-hidden">
        {/* Image Skeleton */}
        <div className="relative aspect-square bg-tmk-dark">
          <div className="absolute inset-0 animate-shimmer" />
          {/* Token ID Badge */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm 
                          rounded-lg text-sm font-mono text-white">
            #{nft.tokenId}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-white font-bold font-heading mb-3">
            TMK #{nft.tokenId}
          </h3>
          <div className="flex flex-col gap-2">
            <div className="h-10 bg-tmk-gray-800 rounded-xl animate-pulse" />
            <div className="flex gap-2">
              <div className="flex-1 h-10 bg-tmk-gray-800 rounded-xl animate-pulse" />
              <div className="w-10 h-10 bg-tmk-gray-800 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="group bg-tmk-gray-900 border border-tmk-gray-800 rounded-2xl overflow-hidden
                      transition-all duration-300 hover:border-tmk-red/50 hover:scale-[1.02]">
        {/* Image Container - Clickable */}
        <div 
          className="relative aspect-square bg-tmk-dark cursor-pointer"
          onClick={() => currentImageUrl && !imageError && setIsModalOpen(true)}
        >
          {/* Loading shimmer */}
          {!imageLoaded && !imageError && currentImageUrl && (
            <div className="absolute inset-0 animate-shimmer z-10" />
          )}

          {currentImageUrl && !imageError ? (
            <>
              <Image
                src={currentImageUrl}
                alt={nft.name}
                fill
                className={`object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={handleImageError}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                unoptimized
              />
              {/* Expand hint on hover */}
              {imageLoaded && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 
                                transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image
                src="/logo-icon.png"
                alt="TMK"
                width={80}
                height={80}
                className="opacity-30"
              />
            </div>
          )}

          {/* Token ID Badge */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm 
                          rounded-lg text-sm font-mono text-white z-20">
            #{nft.tokenId}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4">
          <h3 className="text-white font-bold font-heading mb-3 truncate">
            {nft.name}
          </h3>

          {/* Error Message */}
          {error && (
            <p className="text-red-400 text-sm mb-3">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            {/* Download 3D File Button */}
            <button
              onClick={handleDownload3D}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                         bg-tmk-red hover:bg-tmk-red-hover disabled:bg-tmk-gray-700
                         disabled:cursor-not-allowed text-white font-semibold rounded-xl
                         transition-all duration-200"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download 3D File</span>
                </>
              )}
            </button>

            {/* Bottom row: Image download + Explorer link */}
            <div className="flex gap-2">
              {/* Download Image Button */}
              <button
                onClick={handleDownloadImage}
                disabled={isDownloadingImage || !currentImageUrl || imageError}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5
                           bg-tmk-gray-800 hover:bg-tmk-gray-700 
                           disabled:bg-tmk-gray-800/50 disabled:cursor-not-allowed
                           text-tmk-gray-400 hover:text-white disabled:text-tmk-gray-600
                           font-medium rounded-xl transition-colors text-sm"
              >
                {isDownloadingImage ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                <span>Save Image</span>
              </button>

              {/* Explorer Link */}
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-2.5 bg-tmk-gray-800 
                           hover:bg-tmk-gray-700 text-tmk-gray-400 hover:text-white
                           rounded-xl transition-colors"
                title="View on Explorer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isModalOpen}
        imageUrl={currentImageUrl}
        title={nft.name}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
