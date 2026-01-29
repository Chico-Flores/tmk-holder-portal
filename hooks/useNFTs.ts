'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '@/lib/constants';
import { ipfsToHttp } from '@/lib/utils';

export interface NFTMetadata {
  tokenId: number;
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
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

  const fetchNFTs = useCallback(async () => {
    if (!address) {
      setState({ nfts: [], isLoading: false, error: null });
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
        setState({ nfts: [], isLoading: false, error: null });
        return;
      }

      // Fetch metadata for each token (with batching to avoid rate limits)
      const nfts: NFTMetadata[] = [];
      const batchSize = 5;

      for (let i = 0; i < tokenIds.length; i += batchSize) {
        const batch = tokenIds.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (tokenId) => {
            try {
              const tokenIdNum = Number(tokenId);
              const tokenURI = await contract.tokenURI(tokenId);
              const metadataUrl = ipfsToHttp(tokenURI);
              
              const response = await fetch(metadataUrl);
              const metadata = await response.json();

              return {
                tokenId: tokenIdNum,
                name: metadata.name || `TMK #${tokenIdNum}`,
                description: metadata.description || '',
                image: ipfsToHttp(metadata.image || ''),
                attributes: metadata.attributes || [],
              };
            } catch (error) {
              console.error(`Failed to fetch metadata for token ${tokenId}:`, error);
              const tokenIdNum = Number(tokenId);
              return {
                tokenId: tokenIdNum,
                name: `TMK #${tokenIdNum}`,
                description: '',
                image: '',
                attributes: [],
              };
            }
          })
        );

        nfts.push(...batchResults);
      }

      // Sort by token ID
      nfts.sort((a, b) => a.tokenId - b.tokenId);

      setState({ nfts, isLoading: false, error: null });
    } catch (error: unknown) {
      console.error('Failed to fetch NFTs:', error);
      const err = error as { message?: string };
      setState({
        nfts: [],
        isLoading: false,
        error: err.message || 'Failed to fetch NFTs. Please try again.',
      });
    }
  }, [address]);

  // Fetch NFTs when address changes
  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  return {
    ...state,
    refetch: fetchNFTs,
  };
}
