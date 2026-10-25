import type { Metadata } from 'next'
import { localizedUrl } from '@/lib/site-url'
import { namedPageMeta, seoText } from '@/lib/seo'
import { SEED_MICHELIN_NOODLES, MICHELIN_NOODLES_TOTAL } from '@/lib/kfood-michelin-noodles'

const PATH = '/explore/k-food/michelin-noodles'

// The page heading as on the screen, "{page} | B4K"; the place count as the description.
export async function buildMichelinNoodlesMetadata(locale: string): Promise<Metadata> {
  const { t } = await seoText(locale)
  return namedPageMeta(locale, PATH, t('CD0267'), { description: t('CD1835', { count: MICHELIN_NOODLES_TOTAL }) })
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
