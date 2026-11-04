import type { Metadata } from 'next'
import { localizedUrl } from '@/lib/site-url'
import { namedPageMeta, seoText } from '@/lib/seo'
import type { HeritageDetail } from '@/lib/kculture-heritage'

// The page heading as on the screen, "{page} | B4K"; the place count as the description.
export async function buildHeritageMetadata(detail: HeritageDetail, locale: string): Promise<Metadata> {
  const { t } = await seoText(locale)
  return namedPageMeta(locale, `/explore/k-culture/${detail.region}/heritage`, locale === 'ko' ? detail.regionNameKo : detail.regionNameEn, { description: t('CD1835', { count: detail.totalCount }) })
}

export function buildHeritageJsonLd(detail: HeritageDetail, locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${detail.regionNameEn} UNESCO Heritage`,
    numberOfItems: detail.totalCount,
    itemListElement: detail.items.map((poi, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: poi.name_en,
      ...(poi.verified !== false ? { url: localizedUrl(locale, `/place/${poi.poi_id}`) } : {}),
    })),
  }
}
