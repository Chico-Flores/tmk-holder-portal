// Points Configuration
export const POINTS_CONFIG = {
  // Daily holding points
  DAILY_POINTS_PER_NFT: 10,
  DAILY_POINTS_PER_NFT_BONUS: 15, // For 5+ NFT holders
  BONUS_THRESHOLD: 5, // Number of NFTs needed for bonus rate

  // One-time bonuses
  FIRST_VERIFICATION_BONUS: 100,

  // Holding milestones (days -> points per NFT)
  MILESTONES: {
    30: 500,
    90: 2000,
    365: 10000,
  } as Record<number, number>,
};

// Point sources for logging
export const POINT_SOURCES = {
  DAILY_HOLDING: 'daily_holding',
  FIRST_VERIFICATION: 'first_verification',
  MILESTONE_30D: 'milestone_30d',
  MILESTONE_90D: 'milestone_90d',
  MILESTONE_365D: 'milestone_365d',
  REWARD_REDEMPTION: 'reward_redemption',
} as const;

export type PointSource = typeof POINT_SOURCES[keyof typeof POINT_SOURCES];

/**
 * Calculate daily points for a given number of NFTs
 */
export function calculateDailyPoints(nftCount: number): number {
  if (nftCount === 0) return 0;
  
  const pointsPerNFT = nftCount >= POINTS_CONFIG.BONUS_THRESHOLD
    ? POINTS_CONFIG.DAILY_POINTS_PER_NFT_BONUS
    : POINTS_CONFIG.DAILY_POINTS_PER_NFT;
  
  return nftCount * pointsPerNFT;
}

/**
 * Get the daily rate description for display
 */
export function getDailyRateDescription(nftCount: number): string {
  if (nftCount === 0) return '0 pts/day';
  
  const pointsPerNFT = nftCount >= POINTS_CONFIG.BONUS_THRESHOLD
    ? POINTS_CONFIG.DAILY_POINTS_PER_NFT_BONUS
    : POINTS_CONFIG.DAILY_POINTS_PER_NFT;
  
  const total = calculateDailyPoints(nftCount);
  const bonus = nftCount >= POINTS_CONFIG.BONUS_THRESHOLD ? ' (bonus!)' : '';
  
  return `${total} pts/day${bonus}`;
}

/**
 * Calculate days held from first_seen_at timestamp
 */
export function calculateDaysHeld(firstSeenAt: string): number {
  const firstSeen = new Date(firstSeenAt);
  const now = new Date();
  const diffMs = now.getTime() - firstSeen.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get next milestone for an NFT
 */
export function getNextMilestone(daysHeld: number): { days: number; points: number } | null {
  const milestones = Object.entries(POINTS_CONFIG.MILESTONES)
    .map(([days, points]) => ({ days: parseInt(days), points }))
    .sort((a, b) => a.days - b.days);
  
  for (const milestone of milestones) {
    if (daysHeld < milestone.days) {
      return milestone;
    }
  }
  
  return null; // All milestones achieved
}

/**
 * Format points with commas
 */
export function formatPoints(points: number): string {
  return points.toLocaleString();
}

/**
 * Format wallet address for display (shortened)
 */
export function formatWalletAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Calculate potential earnings for X days
 */
export function calculatePotentialEarnings(nftCount: number, days: number): number {
  const dailyPoints = calculateDailyPoints(nftCount);
  let total = dailyPoints * days;
  
  // Add milestones that would be reached
  const milestones = Object.entries(POINTS_CONFIG.MILESTONES)
    .map(([d, points]) => ({ days: parseInt(d), points }))
    .filter(m => m.days <= days);
  
  for (const milestone of milestones) {
    total += milestone.points * nftCount;
  }
  
  return total;
}
