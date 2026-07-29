'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import type { ExplorePoi } from '@/app/api/explore/[category]/route'
import type { ExploreCategory } from './ExplorePage'
import ExplorePoiCard from './ExplorePoiCard'
import ExploreFeaturedCard from './ExploreFeaturedCard'

interface Props {
  id: string
  items: ExplorePoi[]
  category: ExploreCategory
  /** HUB_DOMAIN[category] — lowercase, no hyphen (e.g. 'kpop'), for ExplorePoiCard. */
  hubDomain: string
  viewAllHref: string
  /** Whether this section id may render a wide featured card (FEATURED_SECTIONS). */
  allowFeatured?: boolean
}

export default function ExploreSectionRow({ id, items, category, hubDomain, viewAllHref, allowFeatured }: Props) {
  const t = useTranslations('explore')

  if (items.length === 0) return null

  // Featured wide-card treatment is scoped to KD_04/KB_04 (SC-36) — 'trending'
  // re-includes the same items by dedup and must stay a plain row, so the featured
  // flag can't leak in there too.
  const featured = allowFeatured ? items.find(poi => poi.is_featured) : undefined
  const rest = featured ? items.filter(poi => poi.poi_id !== featured.poi_id) : items

  return (
    <section
      id={`section-${id}`}
      className="mb-sp-10 scroll-mt-[80px]"
      aria-label={t(`sections.${id}`)}
    >
      <div className="flex items-end justify-between mb-sp-4">
        <h2 className="text-f-sm font-semibold tracking-[0.07em] uppercase text-muted">
          {t(`sections.${id}`)}
        </h2>
        <Link
          href={viewAllHref}
          className="flex items-center gap-1 text-f-sm text-lav hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 ml-sp-4"
          aria-label={t('viewAllAria', { section: t(`sections.${id}`) })}
        >
          {t('viewAll')}
          <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
      {featured && <ExploreFeaturedCard poi={featured} domain={category.toUpperCase()} />}
      {rest.length > 0 && (
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-sp-4 lg:-mx-sp-6 px-sp-4 lg:px-sp-6">
          <div className="flex gap-sp-3 pb-[4px]" style={{ width: 'max-content' }}>
            {rest.map(poi => (
              <ExplorePoiCard key={poi.poi_id} poi={poi} domain={hubDomain} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
