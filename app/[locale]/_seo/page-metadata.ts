import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { hreflangAlternates, localizedUrl } from '@/lib/site-url';
import { fetchCollectionDetail } from '@/lib/collections';

// Page metadata shared by the live pages and the v2 screens that serve the same addresses
// (lib/v2-live.ts), so a page keeps its title, canonical and hreflang whichever screen renders it.

function pageMetadata(
  locale: string,
  path: string,
  title: string,
  description: string,
  type: 'website' | 'article' = 'website',
  robots?: Metadata['robots'],
): Metadata {
  const url = localizedUrl(locale, path);
  return {
    title,
    description,
    alternates: { canonical: url, languages: hreflangAlternates(path) },
    ...(robots ? { robots } : {}),
    openGraph: { title, description, url, siteName: 'B4K', locale, type },
  };
}

export function homeMetadata(locale: string): Metadata {
  return { alternates: { canonical: localizedUrl(locale, ''), languages: hreflangAlternates('') } };
}

export async function helpMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'help' });
  const tRoutes = await getTranslations({ locale, namespace: 'routes.help' });
  return pageMetadata(locale, '/help', `${t('title')} | B4K`, tRoutes('empty.desc'));
}

export const LEGAL_DOCS = ['terms', 'privacy', 'cookies'] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];
const LEGAL_NAMESPACE: Record<LegalDoc, string> = {
  terms: 'routes.legalTerms',
  privacy: 'routes.legalPrivacy',
  cookies: 'routes.legalCookies',
};

export async function legalMetadata(doc: LegalDoc, locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: LEGAL_NAMESPACE[doc] });
  return pageMetadata(locale, `/legal/${doc}`, `${t('title')} | B4K`, t('empty.desc'), 'article');
}

export async function notificationsMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'notifications' });
  return pageMetadata(locale, '/notifications', `${t('title')} | B4K`, t('empty.desc'));
}

export async function searchMetadata(locale: string, q?: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'search' });
  const query = q?.trim();
  const title = query ? `${t('title')}: ${query} | B4K` : `${t('title')} | B4K`;
  // Query-dependent results pages aren't worth indexing individually.
  return pageMetadata(locale, '/search', title, t('placeholder'), 'website', { index: false, follow: true });
}

export const loginMetadata: Metadata = { title: 'Sign in | B4K' };

export async function collectionMetadata(slug: string, locale: string): Promise<Metadata> {
  const detail = await fetchCollectionDetail(slug, locale);
  if (!detail) return {};
  return { title: `${detail.title} | B4K` };
}
