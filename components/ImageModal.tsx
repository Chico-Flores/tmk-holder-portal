'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export function ImageModal({ isOpen, imageUrl, title, onClose }: ImageModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white 
                   bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
        aria-label="Close"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Title */}
      <div className="absolute top-4 left-4 px-4 py-2 bg-black/50 rounded-xl">
        <h3 className="text-white font-bold font-heading">{title}</h3>
      </div>

      {/* Image Container */}
      <div 
        className="relative max-w-[90vw] max-h-[85vh] aspect-square"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-contain rounded-2xl"
          sizes="90vw"
          unoptimized
          priority
        />
      </div>
    </div>
  );
}
