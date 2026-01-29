'use client';

import Image from 'next/image';
import { MARKETPLACE_URL } from '@/lib/constants';

export function EmptyState() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      {/* Mascot */}
      <div className="mb-8 opacity-50">
        <Image
          src="/mascot.png"
          alt="No NFTs"
          width={150}
          height={150}
          className="w-32 h-32 sm:w-40 sm:h-40"
        />
      </div>

      {/* Message */}
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 font-heading">
        No Money Kids Found
      </h2>
      <p className="text-tmk-gray-400 text-center max-w-md mb-6">
        This wallet doesn&apos;t hold any TMK NFTs.
        <br />
        Make sure you&apos;re connected to the Cronos network.
      </p>

      {/* Browse Collection Button */}
      <a
        href={MARKETPLACE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-6 py-3 bg-tmk-gray-800 hover:bg-tmk-gray-700 
                   text-white font-semibold rounded-xl transition-colors"
      >
        Browse Collection
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
