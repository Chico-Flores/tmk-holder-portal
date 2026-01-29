'use client';

import Image from 'next/image';
import { CONTRACT_ADDRESS, CONTRACT_EXPLORER_URL } from '@/lib/constants';
import { shortenAddress } from '@/lib/utils';

export function Footer() {
  return (
    <footer className="mt-auto py-8 border-t border-tmk-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Badge */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo-badge.png"
              alt="IN TMK WE TRUST"
              width={60}
              height={60}
              className="w-12 h-12"
            />
            <span className="text-tmk-gray-400 font-heading text-sm tracking-wide">
              IN TMK WE TRUST
            </span>
          </div>

          {/* Contract Link */}
          <a
            href={CONTRACT_EXPLORER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-tmk-gray-400 hover:text-white 
                       transition-colors text-sm"
          >
            <span>Contract:</span>
            <code className="font-mono bg-tmk-gray-900 px-2 py-1 rounded">
              {shortenAddress(CONTRACT_ADDRESS, 6)}
            </code>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Copyright */}
        <p className="text-center text-tmk-gray-400 text-xs mt-6">
          © 2025 The Money Kids. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
