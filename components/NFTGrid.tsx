'use client';

import { NFTCard } from './NFTCard';
import { NFTMetadata } from '@/hooks/useNFTs';

interface NFTGridProps {
  nfts: NFTMetadata[];
  walletAddress: string;
}

export function NFTGrid({ nfts, walletAddress }: NFTGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {nfts.map((nft) => (
        <NFTCard 
          key={nft.tokenId} 
          nft={nft} 
          walletAddress={walletAddress}
        />
      ))}
    </div>
  );
}
