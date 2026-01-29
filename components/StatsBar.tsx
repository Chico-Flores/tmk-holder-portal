'use client';

import { COLLECTION_NAME } from '@/lib/constants';

interface StatsBarProps {
  nftCount: number;
}

export function StatsBar({ nftCount }: StatsBarProps) {
  return (
    <div className="bg-tmk-gray-900 border border-tmk-gray-800 rounded-2xl p-4 sm:p-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
        {/* Collection Name */}
        <div>
          <p className="text-tmk-gray-400 text-sm mb-1">Collection</p>
          <p className="text-white font-bold font-heading">{COLLECTION_NAME}</p>
        </div>

        {/* Holdings */}
        <div>
          <p className="text-tmk-gray-400 text-sm mb-1">Your Holdings</p>
          <p className="text-white font-bold font-heading">
            {nftCount} NFT{nftCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Available Downloads */}
        <div>
          <p className="text-tmk-gray-400 text-sm mb-1">Available Downloads</p>
          <p className="text-tmk-red font-bold font-heading">
            {nftCount} Blender File{nftCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
