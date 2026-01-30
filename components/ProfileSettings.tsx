'use client';

import { useState, useEffect } from 'react';
import { Holding } from '@/lib/supabase';

// R2 public URL for images
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: Holding[];
  currentUsername: string | null;
  currentProfileNftId: number | null;
  currentTwitterHandle: string | null;
  onSave: (username: string | null, profileNftId: number | null, twitterHandle: string | null) => Promise<{ success: boolean; error?: string }>;
}

export function ProfileSettings({
  isOpen,
  onClose,
  holdings,
  currentUsername,
  currentProfileNftId,
  currentTwitterHandle,
  onSave,
}: ProfileSettingsProps) {
  const [username, setUsername] = useState(currentUsername || '');
  const [selectedNftId, setSelectedNftId] = useState<number | null>(currentProfileNftId);
  const [twitterHandle, setTwitterHandle] = useState(currentTwitterHandle || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername || '');
      setSelectedNftId(currentProfileNftId);
      setTwitterHandle(currentTwitterHandle || '');
      setError(null);
    }
  }, [isOpen, currentUsername, currentProfileNftId, currentTwitterHandle]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    const result = await onSave(
      username.trim() || null, 
      selectedNftId, 
      twitterHandle.trim() || null
    );

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to save profile');
    }

    setIsSaving(false);
  };

  const handleClearProfilePic = () => {
    setSelectedNftId(null);
  };

  // Get current holdings (owned NFTs)
  const ownedNfts = holdings.filter(h => h.is_current);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-tmk-gray-900 border border-tmk-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-tmk-gray-800">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 text-tmk-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* 1. Username Section (at top) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-tmk-gray-400 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a display name"
              maxLength={20}
              className="w-full px-3 py-2 bg-tmk-gray-800 border border-tmk-gray-700 rounded-lg
                         text-white placeholder-tmk-gray-500 focus:outline-none focus:border-tmk-red"
            />
            <p className="text-tmk-gray-500 text-xs mt-2">
              3-20 characters, letters, numbers, _ and - only
            </p>
          </div>

          {/* 2. Twitter Handle Section (in middle) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-tmk-gray-400 mb-2">
              Twitter / X Handle
            </label>
            <div className="flex items-center">
              <span className="text-tmk-gray-500 mr-2">@</span>
              <input
                type="text"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value.replace(/^@/, ''))}
                placeholder="yourhandle"
                maxLength={15}
                className="flex-1 px-3 py-2 bg-tmk-gray-800 border border-tmk-gray-700 rounded-lg
                           text-white placeholder-tmk-gray-500 focus:outline-none focus:border-tmk-red"
              />
            </div>
            <p className="text-tmk-gray-500 text-xs mt-2">
              Your Twitter handle will be displayed on the leaderboard
            </p>
          </div>

          {/* 3. Profile Picture Section (at bottom) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-tmk-gray-400 mb-2">
              Profile Picture
            </label>
            <p className="text-tmk-gray-500 text-sm mb-4">
              Select one of your NFTs as your profile picture
            </p>

            {ownedNfts.length === 0 ? (
              <p className="text-tmk-gray-500 text-center py-4 bg-tmk-gray-800/50 rounded-lg">
                No NFTs found. Hold TMK NFTs to use them as your profile picture.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-3 mb-4 max-h-48 overflow-y-auto p-1">
                  {ownedNfts.map((holding) => {
                    const imageUrl = R2_PUBLIC_URL 
                      ? `${R2_PUBLIC_URL}/images/${holding.token_id}.png`
                      : '';
                    const isSelected = selectedNftId === holding.token_id;

                    return (
                      <button
                        key={holding.token_id}
                        onClick={() => setSelectedNftId(holding.token_id)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          isSelected 
                            ? 'border-tmk-red ring-2 ring-tmk-red/50' 
                            : 'border-tmk-gray-700 hover:border-tmk-gray-600'
                        }`}
                      >
                        <img
                          src={imageUrl}
                          alt={`TMK #${holding.token_id}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center">
                          #{holding.token_id}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-tmk-red rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedNftId && (
                  <button
                    onClick={handleClearProfilePic}
                    className="text-sm text-tmk-gray-400 hover:text-white underline"
                  >
                    Remove profile picture
                  </button>
                )}
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-tmk-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-tmk-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-tmk-red hover:bg-tmk-red-hover text-white font-semibold 
                       rounded-xl transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
