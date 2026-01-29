'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '@/lib/constants';
import { ipfsToHttp, cacheMetadata, getCachedMetadata } from '@/lib/utils';

export interface NFTMetadata {
  tokenId: number;
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  isLoading?: boolean;
}

interface NFTState {
  nfts: NFTMetadata[];
  isLoading: boolean;
  isLoadingMetadata: boolean;
  error: string | null;
  loadedCount: number;
  totalCount: number;
}

// Fetch with timeout and retry
async function fetchWithRetry(url: string, retries: number = 2, timeout: number = 8000): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) return response;
    } catch (error) {
      if (i === retries) throw error;
    }
  }
  throw new Error('Failed after retries');
}

export function useNFTs(address: string | null) {
  const [state, setState] = useState<NFTState>({
    nfts: [],
    isLoading: false,
    isLoadingMetadata: false,
    error: null,
    loadedCount: 0,
    totalCount: 0,
  });
  
  const isFetching = useRef(false);

  const fetchNFTs = useCallback(async () => {
    if (!address || isFetching.current) {
      if (!address) setState({ nfts: [], isLoading: false, isLoadingMetadata: false, error: null, loadedCount: 0, totalCount: 0 });
      return;
    }

    isFetching.current = true;
    
    // Check cache first for instant loading
    const cached = getCachedMetadata<NFTMetadata[]>(address);
    if (cached && cached.length > 0) {
      setState({
        nfts: cached,
        isLoading: false,
        isLoadingMetadata: false,
        error: null,
        loadedCount: cached.length,
        totalCount: cached.length,
      });
      // Still refresh in background
      refreshInBackground(address, cached);
      isFetching.current = false;
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create provider and contract
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Get all token IDs owned by this address
      const tokenIds: bigint[] = await contract.tokensOfOwner(address);

      if (tokenIds.length === 0) {
        setState({ nfts: [], isLoading: false, isLoadingMetadata: false, error: null, loadedCount: 0, totalCount: 0 });
        isFetching.current = false;
        return;
      }

      // Create placeholder NFTs immediately so UI shows cards
      const placeholderNfts: NFTMetadata[] = tokenIds.map(tokenId => ({
        tokenId: Number(tokenId),
        name: `TMK #${Number(tokenId)}`,
        description: '',
        image: '',
        isLoading: true,
      }));

      // Show placeholders immediately
      setState({
        nfts: placeholderNfts,
        isLoading: false,
        isLoadingMetadata: true,
        error: null,
        loadedCount: 0,
        totalCount: tokenIds.length,
      });

      // Fetch metadata in parallel (larger batches for speed)
      const batchSize = 10;
      const nfts: NFTMetadata[] = [...placeholderNfts];
      let loadedCount = 0;

      for (let i = 0; i < tokenIds.length; i += batchSize) {
        const batch = tokenIds.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (tokenId, batchIndex) => {
            const index = i + batchIndex;
            try {
              const tokenIdNum = Number(tokenId);
              const tokenURI = await contract.tokenURI(tokenId);
              const metadataUrl = ipfsToHttp(tokenURI);
              
              const response = await fetchWithRetry(metadataUrl);
              const metadata = await response.json();

              const nft: NFTMetadata = {
                tokenId: tokenIdNum,
                name: metadata.name || `TMK #${tokenIdNum}`,
                description: metadata.description || '',
                image: ipfsToHttp(metadata.image || ''),
                attributes: metadata.attributes || [],
                isLoading: false,
              };

              // Update individual NFT as it loads
              nfts[index] = nft;
              loadedCount++;
              
              setState(prev => ({
                ...prev,
                nfts: [...nfts],
                loadedCount,
              }));

              return nft;
            } catch (error) {
              console.error(`Failed to fetch metadata for token ${tokenId}:`, error);
              const tokenIdNum = Number(tokenId);
              const nft: NFTMetadata = {
                tokenId: tokenIdNum,
                name: `TMK #${tokenIdNum}`,
                description: '',
                image: '',
                attributes: [],
                isLoading: false,
              };
              nfts[index] = nft;
              loadedCount++;
              return nft;
            }
          })
        );
      }

      // Sort by token ID
      nfts.sort((a, b) => a.tokenId - b.tokenId);

      // Cache for future visits
      cacheMetadata(address, nfts);

      setState({
        nfts,
        isLoading: false,
        isLoadingMetadata: false,
        error: null,
        loadedCount: nfts.length,
        totalCount: nfts.length,
      });
    } catch (error: unknown) {
      console.error('Failed to fetch NFTs:', error);
      const err = error as { message?: string };
      setState({
        nfts: [],
        isLoading: false,
        isLoadingMetadata: false,
        error: err.message || 'Failed to fetch NFTs. Please try again.',
        loadedCount: 0,
        totalCount: 0,
      });
    } finally {
      isFetching.current = false;
    }
  }, [address]);

  // Background refresh (silent update)
  const refreshInBackground = async (addr: string, currentNfts: NFTMetadata[]) => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const tokenIds: bigint[] = await contract.tokensOfOwner(addr);

      // Only update if count changed
      if (tokenIds.length !== currentNfts.length) {
        fetchNFTs();
      }
    } catch {
      // Silent fail for background refresh
    }
  };

  // Fetch NFTs when address changes
  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  return {
    ...state,
    refetch: fetchNFTs,
  };
}
