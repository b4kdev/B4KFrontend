import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { SITE_URL } from '@/lib/site-url';
import { seoText } from '@/lib/seo';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
// Hangul face: Pretendard Variable, dynamic subset (only the unicode ranges a page uses load).
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './tokens.css';
import './globals.css';
import { fontVariables } from './fonts';
import VercelTools from '@/components/analytics/VercelTools';
import FaviconTheme from '@/components/v2/FaviconTheme';

// The site default (every page without its own title): the Home title and description of the
// visitor's language from the Copy Deck.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { t } = await seoText(locale);
  const title = t('CD0800');
  const description = t('CD0799');
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    icons: {
      icon: '/icon.svg',
      apple: '/apple-touch-icon.png',
    },
    manifest: `/${locale}/manifest.webmanifest`,
    openGraph: { title, description, siteName: 'B4K', locale, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    // Site ownership for Naver Search Advisor (the token is public by design).
    verification: { other: { 'naver-site-verification': '40bee30ff7d84115489ea026d14d4bd452ec8437' } },
  };
}

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
        <VercelTools />
        <FaviconTheme />
      </body>
    </html>
  );
}
