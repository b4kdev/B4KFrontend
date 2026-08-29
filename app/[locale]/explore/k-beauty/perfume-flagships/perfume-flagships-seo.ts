import type { Metadata } from 'next'
import { hreflangAlternates, localizedUrl } from '@/lib/site-url'
import { routing } from '@/i18n/routing'
import { SEED_PERFUME_FLAGSHIPS, PERFUME_FLAGSHIPS_TOTAL } from '@/lib/kbeauty-perfume-flagships'

const PATH = '/explore/k-beauty/perfume-flagships'

export function buildPerfumeFlagshipsMetadata(locale: string): Metadata {
  const title = 'K-Beauty Flagship Tour | B4K'
  const description = `${PERFUME_FLAGSHIPS_TOTAL} real K-Beauty flagship stores across Seoul, curated by B4K.`
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

export function buildPerfumeFlagshipsJsonLd(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'K-Beauty Flagship Tour',
    numberOfItems: PERFUME_FLAGSHIPS_TOTAL,
    itemListElement: SEED_PERFUME_FLAGSHIPS.map((poi, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: poi.name_en,
      ...(poi.verified !== false ? { url: localizedUrl(locale, `/place/${poi.poi_id}`) } : {}),
    })),
  }
}
