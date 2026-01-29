import type { Metadata } from 'next';
import { Inter, Nunito, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const nunito = Nunito({ 
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TMK 3D Vault | THE MONEY KIDS',
  description: 'Connect your wallet to access exclusive 3D Blender files for your TMK NFTs on the Cronos blockchain.',
  keywords: ['TMK', 'The Money Kids', 'NFT', 'Cronos', 'Blender', '3D', '3D Vault'],
  openGraph: {
    title: 'TMK 3D Vault | THE MONEY KIDS',
    description: 'Access exclusive 3D Blender files for your Money Kids NFTs',
    type: 'website',
    url: 'https://tmknft.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TMK 3D Vault',
    description: 'Access exclusive 3D Blender files for your Money Kids NFTs',
  },
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${nunito.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-black antialiased">
        {children}
      </body>
    </html>
  );
}
