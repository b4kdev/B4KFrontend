import type { Metadata } from 'next';
import { hreflangAlternates, localizedUrl, SITE_URL } from '@/lib/site-url';
import HomeClient from './HomeClient';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const url = localizedUrl(params.locale, '');
  return {
    alternates: { canonical: url, languages: hreflangAlternates('') },
  };
}

function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'B4K',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/en/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export default function Page() {
  const jsonLd = buildWebsiteJsonLd();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeClient />
    </>
  );
}
