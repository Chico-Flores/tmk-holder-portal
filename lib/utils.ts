/**
 * Shortens an Ethereum address for display
 * @param address - Full Ethereum address
 * @param chars - Number of characters to show on each side (default 4)
 * @returns Shortened address like "0x1234...5678"
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * IPFS Gateway URLs - ordered by reliability/speed
 * Using multiple formats to handle different IPFS URI structures
 */
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
  'https://nftstorage.link/ipfs/',
  'https://w3s.link/ipfs/',
];

/**
 * Extract IPFS hash from various URI formats
 */
function extractIpfsHash(uri: string): string | null {
  if (!uri) return null;
  
  // Handle ipfs:// protocol
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', '');
  }
  
  // Handle /ipfs/ path in URL
  if (uri.includes('/ipfs/')) {
    const parts = uri.split('/ipfs/');
    return parts[parts.length - 1];
  }
  
  // Handle raw CID (starts with Qm or bafy)
  if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
    return uri;
  }
  
  return null;
}

/**
 * Converts IPFS URI to HTTP gateway URL
 * @param uri - IPFS URI (ipfs://... or https://...)
 * @param gatewayIndex - Which gateway to use (for fallbacks)
 * @returns HTTP URL using a public gateway
 */
export function ipfsToHttp(uri: string, gatewayIndex: number = 0): string {
  if (!uri) return '';
  
  // If it's already a regular HTTP URL (not IPFS), return as-is
  if ((uri.startsWith('http://') || uri.startsWith('https://')) && !uri.includes('/ipfs/')) {
    return uri;
  }
  
  // Extract IPFS hash
  const hash = extractIpfsHash(uri);
  if (hash) {
    const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
    return `${gateway}${hash}`;
  }
  
  // Return original if we can't parse it
  return uri;
}

/**
 * Get all IPFS gateway URLs for an IPFS URI (for fallbacks)
 */
export function getIpfsUrls(uri: string): string[] {
  if (!uri) return [];
  
  // If it's not an IPFS URL, just return it
  if ((uri.startsWith('http://') || uri.startsWith('https://')) && !uri.includes('/ipfs/')) {
    return [uri];
  }
  
  const hash = extractIpfsHash(uri);
  if (hash) {
    return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
  }
  
  return [uri];
}

/**
 * Formats a number with commas for display
 * @param num - Number to format
 * @returns Formatted string like "1,234"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Delays execution for a specified time
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely parses JSON, returns null on error
 */
export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Cache key for NFT metadata
 */
export function getMetadataCacheKey(address: string): string {
  return `tmk_nfts_v2_${address.toLowerCase()}`;
}

/**
 * Cache metadata to localStorage
 */
export function cacheMetadata(address: string, data: unknown): void {
  try {
    const key = getMetadataCacheKey(address);
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to cache metadata:', e);
  }
}

/**
 * Get cached metadata from localStorage
 * Returns null if cache is older than maxAge (default 5 minutes)
 */
export function getCachedMetadata<T>(address: string, maxAge: number = 5 * 60 * 1000): T | null {
  try {
    const key = getMetadataCacheKey(address);
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > maxAge) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data as T;
  } catch {
    return null;
  }
}

/**
 * Clear metadata cache for an address
 */
export function clearMetadataCache(address: string): void {
  try {
    const key = getMetadataCacheKey(address);
    localStorage.removeItem(key);
    // Also clear old cache key format
    localStorage.removeItem(`tmk_nfts_${address.toLowerCase()}`);
  } catch {
    // Ignore errors
  }
}
