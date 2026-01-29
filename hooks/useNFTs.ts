'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '@/lib/constants';
import { ipfsToHttp, cacheMetadata, getCachedMetadata, clearMetadataCache } from '@/lib/utils';

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
  isLoadingMetadata: boolean;
  error: string | null;
  loadedCount: number;
  totalCount: number;
}

// Fetch with timeout and retry
async function fetchWithRetry(url: string, retries: number = 2, timeout: number = 15000): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, { 
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (response.ok) return response;
      
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (i === retries || (err.name !== 'AbortError' && !String(error).includes('fetch'))) {
        throw error;
      }
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
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
  const hasMounted = useRef(false);

  const fetchNFTs = useCallback(async (forceRefresh: boolean = false) => {
    if (!address || isFetching.current) {
      if (!address) setState({ nfts: [], isLoading: false, isLoadingMetadata: false, error: null, loadedCount: 0, totalCount: 0 });
      return;
    }

    isFetching.current = true;
    
    // Only check cache after component has mounted (client-side only)
    if (hasMounted.current && !forceRefresh) {
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
        refreshInBackground(address, cached);
        isFetching.current = false;
        return;
      }
    }
    
    if (forceRefresh) {
      clearMetadataCache(address);
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const tokenIds: bigint[] = await contract.tokensOfOwner(address);

      if (tokenIds.length === 0) {
        setState({ nfts: [], isLoading: false, isLoadingMetadata: false, error: null, loadedCount: 0, totalCount: 0 });
        isFetching.current = false;
        return;
      }

      const placeholderNfts: NFTMetadata[] = tokenIds.map(tokenId => ({
        tokenId: Number(tokenId),
        name: `TMK #${Number(tokenId)}`,
        description: '',
        image: '',
        rawImage: '',
        isLoading: true,
      }));

      setState({
        nfts: placeholderNfts,
        isLoading: false,
        isLoadingMetadata: true,
        error: null,
        loadedCount: 0,
        totalCount: tokenIds.length,
      });

      const batchSize = 8;
      const nfts: NFTMetadata[] = [...placeholderNfts];
      let loadedCount = 0;

      for (let i = 0; i < tokenIds.length; i += batchSize) {
        const batch = tokenIds.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (tokenId, batchIndex) => {
            const index = i + batchIndex;
            try {
              const tokenIdNum = Number(tokenId);
              const tokenURI = await contract.tokenURI(tokenId);
              const metadataUrl = ipfsToHttp(tokenURI);
              
              const response = await fetchWithRetry(metadataUrl);
              const metadata = await response.json();
              
              const rawImage = metadata.image || '';
              const imageUrl = ipfsToHttp(rawImage);

              const nft: NFTMetadata = {
                tokenId: tokenIdNum,
                name: metadata.name || `TMK #${tokenIdNum}`,
                description: metadata.description || '',
                image: imageUrl,
                rawImage: rawImage,
                attributes: metadata.attributes || [],
                isLoading: false,
              };

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
                rawImage: '',
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

      nfts.sort((a, b) => a.tokenId - b.tokenId);
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

  const refreshInBackground = async (addr: string, currentNfts: NFTMetadata[]) => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const tokenIds: bigint[] = await contract.tokensOfOwner(addr);

      if (tokenIds.length !== currentNfts.length) {
        clearMetadataCache(addr);
        fetchNFTs(true);
      }
    } catch {
      // Silent fail
    }
  };

  // Mark as mounted and fetch
  useEffect(() => {
    hasMounted.current = true;
    if (address) {
      fetchNFTs();
    }
  }, [address, fetchNFTs]);

  return {
    ...state,
    refetch: () => fetchNFTs(true),
  };
}
