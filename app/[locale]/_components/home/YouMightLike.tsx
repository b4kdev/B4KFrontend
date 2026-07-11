'use client'

import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import SectionHead from './SectionHead'
import HScrollRow from './HScrollRow'
import HomePoiCard, { HomePoiCardSkeleton } from './HomePoiCard'
import type { HomeTrendingPoi } from '@/app/api/home/trending/route'

export default function YouMightLike() {
  const t = useTranslations('home.youMightLike')
  const { data: session } = useSession()
  const { data, isLoading } = useSWR<HomeTrendingPoi[]>(
    session ? '/api/home/recommended' : null,
    fetcher,
  )

  // Hidden for guest or zero results
  if (!session) return null
  if (!isLoading && (!data || data.length === 0)) return null

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('title')}>
      <SectionHead title={t('title')} viewAllLabel={t('viewAll')} viewAllHref="/explore" />
      {isLoading && (
        <HScrollRow>
          {[0,1,2,3].map(i => <HomePoiCardSkeleton key={i} />)}
        </HScrollRow>
      )}
      {!isLoading && data && (
        <HScrollRow>
          {data.map(poi => <HomePoiCard key={poi.place_id} poi={poi} />)}
        </HScrollRow>
      )}
    </section>
  )
}
