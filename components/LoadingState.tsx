'use client';

import Image from 'next/image';

interface LoadingStateProps {
  loadedCount?: number;
  totalCount?: number;
}

export function LoadingState({ loadedCount = 0, totalCount = 0 }: LoadingStateProps) {
  const showProgress = totalCount > 0;
  const progress = showProgress ? Math.round((loadedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      {/* Spinning mascot */}
      <div className="mb-8 animate-spin-slow">
        <Image
          src="/logo-icon.png"
          alt="Loading"
          width={120}
          height={120}
          className="w-24 h-24 sm:w-32 sm:h-32"
        />
      </div>

      {/* Loading text */}
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 font-heading">
        {showProgress ? 'Loading Your NFTs' : 'Scanning Your Wallet'}
      </h2>
      <p className="text-tmk-gray-400 text-center">
        {showProgress 
          ? `Fetching metadata... ${loadedCount} of ${totalCount}`
          : 'Looking for your Money Kids...'
        }
      </p>

      {/* Progress bar */}
      {showProgress && (
        <div className="w-64 mt-6">
          <div className="h-2 bg-tmk-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-tmk-red transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-tmk-gray-400 text-sm mt-2">{progress}%</p>
        </div>
      )}

      {/* Animated dots (only show when not showing progress) */}
      {!showProgress && (
        <div className="flex gap-1 mt-4">
          <div className="w-2 h-2 bg-tmk-red rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-tmk-red rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-tmk-red rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
}
