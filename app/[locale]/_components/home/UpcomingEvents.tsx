'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import useSWR from 'swr'
import { Calendar, MapPin } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import SectionHead from './SectionHead'
import HScrollRow from './HScrollRow'
import type { HomeEvent } from '@/app/api/home/events/route'

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

function CardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden animate-pulse"
      style={{ width: 'clamp(220px, 60vw, 260px)', background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      aria-hidden="true"
    >
      <div className="bg-muted-3" style={{ aspectRatio: '4/3' }} />
      <div className="p-sp-3 space-y-sp-2">
        <div className="h-[13px] w-3/4 bg-muted-3" />
        <div className="h-[11px] w-1/2 bg-muted-3" />
      </div>
    </div>
  )
}

export default function UpcomingEvents() {
  const t = useTranslations('home.events')
  const { data, isLoading } = useSWR<HomeEvent[]>('/api/home/events', fetcher)

  if (!isLoading && (!data || data.length === 0)) return null

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('title')}>
      <SectionHead title={t('title')} />
      {isLoading && (
        <HScrollRow>
          {[0,1,2].map(i => <CardSkeleton key={i} />)}
        </HScrollRow>
      )}
      {!isLoading && data && (
        <HScrollRow>
          {data.map(evt => (
            <div
              key={evt.id}
              className="flex flex-col overflow-hidden"
              style={{ width: 'clamp(220px, 60vw, 260px)', background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
            >
              <div className="relative bg-bg-3 flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
                <Calendar size={28} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                {evt.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={evt.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
                )}
                <span
                  className="absolute top-sp-2 left-sp-2 text-f-xxs font-bold tracking-[0.08em] uppercase text-fg"
                  style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)', padding: '3px 8px' }}
                >
                  {formatDate(evt.date_start, 'en')}
                </span>
              </div>
              <div className="p-sp-3 flex flex-col gap-[3px]">
                <p className="text-f-md font-semibold text-fg line-clamp-1">{evt.title}</p>
                <p className="flex items-center gap-[3px] text-f-xs text-muted">
                  <MapPin size={10} strokeWidth={2} aria-hidden="true" />
                  <span className="line-clamp-1">{evt.location}</span>
                </p>
              </div>
            </div>
          ))}
        </HScrollRow>
      )}
    </section>
  )
}
