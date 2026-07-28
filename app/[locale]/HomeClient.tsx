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
import EditorialPicks from './_components/home/EditorialPicks'
import NewOnB4K from './_components/home/NewOnB4K'
import YouMightLike from './_components/home/YouMightLike'
import PlanTrip from './_components/home/PlanTrip'
import ContinuePlan from './_components/home/ContinuePlan'
import ChallengeCard from './_components/home/ChallengeCard'
import LeaderboardBadge from './_components/home/LeaderboardBadge'
import PopularPlans from './_components/home/PopularPlans'
import PartnerPackages from './_components/home/PartnerPackages'
import UpcomingEvents from './_components/home/UpcomingEvents'
import Promotions from './_components/home/Promotions'
import type { HomeSectionOrder } from '@/app/api/home/section-order/route'

// Personalizable content sections, keyed by the API's section keys.
// Fixed sections (hero carousel, weather widget) are pinned outside this map.
const CONTENT_SECTIONS: Record<string, ComponentType> = {
  trending: TrendingSpots,
  exploreHub: ExploreHub,
  editorial: EditorialPicks,
  new: NewOnB4K,
  youMightLike: YouMightLike,
  planTrip: PlanTrip,
  continuePlan: ContinuePlan,
  challenge: ChallengeCard,
  leaderboardBadge: LeaderboardBadge,
  popularPlans: PopularPlans,
  partnerPackages: PartnerPackages,
  upcomingEvents: UpcomingEvents,
  promotions: Promotions,
}

// Default order — the source of truth for fallback. Must list every key in
// CONTENT_SECTIONS. Used verbatim on loading / empty / error.
const DEFAULT_ORDER = [
  'trending',
  'exploreHub',
  'editorial',
  'new',
  'youMightLike',
  'planTrip',
  'continuePlan',
  'challenge',
  'leaderboardBadge',
  'popularPlans',
  'partnerPackages',
  'upcomingEvents',
  'promotions',
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
