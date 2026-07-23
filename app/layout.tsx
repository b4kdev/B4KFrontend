import type { Metadata } from 'next';
import {
  Work_Sans,
  IBM_Plex_Mono,
  M_PLUS_1,
  Noto_Sans_SC,
  Noto_Sans_TC,
  IBM_Plex_Sans_Thai,
} from 'next/font/google';
import { getLocale } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
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

const mPlus1 = M_PLUS_1({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-m-plus-1',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
});

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-noto-sans-tc',
  display: 'swap',
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ['thai'],
  weight: ['400'],
  variable: '--font-ibm-plex-sans-thai',
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${workSans.variable} ${ibmPlexMono.variable} ${mPlus1.variable} ${notoSansSC.variable} ${notoSansTC.variable} ${ibmPlexSansThai.variable}`}
    >
      <body className="antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
