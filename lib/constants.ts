// Contract Details
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x16F67329271fac6922d7650f87EA59C4C4C3304D';
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '25');
export const CHAIN_ID_HEX = '0x19';
export const RPC_URL = process.env.NEXT_PUBLIC_CRONOS_RPC || 'https://evm.cronos.org';
export const BLOCK_EXPLORER = 'https://explorer.cronos.org';
export const COLLECTION_NAME = 'THE MONEY KIDS 2025';
export const TOTAL_SUPPLY = 1503;

// Cronos Network Configuration
export const CRONOS_CHAIN_CONFIG = {
  chainId: CHAIN_ID_HEX,
  chainName: 'Cronos Mainnet',
  nativeCurrency: { 
    name: 'CRO', 
    symbol: 'CRO', 
    decimals: 18 
  },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [BLOCK_EXPLORER]
};

// Contract ABI (minimal required functions)
export const CONTRACT_ABI = [
  'function tokensOfOwner(address owner) external view returns (uint256[])',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function ownerOf(uint256 tokenId) external view returns (address)'
];

// External Links
export const MARKETPLACE_URL = 'https://crypto.com/nft';
export const CONTRACT_EXPLORER_URL = `${BLOCK_EXPLORER}/token/${CONTRACT_ADDRESS}`;
