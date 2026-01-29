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
 */
const IPFS_GATEWAYS = [
  'https://nftstorage.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.io/ipfs/',
];

/**
 * Converts IPFS URI to HTTP gateway URL
 * @param uri - IPFS URI (ipfs://... or https://...)
 * @param gatewayIndex - Which gateway to use (for fallbacks)
 * @returns HTTP URL using a public gateway
 */
export function ipfsToHttp(uri: string, gatewayIndex: number = 0): string {
  if (!uri) return '';
  
  // Already HTTP(S) - but check if it's using a slow gateway
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    // Replace slow ipfs.io gateway with faster one
    if (uri.includes('ipfs.io/ipfs/')) {
      const hash = uri.split('/ipfs/')[1];
      return `${IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]}${hash}`;
    }
    return uri;
  }
  
  // IPFS protocol
  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '');
    return `${IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]}${hash}`;
  }
  
  // Just a hash
  if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
    return `${IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]}${uri}`;
  }
  
  return uri;
}

/**
 * Get all IPFS gateway URLs for an IPFS URI (for fallbacks)
 */
export function getIpfsUrls(uri: string): string[] {
  return IPFS_GATEWAYS.map((_, index) => ipfsToHttp(uri, index));
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
  return `tmk_nfts_${address.toLowerCase()}`;
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
