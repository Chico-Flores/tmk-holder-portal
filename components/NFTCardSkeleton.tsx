'use client';

export function NFTCardSkeleton() {
  return (
    <div className="bg-tmk-gray-900 border border-tmk-gray-800 rounded-2xl overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-tmk-gray-800">
        <div className="w-full h-full animate-shimmer" />
      </div>

      {/* Content Skeleton */}
      <div className="p-4">
        {/* Title */}
        <div className="h-6 bg-tmk-gray-800 rounded-lg mb-3 w-3/4" />

        {/* Buttons */}
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-tmk-gray-800 rounded-xl" />
          <div className="w-10 h-10 bg-tmk-gray-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
