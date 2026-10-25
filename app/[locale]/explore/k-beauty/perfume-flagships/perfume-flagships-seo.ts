import type { Metadata } from 'next'
import { localizedUrl } from '@/lib/site-url'
import { namedPageMeta, seoText } from '@/lib/seo'
import { SEED_PERFUME_FLAGSHIPS, PERFUME_FLAGSHIPS_TOTAL } from '@/lib/kbeauty-perfume-flagships'

const PATH = '/explore/k-beauty/perfume-flagships'

// The page heading as on the screen, "{page} | B4K"; the place count as the description.
export async function buildPerfumeFlagshipsMetadata(locale: string): Promise<Metadata> {
  const { t } = await seoText(locale)
  return namedPageMeta(locale, PATH, t('CD0272'), { description: t('CD1835', { count: PERFUME_FLAGSHIPS_TOTAL }) })
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
