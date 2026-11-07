import { SITE_URL } from '@/lib/site-url';

// WebSite structured data with the site search action in the page's language, for the Home page.
export function buildWebsiteJsonLd(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'B4K',
    alternateName: ['B4Korea', 'b4korea.com'],
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/${locale}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// Organization structured data for the Home page: ties the name B4K to this site, its logo and its
// official profiles, so a search for the brand can show the site with its name and logo.
const PROFILES: string[] = []

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'B4K',
    alternateName: ['B4Korea'],
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    ...(PROFILES.length ? { sameAs: PROFILES } : {}),
  };
}
