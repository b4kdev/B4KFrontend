import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { hreflangAlternates, localizedUrl } from '@/lib/site-url';
import SearchClient from './SearchClient';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { q?: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'search' });
  const query = searchParams.q?.trim();
  const title = query ? `${t('title')}: ${query} | B4K` : `${t('title')} | B4K`;
  const description = t('placeholder');
  const url = localizedUrl(params.locale, '/search');
  return {
    title,
    description,
    alternates: { canonical: url, languages: hreflangAlternates('/search') },
    // Query-dependent results pages aren't worth indexing individually.
    robots: { index: false, follow: true },
    openGraph: { title, description, url, siteName: 'B4K', locale: params.locale, type: 'website' },
  };
}

export default function Page() {
  return <SearchClient />;
}
