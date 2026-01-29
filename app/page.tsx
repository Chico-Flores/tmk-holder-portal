'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useNFTs } from '@/hooks/useNFTs';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { StatsBar } from '@/components/StatsBar';
import { NFTGrid } from '@/components/NFTGrid';
import { Footer } from '@/components/Footer';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    address,
    isConnecting,
    isConnected,
    isCorrectNetwork,
    hasWallet,
    error: walletError,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();

  const { 
    nfts, 
    isLoading, 
    error: nftError,
  } = useNFTs(
    isConnected && isCorrectNetwork ? address : null
  );

  // Don't render until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-tmk-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        address={address}
        isConnecting={isConnecting}
        isCorrectNetwork={isCorrectNetwork}
        hasWallet={hasWallet}
        onConnect={connect}
        onDisconnect={disconnect}
        onSwitchNetwork={switchNetwork}
      />

      <main className="flex-1 pt-16 sm:pt-20">
        {/* Error Messages */}
        {(walletError || nftError) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-xl">
              {walletError || nftError}
            </div>
          </div>
        )}

        {/* Not Connected */}
        {!isConnected && (
          <Hero
            hasWallet={hasWallet}
            isConnecting={isConnecting}
            onConnect={connect}
          />
        )}

        {/* Wrong Network */}
        {isConnected && !isCorrectNetwork && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-600/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 font-heading">Wrong Network</h2>
              <p className="text-tmk-gray-400 mb-6">Please switch to the Cronos network to view your NFTs.</p>
              <button
                onClick={switchNetwork}
                className="px-6 py-3 bg-tmk-red hover:bg-tmk-red-hover text-white font-semibold rounded-xl transition-colors"
              >
                Switch to Cronos
              </button>
            </div>
          </div>
        )}

        {/* Connected and Correct Network */}
        {isConnected && isCorrectNetwork && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isLoading && <LoadingState />}
            {!isLoading && nfts.length === 0 && <EmptyState />}
            {!isLoading && nfts.length > 0 && (
              <>
                <StatsBar nftCount={nfts.length} />
                <NFTGrid nfts={nfts} walletAddress={address!} />
              </>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
