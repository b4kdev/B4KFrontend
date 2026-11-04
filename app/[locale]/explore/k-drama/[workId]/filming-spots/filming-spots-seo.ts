import type { Metadata } from 'next'
import { localizedUrl } from '@/lib/site-url'
import { namedPageMeta, seoText } from '@/lib/seo'
import type { FilmingSpotsDetail } from '@/lib/kdrama-filming-spots'

// The page heading as on the screen, "{page} | B4K"; the place count as the description.
export async function buildFilmingSpotsMetadata(detail: FilmingSpotsDetail, locale: string): Promise<Metadata> {
  const { t } = await seoText(locale)
  return namedPageMeta(locale, `/explore/k-drama/${detail.workId}/filming-spots`, locale === 'ko' ? detail.workNameKo : detail.workNameEn, { description: t('CD1835', { count: detail.totalCount }) })
}

export function buildFilmingSpotsJsonLd(detail: FilmingSpotsDetail, locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${detail.workNameEn} Filming Spots`,
    numberOfItems: detail.totalCount,
    itemListElement: detail.items.map((poi, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: poi.name_en,
      ...(poi.verified !== false ? { url: localizedUrl(locale, `/place/${poi.poi_id}`) } : {}),
    })),
  }
}
