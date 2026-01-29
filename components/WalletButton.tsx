'use client';

import { shortenAddress } from '@/lib/utils';

interface WalletButtonProps {
  address: string | null;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  hasWallet: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

export function WalletButton({
  address,
  isConnecting,
  isCorrectNetwork,
  hasWallet,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}: WalletButtonProps) {
  // Not connected
  if (!address) {
    return (
      <button
        onClick={onConnect}
        disabled={isConnecting || !hasWallet}
        className="flex items-center gap-2 px-4 py-2 bg-tmk-red hover:bg-tmk-red-hover 
                   disabled:bg-tmk-gray-700 disabled:cursor-not-allowed
                   text-white font-semibold rounded-xl transition-all duration-200
                   hover:scale-105 active:scale-95"
      >
        {isConnecting ? (
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
            <span className="hidden sm:inline">Connecting...</span>
          </>
        ) : !hasWallet ? (
          <span>Install Wallet</span>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="hidden sm:inline">Connect Wallet</span>
          </>
        )}
      </button>
    );
  }

  // Connected but wrong network
  if (!isCorrectNetwork) {
    return (
      <button
        onClick={onSwitchNetwork}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500
                   text-white font-semibold rounded-xl transition-all duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="hidden sm:inline">Switch to Cronos</span>
      </button>
    );
  }

  // Connected and correct network
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-tmk-gray-900 border border-tmk-gray-800 rounded-xl">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="font-mono text-sm text-tmk-gray-400">
          {shortenAddress(address)}
        </span>
      </div>
      <button
        onClick={onDisconnect}
        className="p-2 text-tmk-gray-400 hover:text-white hover:bg-tmk-gray-800 
                   rounded-xl transition-colors"
        title="Disconnect"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
}
