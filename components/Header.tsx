'use client';

import Image from 'next/image';
import { WalletButton } from './WalletButton';

interface HeaderProps {
  address: string | null;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  hasWallet: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

export function Header({
  address,
  isConnecting,
  isCorrectNetwork,
  hasWallet,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-tmk-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/logo-tmk.png"
              alt="TMK"
              width={80}
              height={40}
              className="h-8 sm:h-10 w-auto"
              priority
            />
          </div>

          {/* Wallet Button */}
          <WalletButton
            address={address}
            isConnecting={isConnecting}
            isCorrectNetwork={isCorrectNetwork}
            hasWallet={hasWallet}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            onSwitchNetwork={onSwitchNetwork}
          />
        </div>
      </div>
    </header>
  );
}
