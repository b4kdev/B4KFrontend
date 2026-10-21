import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { hreflangAlternates, localizedUrl } from '@/lib/site-url';
import { fetchCollectionDetail } from '@/lib/collections';
import { createTranslator } from 'next-intl';
import { bffFetch } from '@/lib/bff';
import { isNumericId, mapBffToDetail, type BffItinerary } from '@/lib/itinerary';
import { mergeCd } from '@/components/v2/messages';
import enV2 from '@/messages/v2/en.json';

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

// Shared plan page: title, stop count and the first stop's photo as the share preview (Open Graph
// and Twitter). Read without the visitor's session, so only a public plan gives its details; a
// plan that is not public keeps the default preview and stays out of search results.
export async function planMetadata(locale: string, id: string): Promise<Metadata> {
  const path = `/plan/${id}`;
  if (!isNumericId(id)) return {};
  let detail: ReturnType<typeof mapBffToDetail>;
  try {
    detail = mapBffToDetail(await bffFetch<BffItinerary>(`/itineraries/public/${id}`, { token: null }));
  } catch {
    return { robots: { index: false, follow: true } };
  }
  const load = (name: string): Promise<{ cd?: Record<string, string> }> =>
    import(`@/messages/v2/${name}.json`).then((m) => m.default).catch(() => ({}));
  const [deck, supplement] = await Promise.all([load(locale), load(`supplement/${locale}`)]);
  const t = createTranslator({ locale, messages: { cd: mergeCd(enV2.cd, deck.cd, supplement.cd) }, namespace: 'cd' });
  const title = `${detail.title} | B4K`;
  const description = t('CD0473', { n: detail.stops.length });
  const image = detail.stops.find((s) => s.poi.primary_image_url)?.poi.primary_image_url ?? undefined;
  const meta = pageMetadata(locale, path, title, description, 'article', detail.is_published ? undefined : { index: false, follow: true });
  return {
    ...meta,
    openGraph: { ...meta.openGraph, ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, ...(image ? { images: [image] } : {}) },
  };
}
