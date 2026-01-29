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
 * Converts IPFS URI to HTTP gateway URL
 * @param uri - IPFS URI (ipfs://... or https://...)
 * @returns HTTP URL using a public gateway
 */
export function ipfsToHttp(uri: string): string {
  if (!uri) return '';
  
  // Already HTTP(S)
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  // IPFS protocol
  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${hash}`;
  }
  
  // Just a hash
  if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
    return `https://ipfs.io/ipfs/${uri}`;
  }
  
  return uri;
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
