'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheMetadata, getCachedMetadata, clearMetadataCache } from '@/lib/utils';

export interface NFTMetadata {
  tokenId: number;
  name: string;
  description: string;
  image: string;
  rawImage: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  isLoading?: boolean;
}

interface NFTState {
  nfts: NFTMetadata[];
  isLoading: boolean;
  error: string | null;
}

export function useNFTs(address: string | null) {
  const [state, setState] = useState<NFTState>({
    nfts: [],
    isLoading: false,
    error: null,
  });
  
  const isFetching = useRef(false);
  const hasMounted = useRef(false);

  const fetchNFTs = useCallback(async (forceRefresh: boolean = false) => {
    if (!address || isFetching.current) {
      if (!address) {
        setState({ nfts: [], isLoading: false, error: null });
      }
      return;
    }

    isFetching.current = true;
    
    // Check client-side cache first (only after mount)
    if (hasMounted.current && !forceRefresh) {
      const cached = getCachedMetadata<NFTMetadata[]>(address);
      if (cached && cached.length > 0) {
        setState({
          nfts: cached,
          isLoading: false,
          error: null,
        });
        isFetching.current = false;
        return;
      }
    }
    
    if (forceRefresh) {
      clearMetadataCache(address);
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Use server-side API to fetch NFTs
      const response = await fetch(`/api/nfts/${address}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch NFTs');
      }

      const data = await response.json();
      const nfts: NFTMetadata[] = data.nfts || [];

      // Cache on client
      if (nfts.length > 0) {
        cacheMetadata(address, nfts);
      }

      setState({
        nfts,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      console.error('Failed to fetch NFTs:', error);
      const err = error as { message?: string };
      setState({
        nfts: [],
        isLoading: false,
        error: err.message || 'Failed to fetch NFTs. Please try again.',
      });
    } finally {
      isFetching.current = false;
    }
  }, [address]);

  // Mark as mounted and fetch
  useEffect(() => {
    hasMounted.current = true;
    if (address) {
      fetchNFTs();
    }
    
    return () => {
      hasMounted.current = false;
    };
  }, [address, fetchNFTs]);

  return {
    ...state,
    isLoadingMetadata: false, // No longer needed with server-side fetch
    loadedCount: state.nfts.length,
    totalCount: state.nfts.length,
    refetch: () => fetchNFTs(true),
  };
}
