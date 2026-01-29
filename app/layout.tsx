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
  title: 'TMK Holder Portal | THE MONEY KIDS 2025',
  description: 'Verify your wallet to access exclusive Blender 3D files for your TMK NFTs on the Cronos blockchain.',
  keywords: ['TMK', 'The Money Kids', 'NFT', 'Cronos', 'Blender', '3D', 'Holder Portal'],
  openGraph: {
    title: 'TMK Holder Portal | THE MONEY KIDS 2025',
    description: 'Access exclusive Blender 3D files for your Money Kids NFTs',
    type: 'website',
    url: 'https://tmknft.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TMK Holder Portal',
    description: 'Access exclusive Blender 3D files for your Money Kids NFTs',
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
