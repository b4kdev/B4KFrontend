import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NextRequest } from 'next/server'
import { localizedUrl } from '@/lib/site-url'
import { fitDescription, pageMeta, seoText } from '@/lib/seo'
import { CATEGORIES, rowName } from '@/components/v2/categories'
import { GET as exploreGet, type ExploreData } from '@/app/api/explore/[category]/route'

export type ExploreCategory = 'k-pop' | 'k-drama' | 'k-beauty' | 'k-food' | 'k-culture'

const CATEGORY_MAP: Record<ExploreCategory, { tKey: string; path: string }> = {
  'k-pop':     { tKey: 'kpop',    path: '/explore/k-pop' },
  'k-drama':   { tKey: 'kdrama',  path: '/explore/k-drama' },
  'k-beauty':  { tKey: 'kbeauty', path: '/explore/k-beauty' },
  'k-food':    { tKey: 'kfood',   path: '/explore/k-food' },
  'k-culture': { tKey: 'kculture', path: '/explore/k-culture' },
}

// A category page: "{category} spots in Korea | B4K"; the description counts its places and names
// its first three rows, read from the same data as the page (/api/explore/[category]); without rows
// the count alone, and the hub line when the data is not there.
export async function buildExploreMetadata(
  category: ExploreCategory,
  locale: string
): Promise<Metadata> {
  const { path } = CATEGORY_MAP[category]
  const { t, k } = await seoText(locale)
  const name = t(CATEGORIES.find((c) => c.slug === category)?.label ?? 'CD0804')
  let description: string | undefined
  try {
    const res = await exploreGet(new NextRequest(localizedUrl(locale, `/api/explore/${category}`)), { params: { category } })
    const data = (await res.json()) as ExploreData
    const rows = data.sections.filter((s) => s.items.length && s.id !== 'trending')
    const count = new Set(data.sections.flatMap((s) => s.items.map((i) => i.poi_id))).size
    if (count) {
      description = rows.length
        ? t('CD1827', { count, kinds: rows.slice(0, 3).map((r) => rowName(category, r.id, t, k)).join(', ') })
        : t('CD1828', { count, category: name })
    }
  } catch {
    // the hub line below
  }
  return pageMeta({ locale, path, title: t('CD1826', { category: name }), description: fitDescription(description ?? t(CATEGORIES.find((c) => c.slug === category)?.sub ?? 'CD0799')), type: 'article' })
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
