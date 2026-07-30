import type { Metadata } from 'next'
import { hreflangAlternates, localizedUrl } from '@/lib/site-url'
import { routing } from '@/i18n/routing'
import type { FootstepsDetail } from '@/lib/kpop-footsteps'

export function buildFootstepsMetadata(detail: FootstepsDetail, locale: string): Metadata {
  const title = `${detail.memberName} Footsteps — ${detail.teamNameEn} | B4K`
  const description = `${detail.totalCount} places connected to ${detail.memberName} of ${detail.teamNameEn}, curated by B4K.`
  const path = `/explore/k-pop/${detail.teamId}/footsteps`
  const url = localizedUrl(locale, path)
  const otherLocales = routing.locales.filter(l => l !== locale)

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: hreflangAlternates(path),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'B4K',
      locale,
      alternateLocale: otherLocales,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export function buildFootstepsJsonLd(detail: FootstepsDetail, locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${detail.memberName} Footsteps`,
    numberOfItems: detail.totalCount,
    itemListElement: detail.items.map((poi, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: poi.name_en,
      ...(poi.verified !== false ? { url: localizedUrl(locale, `/place/${poi.poi_id}`) } : {}),
    })),
  }
}
