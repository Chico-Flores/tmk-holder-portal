'use client';

import { useState, useEffect, useCallback } from 'react';
import { CHAIN_ID, CHAIN_ID_HEX, CRONOS_CHAIN_CONFIG } from '@/lib/constants';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnecting: false,
    isCorrectNetwork: false,
    error: null,
  });

  const hasWallet = typeof window !== 'undefined' && !!window.ethereum;

  // Check if connected and get current state
  const checkConnection = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      }) as string[];
      
      const chainIdHex = await window.ethereum.request({ 
        method: 'eth_chainId' 
      }) as string;
      
      const chainId = parseInt(chainIdHex, 16);

      setState(prev => ({
        ...prev,
        address: accounts[0] || null,
        chainId,
        isCorrectNetwork: chainId === CHAIN_ID,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({ 
        ...prev, 
        error: 'No wallet detected. Please install MetaMask or Crypto.com DeFi Wallet.' 
      }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];

      // Get current chain
      const chainIdHex = await window.ethereum.request({ 
        method: 'eth_chainId' 
      }) as string;
      
      const chainId = parseInt(chainIdHex, 16);

      // If wrong network, try to switch/add Cronos
      if (chainId !== CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CHAIN_ID_HEX }],
          });
        } catch (switchError: unknown) {
          // Chain not added, try to add it
          const error = switchError as { code: number };
          if (error.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [CRONOS_CHAIN_CONFIG],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Re-check chain after switch
      const newChainIdHex = await window.ethereum.request({ 
        method: 'eth_chainId' 
      }) as string;
      const newChainId = parseInt(newChainIdHex, 16);

      setState({
        address: accounts[0] || null,
        chainId: newChainId,
        isConnecting: false,
        isCorrectNetwork: newChainId === CHAIN_ID,
        error: null,
      });
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      let errorMessage = 'Failed to connect wallet';
      
      if (err.code === 4001) {
        errorMessage = 'Connection rejected. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Disconnect (just clear state - can't fully disconnect from browser)
  const disconnect = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      isConnecting: false,
      isCorrectNetwork: false,
      error: null,
    });
  }, []);

  // Switch to Cronos network
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_ID_HEX }],
      });
    } catch (switchError: unknown) {
      const error = switchError as { code: number };
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [CRONOS_CHAIN_CONFIG],
        });
      }
    }
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accts = accounts as string[];
      setState(prev => ({
        ...prev,
        address: accts[0] || null,
      }));
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      const chainId = parseInt(chainIdHex as string, 16);
      setState(prev => ({
        ...prev,
        chainId,
        isCorrectNetwork: chainId === CHAIN_ID,
      }));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check initial connection
    checkConnection();

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [checkConnection]);

  return {
    ...state,
    hasWallet,
    isConnected: !!state.address,
    connect,
    disconnect,
    switchNetwork,
  };
}
