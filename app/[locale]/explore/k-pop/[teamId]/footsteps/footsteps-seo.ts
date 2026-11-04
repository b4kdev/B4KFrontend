import type { Metadata } from 'next'
import { localizedUrl } from '@/lib/site-url'
import { namedPageMeta, seoText } from '@/lib/seo'
import type { FootstepsDetail } from '@/lib/kpop-footsteps'

// The page heading as on the screen, "{page} | B4K"; the place count as the description.
export async function buildFootstepsMetadata(detail: FootstepsDetail, locale: string): Promise<Metadata> {
  const { t } = await seoText(locale)
  return namedPageMeta(locale, `/explore/k-pop/${detail.teamId}/footsteps`, locale === 'ko' ? detail.teamNameKo : detail.teamNameEn, { description: t('CD1835', { count: detail.totalCount }) })
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
