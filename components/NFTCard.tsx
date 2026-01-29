'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { NFTMetadata } from '@/hooks/useNFTs';
import { BLOCK_EXPLORER, CONTRACT_ADDRESS } from '@/lib/constants';
import { getIpfsUrls } from '@/lib/utils';
import { NFTDetailModal } from './NFTDetailModal';

// R2 public URL for images (set in Vercel env vars)
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

interface NFTCardProps {
  nft: NFTMetadata;
  walletAddress: string;
}

export function NFTCard({ nft, walletAddress }: NFTCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [allGatewaysFailed, setAllGatewaysFailed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [usingR2, setUsingR2] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // Primary: R2 URL (fast, reliable)
  // Fallback: IPFS gateways (if R2 not configured or image missing)
  const r2ImageUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/images/${nft.tokenId}.png` : null;
  const ipfsUrls = getIpfsUrls(nft.rawImage || nft.image);
  
  // Use R2 first, then fall back to IPFS gateways
  const currentImageUrl = isMounted 
    ? (usingR2 && r2ImageUrl ? r2ImageUrl : (ipfsUrls[currentGatewayIndex] || ''))
    : '';
  const hasValidImage = (r2ImageUrl || ipfsUrls.length > 0) && !allGatewaysFailed;

  // Mark as mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Try next source if image fails (R2 -> IPFS gateways)
  const handleImageError = useCallback(() => {
    if (usingR2 && r2ImageUrl) {
      // R2 failed, try IPFS
      console.log(`R2 failed for #${nft.tokenId}, trying IPFS...`);
      setUsingR2(false);
      setImageLoaded(false);
    } else if (currentGatewayIndex < ipfsUrls.length - 1) {
      // Try next IPFS gateway
      setCurrentGatewayIndex(prev => prev + 1);
      setImageLoaded(false);
    } else {
      // All sources failed
      setAllGatewaysFailed(true);
    }
  }, [usingR2, r2ImageUrl, currentGatewayIndex, ipfsUrls.length, nft.tokenId]);

  // Reset image state when NFT changes
  useEffect(() => {
    if (isMounted) {
      setUsingR2(true);
      setCurrentGatewayIndex(0);
      setAllGatewaysFailed(false);
      setImageLoaded(false);
    }
  }, [nft.tokenId, nft.rawImage, isMounted]);

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

      window.open(data.downloadUrl, '_blank');
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error('Download failed:', error);
      setError(error.message || 'Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadImage = () => {
    // Use server-side proxy to bypass CORS and trigger download
    const link = document.createElement('a');
    link.href = `/api/image/${nft.tokenId}`;
    link.download = `TMK_${nft.tokenId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRetryImage = () => {
    setUsingR2(true);
    setCurrentGatewayIndex(0);
    setAllGatewaysFailed(false);
    setImageLoaded(false);
  };

  const explorerUrl = `${BLOCK_EXPLORER}/token/${CONTRACT_ADDRESS}?a=${nft.tokenId}`;

  // Show skeleton if NFT is still loading metadata
  if (nft.isLoading) {
    return (
      <div className="bg-tmk-gray-900 border border-tmk-gray-800 rounded-2xl overflow-hidden">
        <div className="relative aspect-square bg-tmk-dark">
          <div className="absolute inset-0 animate-shimmer" />
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm 
                          rounded-lg text-sm font-mono text-white">
            #{nft.tokenId}
          </div>
        </div>
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
        {/* Image Container */}
        <div 
          className={`relative aspect-square bg-tmk-dark ${hasValidImage && imageLoaded ? 'cursor-pointer' : ''}`}
          onClick={() => hasValidImage && imageLoaded && setIsModalOpen(true)}
        >
          {/* Loading shimmer - only show when mounted and loading */}
          {isMounted && !imageLoaded && hasValidImage && currentImageUrl && (
            <div className="absolute inset-0 animate-shimmer z-10" />
          )}

          {/* Image - only render on client */}
          {isMounted && hasValidImage && currentImageUrl ? (
            <>
              <img
                ref={imgRef}
                src={currentImageUrl}
                alt={nft.name}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={handleImageError}
                loading="lazy"
              />
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
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Image
                src="/logo-icon.png"
                alt="TMK"
                width={80}
                height={80}
                className="opacity-30"
              />
              {isMounted && allGatewaysFailed && (
                <button
                  onClick={handleRetryImage}
                  className="text-xs text-tmk-gray-400 hover:text-white underline"
                >
                  Retry loading
                </button>
              )}
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

          {error && (
            <p className="text-red-400 text-sm mb-3">{error}</p>
          )}

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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

            {/* Bottom row */}
            <div className="flex gap-2">
              <button
                onClick={handleDownloadImage}
                disabled={!hasValidImage || !imageLoaded}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5
                           bg-tmk-gray-800 hover:bg-tmk-gray-700 
                           disabled:bg-tmk-gray-800/50 disabled:cursor-not-allowed
                           text-tmk-gray-400 hover:text-white disabled:text-tmk-gray-600
                           font-medium rounded-xl transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Save Image</span>
              </button>

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

      {/* NFT Detail Modal - only render when mounted */}
      {isMounted && (
        <NFTDetailModal
          isOpen={isModalOpen}
          tokenId={nft.tokenId}
          imageUrl={currentImageUrl}
          walletAddress={walletAddress}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
