import type { Metadata } from 'next';
import { Work_Sans, IBM_Plex_Mono } from 'next/font/google';
import { SITE_URL } from '@/lib/site-url';
import './globals.css';

const workSans = Work_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-work-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'B4K | Korea Travel & Culture',
  description: 'Discover K-culture experiences across Korea',
  icons: {
    icon: '/icon.svg',
    apple: '/brand/B4K_BrandLogo_Square_White.svg',
  },
  openGraph: {
    title: 'B4K | Korea Travel & Culture',
    description: 'Discover K-culture experiences across Korea',
    siteName: 'B4K',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'B4K | Korea Travel & Culture',
    description: 'Discover K-culture experiences across Korea',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={`${workSans.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
