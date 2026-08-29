'use client'

import type { ComponentType } from 'react'
import useSWR from 'swr'
import { useTranslations } from 'next-intl'
import { fetcher } from '@/lib/fetcher'
import type { HomeCarouselSlide } from '@/app/api/home/carousel/route'
import MainCarousel from './_components/home/MainCarousel'
import WeatherWidget from './_components/home/WeatherWidget'
import TrendingSpots from './_components/home/TrendingSpots'
import ExploreHub from './_components/home/ExploreHub'
import PlanTrip from './_components/home/PlanTrip'
import ChallengeCard from './_components/home/ChallengeCard'
import LeaderboardBadge from './_components/home/LeaderboardBadge'
import type { HomeSectionOrder } from '@/app/api/home/section-order/route'

// Personalizable content sections, keyed by the API's section keys.
// Fixed sections (hero carousel, weather widget) are pinned outside this map.
// Curated 6-section Home (product owner, 2026-08-26) — editorial/new/
// youMightLike/continuePlan/popularPlans/partnerPackages/upcomingEvents/
// promotions dropped from Home's default composition. Components kept on
// disk, not deleted — may resurface via a future personalization pass.
const CONTENT_SECTIONS: Record<string, ComponentType> = {
  exploreHub: ExploreHub,
  trending: TrendingSpots,
  planTrip: PlanTrip,
  challenge: ChallengeCard,
  leaderboardBadge: LeaderboardBadge,
}

// Default order — the source of truth for fallback. Must list every key in
// CONTENT_SECTIONS. Used verbatim on loading / empty / error.
const DEFAULT_ORDER = [
  'exploreHub',
  'trending',
  'planTrip',
  'challenge',
  'leaderboardBadge',
]

export default function HomeClient({ initialCarousel }: { initialCarousel: HomeCarouselSlide[] }) {
  const tNav = useTranslations('nav')
  const { data } = useSWR<HomeSectionOrder>('/api/home/section-order', fetcher)

  // Data-driven order (UF-8 · DEC-32). Fall back to DEFAULT_ORDER whenever the
  // API is loading / empty / errored so the page never breaks. Unknown keys are
  // dropped; any content section the API omits is appended in its default slot
  // so no section can silently disappear.
  const apiOrder = data?.order?.filter(key => key in CONTENT_SECTIONS) ?? []
  const missing = DEFAULT_ORDER.filter(key => !apiOrder.includes(key))
  const order = apiOrder.length > 0 ? [...apiOrder, ...missing] : DEFAULT_ORDER

  return (
    <div className="pb-sp-16">
      <h1 className="sr-only">{tNav('home')}</h1>
      {/* Hero: full bleed — pinned first, never reordered */}
      <MainCarousel initialData={initialCarousel} />

      {/* Sections contained to max 1280px */}
      <div className="max-w-[1280px] mx-auto">
        {/* Weather widget — pinned, contextual (hidden when no data) */}
        <WeatherWidget />

        {/* Personalizable content sections — data-driven order */}
        {order.map(key => {
          const Section = CONTENT_SECTIONS[key]
          return Section ? <Section key={key} /> : null
        })}
      </div>
    </div>
  )
}
