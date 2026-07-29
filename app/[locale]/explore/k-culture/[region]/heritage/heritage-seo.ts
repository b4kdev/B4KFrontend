import type { Metadata } from 'next'
import { hreflangAlternates, localizedUrl } from '@/lib/site-url'
import { routing } from '@/i18n/routing'
import type { HeritageDetail } from '@/lib/kculture-heritage'

export function buildHeritageMetadata(detail: HeritageDetail, locale: string): Metadata {
  const title = `${detail.regionNameEn} UNESCO Heritage | B4K`
  const description = `${detail.totalCount} UNESCO heritage sites in ${detail.regionNameEn}, curated by B4K.`
  const path = `/explore/k-culture/${detail.region}/heritage`
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
