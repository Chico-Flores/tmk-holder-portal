'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '@/lib/constants';
import { ipfsToHttp, cacheMetadata, getCachedMetadata, clearMetadataCache, delay } from '@/lib/utils';

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

// Alternative RPC endpoints for Cronos
const RPC_ENDPOINTS = [
  RPC_URL,
  'https://evm.cronos.org',
  'https://cronos-evm.publicnode.com',
  'https://cronos.blockpi.network/v1/rpc/public',
];

// Get a provider, trying multiple endpoints
async function getWorkingProvider(): Promise<ethers.JsonRpcProvider> {
  for (const rpc of RPC_ENDPOINTS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      // Test the connection
      await provider.getBlockNumber();
      return provider;
    } catch {
      console.log(`RPC ${rpc} failed, trying next...`);
    }
  }
  // Fallback to first
  return new ethers.JsonRpcProvider(RPC_ENDPOINTS[0]);
}

// Fetch tokenURI with retry
async function fetchTokenURIWithRetry(
  contract: ethers.Contract, 
  tokenId: bigint, 
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await delay(1000 * attempt); // Increasing delay between retries
      }
      const uri = await contract.tokenURI(tokenId);
      return uri;
    } catch (error) {
      lastError = error as Error;
      console.log(`tokenURI attempt ${attempt + 1} failed for token ${tokenId}`);
    }
  }
  
  throw lastError;
}

// Fetch metadata from IPFS with retry
async function fetchMetadataWithRetry(url: string, maxRetries: number = 3): Promise<unknown> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await delay(500 * attempt);
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      lastError = error as Error;
    }
  }
  
  throw lastError;
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
      if (!address) {
        setState({ nfts: [], isLoading: false, isLoadingMetadata: false, error: null, loadedCount: 0, totalCount: 0 });
      }
      return;
    }

    isFetching.current = true;
    
    // Check cache first (only on client after mount)
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
        isFetching.current = false;
        return;
      }
    }
    
    if (forceRefresh) {
      clearMetadataCache(address);
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get a working provider
      const provider = await getWorkingProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Get all token IDs
      const tokenIds: bigint[] = await contract.tokensOfOwner(address);

      if (tokenIds.length === 0) {
        setState({ nfts: [], isLoading: false, isLoadingMetadata: false, error: null, loadedCount: 0, totalCount: 0 });
        isFetching.current = false;
        return;
      }

      // Create placeholders
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

      // Fetch metadata with smaller batches and delays to avoid rate limiting
      const batchSize = 4; // Smaller batches
      const nfts: NFTMetadata[] = [...placeholderNfts];
      let loadedCount = 0;

      for (let i = 0; i < tokenIds.length; i += batchSize) {
        // Add delay between batches to avoid rate limiting
        if (i > 0) {
          await delay(500);
        }
        
        const batch = tokenIds.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (tokenId, batchIndex) => {
            const index = i + batchIndex;
            const tokenIdNum = Number(tokenId);
            
            try {
              // Fetch tokenURI with retry
              const tokenURI = await fetchTokenURIWithRetry(contract, tokenId);
              const metadataUrl = ipfsToHttp(tokenURI);
              
              // Fetch metadata with retry
              const metadata = await fetchMetadataWithRetry(metadataUrl) as {
                name?: string;
                description?: string;
                image?: string;
                attributes?: Array<{ trait_type: string; value: string | number }>;
              };
              
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
              console.error(`Failed to fetch metadata for token ${tokenIdNum}:`, error);
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
              
              setState(prev => ({
                ...prev,
                nfts: [...nfts],
                loadedCount,
              }));
              
              return nft;
            }
          })
        );
      }

      // Sort and cache
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
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingMetadata: false,
        error: err.message || 'Failed to fetch NFTs. Please try again.',
      }));
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
    refetch: () => fetchNFTs(true),
  };
}
