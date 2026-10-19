import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_URL } from '@/lib/site-url';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import './tokens.css';
import './globals.css';
import './legacy.css';
import { fontVariables } from './fonts';

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
      className={fontVariables}
    >
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
