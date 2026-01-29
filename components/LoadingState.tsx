'use client';

import Image from 'next/image';

export function LoadingState() {
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
        Scanning Your Wallet
      </h2>
      <p className="text-tmk-gray-400 text-center">
        Looking for your Money Kids...
      </p>

      {/* Animated dots */}
      <div className="flex gap-1 mt-4">
        <div className="w-2 h-2 bg-tmk-red rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-tmk-red rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-tmk-red rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
