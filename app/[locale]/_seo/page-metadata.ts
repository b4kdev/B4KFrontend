import type { Metadata } from 'next';
import { fetchCollectionDetail } from '@/lib/collections';
import { bffFetch } from '@/lib/bff';
import { isNumericId, mapBffToDetail, type BffItinerary } from '@/lib/itinerary';
import { cutName, fitDescription, fitTitle, namedPageMeta, NOINDEX, pageMeta, regionName, seoText } from '@/lib/seo';
import { termsLastUpdated } from '@/content/legal/terms-content';
import { privacyPolicyLastUpdated } from '@/content/legal/privacy-policy-content';
import { cookiePolicyLastUpdated } from '@/content/legal/cookie-policy-content';

// Page metadata shared by the live pages and the v2 screens that serve the same addresses
// (lib/v2-live.ts), so a page keeps its title, canonical and hreflang whichever screen renders it.

export function homeMetadata(locale: string): Promise<Metadata> {
  return seoText(locale).then(({ t }) => pageMeta({ locale, path: '', title: t('CD0800'), description: fitDescription(t('CD0799')) }));
}

export async function helpMetadata(locale: string): Promise<Metadata> {
  const { t } = await seoText(locale);
  return pageMeta({ locale, path: '/help', title: t('CD1837'), description: fitDescription(t('CD1838')) });
}

export const LEGAL_DOCS = ['terms', 'privacy', 'cookies'] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];
const LEGAL: Record<LegalDoc, { key: string; updated: string }> = {
  terms: { key: 'routes.legalTerms.title', updated: termsLastUpdated },
  privacy: { key: 'routes.legalPrivacy.title', updated: privacyPolicyLastUpdated },
  cookies: { key: 'routes.legalCookies.title', updated: cookiePolicyLastUpdated },
};

export async function legalMetadata(doc: LegalDoc, locale: string): Promise<Metadata> {
  const { t, k } = await seoText(locale);
  const page = k(LEGAL[doc].key);
  return pageMeta({ locale, path: `/legal/${doc}`, title: t('CD1832', { page }), description: fitDescription(t('CD1836', { page, date: LEGAL[doc].updated })), type: 'article' });
}

// About B4K stays out of search results until its company details are written.
export async function aboutMetadata(locale: string): Promise<Metadata> {
  const { t } = await seoText(locale);
  return namedPageMeta(locale, '/about', t('CD1173'), { description: t('CD1687'), robots: NOINDEX });
}

export async function notificationsMetadata(locale: string): Promise<Metadata> {
  const { k } = await seoText(locale);
  return namedPageMeta(locale, '/notifications', k('notifications.title'), { robots: NOINDEX });
}

// Results pages depend on the query: kept out of search results, one title for all.
export async function searchMetadata(locale: string): Promise<Metadata> {
  const { k } = await seoText(locale);
  return namedPageMeta(locale, '/search', k('search.title'), { robots: NOINDEX });
}

export async function loginMetadata(locale: string): Promise<Metadata> {
  const { t } = await seoText(locale);
  return namedPageMeta(locale, '/login', t('CD0050'), { robots: NOINDEX });
}

export async function savedMetadata(locale: string): Promise<Metadata> {
  const { k } = await seoText(locale);
  return namedPageMeta(locale, '/saved', k('saved.title'), { robots: NOINDEX });
}

export async function settingsMetadata(locale: string): Promise<Metadata> {
  const { t } = await seoText(locale);
  return namedPageMeta(locale, '/settings', t('CD0823'), { robots: NOINDEX });
}

export async function exploreMetadata(locale: string): Promise<Metadata> {
  const { t } = await seoText(locale);
  return pageMeta({ locale, path: '/explore', title: t('CD1824'), description: fitDescription(t('CD1825')) });
}

export async function profileOwnMetadata(locale: string): Promise<Metadata> {
  const { t } = await seoText(locale);
  return namedPageMeta(locale, '/profile', t('CD0821'), { robots: NOINDEX });
}

// A planner's profile stays out of search results at launch; its title is the planner's name.
export async function profileMetadata(locale: string, id: string): Promise<Metadata> {
  const name = await bffFetch<{ name: string | null }>(`/profiles/${encodeURIComponent(id)}`, { token: null }).then((p) => p.name).catch(() => null);
  const { t } = await seoText(locale);
  return namedPageMeta(locale, `/profile/${id}`, name || t('CD0821'), { robots: NOINDEX });
}

// A collection (theme) page: its title, and its intro or the place count as the description.
export async function collectionMetadata(slug: string, locale: string): Promise<Metadata> {
  const detail = await fetchCollectionDetail(slug, locale);
  if (!detail) return {};
  const { t } = await seoText(locale);
  return namedPageMeta(locale, `/explore/collections/${slug}`, detail.title, {
    description: t('CD1835', { count: detail.totalCount }),
    image: detail.items.find((i) => i.primary_image_url)?.primary_image_url,
  });
}


// Shared plan page: "{plan}: n stops in n days | B4K", the region, author and first three stops as
// the description, the first stop's photo as the share preview. Read without the visitor's session,
// so only a public plan gives its details; a plan that is not public stays out of search results.
export async function planMetadata(locale: string, id: string): Promise<Metadata> {
  const path = `/plan/${id}`;
  if (!isNumericId(id)) return {};
  let bff: BffItinerary;
  let detail: ReturnType<typeof mapBffToDetail>;
  try {
    bff = await bffFetch<BffItinerary>(`/itineraries/public/${id}`, { token: null });
    detail = mapBffToDetail(bff);
  } catch {
    return { robots: NOINDEX };
  }
  const { t } = await seoText(locale);
  const days = bff.total_days || Math.max(1, ...detail.stops.map((s) => s.day ?? 1));
  const count = detail.stops.length;
  const name = cutName(detail.title, 40);
  const title = fitTitle(t('CD1833', { planName: name, count, days }), t('CD1832', { page: name }));
  const stopName = (s: (typeof detail.stops)[number]) => (locale === 'ko' ? s.poi.name_ko : s.poi.name_en || s.poi.name_ko);
  // The BFF names the region in Korean (서울): other languages get its English name; none = Korea.
  const region = regionName(bff.region, locale) ?? (locale === 'ko' ? '한국' : 'Korea');
  const author = detail.author.name_preferred;
  const description = author
    ? fitDescription(t('CD1834', { region, author, stops: detail.stops.slice(0, 3).map(stopName).join(', ') }))
    : undefined;
  const image = detail.stops.find((s) => s.poi.primary_image_url)?.poi.primary_image_url ?? undefined;
  return pageMeta({ locale, path, title, description, type: 'article', robots: detail.is_published ? undefined : NOINDEX, image });
}
