import type { Metadata } from 'next'
import { hreflangAlternates, localizedUrl } from '@/lib/site-url'
import { routing } from '@/i18n/routing'
import { SEED_MICHELIN_NOODLES, MICHELIN_NOODLES_TOTAL } from '@/lib/kfood-michelin-noodles'

const PATH = '/explore/k-food/michelin-noodles'

export function buildMichelinNoodlesMetadata(locale: string): Metadata {
  const title = 'Michelin-Picked Noodles | B4K'
  const description = `${MICHELIN_NOODLES_TOTAL} Michelin-recognized noodle restaurants across Korea, curated by B4K.`
  const url = localizedUrl(locale, PATH)
  const otherLocales = routing.locales.filter(l => l !== locale)

  return {
    title,
    description,
    alternates: { canonical: url, languages: hreflangAlternates(PATH) },
    openGraph: { title, description, url, siteName: 'B4K', locale, alternateLocale: otherLocales, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export function buildMichelinNoodlesJsonLd(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Michelin-Picked Noodles',
    numberOfItems: MICHELIN_NOODLES_TOTAL,
    itemListElement: SEED_MICHELIN_NOODLES.map((poi, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: poi.name_en,
      ...(poi.verified !== false ? { url: localizedUrl(locale, `/place/${poi.poi_id}`) } : {}),
    })),
  }
}
