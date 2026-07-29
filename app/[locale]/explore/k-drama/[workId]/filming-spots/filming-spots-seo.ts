import type { Metadata } from 'next'
import { hreflangAlternates, localizedUrl } from '@/lib/site-url'
import { routing } from '@/i18n/routing'
import type { FilmingSpotsDetail } from '@/lib/kdrama-filming-spots'

export function buildFilmingSpotsMetadata(detail: FilmingSpotsDetail, locale: string): Metadata {
  const title = `${detail.workNameEn} Filming Spots | B4K`
  const description = `${detail.totalCount} real filming locations from ${detail.workNameEn}, curated by B4K.`
  const path = `/explore/k-drama/${detail.workId}/filming-spots`
  const url = localizedUrl(locale, path)
  const otherLocales = routing.locales.filter(l => l !== locale)

  return {
    title,
    description,
    alternates: { canonical: url, languages: hreflangAlternates(path) },
    openGraph: { title, description, url, siteName: 'B4K', locale, alternateLocale: otherLocales, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
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
