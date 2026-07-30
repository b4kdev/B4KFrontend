import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { hreflangAlternates, localizedUrl } from '@/lib/site-url'
import type { ExploreCategory } from './ExplorePage'

const CATEGORY_MAP: Record<ExploreCategory, { tKey: string; path: string }> = {
  'k-pop':     { tKey: 'kpop',    path: '/explore/k-pop' },
  'k-drama':   { tKey: 'kdrama',  path: '/explore/k-drama' },
  'k-beauty':  { tKey: 'kbeauty', path: '/explore/k-beauty' },
  'k-food':    { tKey: 'kfood',   path: '/explore/k-food' },
  'k-culture': { tKey: 'kculture', path: '/explore/k-culture' },
}

// SC-28 (F-DGWQGW) — per-hub metadata: title `{Page name} | B4K`, description
// from the hub's own copy (already ≤140 chars), OG type `article` for Explore,
// locale + og:locale:alternate for the other 6 languages.
export async function buildExploreMetadata(
  category: ExploreCategory,
  locale: string
): Promise<Metadata> {
  const { tKey, path } = CATEGORY_MAP[category]
  const t = await getTranslations({ locale, namespace: 'explore' })
  const title = t(`${tKey}.title`)
  const description = t(`hub.${tKey}.desc`)
  const fullTitle = `${title} | B4K`
  const url = localizedUrl(locale, path)

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
      languages: hreflangAlternates(path),
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: 'B4K',
      locale,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
  }
}

export async function buildExploreBreadcrumbJsonLd(category: ExploreCategory, locale: string) {
  const { tKey, path } = CATEGORY_MAP[category]
  const t = await getTranslations({ locale, namespace: 'explore' })
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'B4K', item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: t('title'), item: localizedUrl(locale, '/explore') },
      { '@type': 'ListItem', position: 3, name: t(`${tKey}.title`), item: localizedUrl(locale, path) },
    ],
  }
}
