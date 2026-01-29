# TMK Holder Portal

NFT holder verification portal for **THE MONEY KIDS 2025** collection on the Cronos blockchain. Allows holders to verify wallet ownership and download exclusive Blender 3D files for their NFTs.

## Features

- Wallet connection (MetaMask & Crypto.com DeFi Wallet)
- Automatic Cronos network detection and switching
- NFT ownership verification
- Secure Blender file downloads via Cloudflare R2
- Responsive design with TMK branding

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Blockchain:** ethers.js v6
- **File Storage:** Cloudflare R2
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare R2 bucket (for downloads)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your R2 credentials

# Run development server
npm run dev
```

### Environment Variables

```env
# Public
NEXT_PUBLIC_CONTRACT_ADDRESS=0x16F67329271fac6922d7650f87EA59C4C4C3304D
NEXT_PUBLIC_CRONOS_RPC=https://evm.cronos.org
NEXT_PUBLIC_CHAIN_ID=25

# Private (Cloudflare R2)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=tmk-blender-files
```

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### R2 Setup

1. Create bucket named `tmk-blender-files`
2. Upload .blend files named by token ID (e.g., `1.blend`, `42.blend`)
3. Create API token with R2 read access
4. Add credentials to Vercel environment variables

## Contract

- **Network:** Cronos Mainnet (Chain ID: 25)
- **Address:** `0x16F67329271fac6922d7650f87EA59C4C4C3304D`
- **Collection:** THE MONEY KIDS 2025
- **Supply:** 1503 NFTs

## License

© 2025 The Money Kids. All rights reserved.
