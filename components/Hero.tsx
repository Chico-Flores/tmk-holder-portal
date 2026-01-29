'use client';

import Image from 'next/image';

interface HeroProps {
  hasWallet: boolean;
  isConnecting: boolean;
  onConnect: () => void;
}

export function Hero({ hasWallet, isConnecting, onConnect }: HeroProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20">
      {/* Logo */}
      <div className="mb-8 animate-fade-in">
        <Image
          src="/logo-full.png"
          alt="The Money Kids"
          width={300}
          height={200}
          className="w-64 sm:w-80 h-auto"
          priority
        />
      </div>

      {/* Subtitle */}
      <p className="text-tmk-gray-400 text-lg sm:text-xl mb-2 tracking-widest font-heading">
        2025 COLLECTION
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 font-heading">
        HOLDER PORTAL
      </h2>

      {/* Description */}
      <p className="text-tmk-gray-400 text-center max-w-md mb-8 leading-relaxed">
        Verify your wallet to access exclusive
        <br />
        <span className="text-white font-semibold">Blender 3D files</span> for your NFTs
      </p>

      {/* Connect Button */}
      {hasWallet ? (
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="flex items-center gap-3 px-8 py-4 bg-tmk-red hover:bg-tmk-red-hover 
                     disabled:bg-tmk-gray-700 disabled:cursor-not-allowed
                     text-white text-lg font-bold rounded-2xl transition-all duration-200
                     hover:scale-105 active:scale-95 shadow-lg shadow-tmk-red/20
                     hover:shadow-tmk-red/40"
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
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
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect Wallet
            </>
          )}
        </button>
      ) : (
        <div className="text-center">
          <p className="text-tmk-gray-400 mb-4">No wallet detected</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-tmk-gray-800 hover:bg-tmk-gray-700 text-white 
                         font-semibold rounded-xl transition-colors"
            >
              Get MetaMask
            </a>
            <a
              href="https://crypto.com/defi-wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-tmk-gray-800 hover:bg-tmk-gray-700 text-white 
                         font-semibold rounded-xl transition-colors"
            >
              Get DeFi Wallet
            </a>
          </div>
        </div>
      )}

      {/* Supported Wallets */}
      <p className="mt-8 text-tmk-gray-400 text-sm">
        Supports MetaMask & Crypto.com DeFi Wallet
      </p>

      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                      w-[600px] h-[600px] bg-tmk-red/5 rounded-full blur-3xl -z-10" />
    </div>
  );
}
