'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Bookmark, MapPin, Heart, Map, RefreshCw, AlertTriangle } from 'lucide-react'
import { useSaved } from '@/hooks/useSaved'
import { getDisplayName } from '@/lib/display-name'

type Tab = 'places' | 'itineraries'

function RowSkeleton() {
  return (
    <div className="flex items-center gap-sp-3 p-sp-4 animate-pulse" style={{ borderBottom: 'var(--bdr)' }}>
      <div className="w-14 h-14 rounded-lg bg-muted-3 shrink-0" />
      <div className="flex-1 space-y-sp-2">
        <div className="h-4 w-2/3 rounded bg-muted-3" />
        <div className="h-3 w-1/3 rounded bg-muted-3" />
      </div>
    </div>
  )
}

export default function SavedPage() {
  const t = useTranslations('saved')
  const [tab, setTab] = useState<Tab>('places')
  const { data, isLoading, isError, mutate } = useSaved()

  const tabClass = (active: boolean) => [
    'px-sp-4 py-sp-3 text-[13px] font-semibold tracking-[0.02em] transition-colors min-h-[44px] flex items-center -mb-px',
    active ? 'text-lav border-b-2 border-lav' : 'text-muted hover:text-fg',
  ].join(' ')

  return (
    <main
      className="max-w-[1200px] mx-auto px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-20"
      aria-label={t('ariaLabel')}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg transition-colors">B4K</Link>
        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>

      <h1 className="font-display font-black text-fg text-[clamp(22px,2.5vw,32px)] mb-sp-5">
        {t('title')}
      </h1>

      <nav
        className="flex gap-sp-1 mb-sp-4"
        style={{ borderBottom: 'var(--bdr)' }}
        aria-label={t('tabs.ariaLabel')}
      >
        <button
          onClick={() => setTab('places')}
          className={tabClass(tab === 'places')}
          aria-current={tab === 'places' ? 'page' : undefined}
        >
          {t('tabs.places')}
        </button>
        <button
          onClick={() => setTab('itineraries')}
          className={tabClass(tab === 'itineraries')}
          aria-current={tab === 'itineraries' ? 'page' : undefined}
        >
          {t('tabs.itineraries')}
        </button>
      </nav>

      {isLoading && (
        <div
          aria-busy="true"
          aria-label={t('loading')}
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--bdr)' }}
        >
          {Array.from({ length: 3 }, (_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {isError && !isLoading && (
        <div
          className="flex flex-col items-center justify-center text-center py-16 rounded-lg"
          style={{ background: 'var(--bg-2)', border: '1px solid rgba(248,113,113,0.2)' }}
          role="alert"
        >
          <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
          <p className="text-[15px] font-semibold text-fg mb-sp-2">{t('error.title')}</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-sp-2 text-[13px] font-semibold text-lav hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
          >
            <RefreshCw size={14} strokeWidth={2} />{t('error.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && data && tab === 'places' && (
        data.pois.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-lg"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <Bookmark size={40} strokeWidth={2} className="text-muted-2 mb-sp-4" />
            <p className="text-[16px] font-semibold text-fg mb-sp-2">{t('empty.places.title')}</p>
            <p className="text-[13px] text-muted max-w-[320px] mb-sp-5">{t('empty.places.desc')}</p>
            <Link
              href="/map"
              className="flex items-center gap-sp-2 px-sp-5 py-sp-3 rounded-lg text-[13px] font-semibold text-bg min-h-touch"
              style={{ background: 'var(--lav)' }}
            >
              <Map size={15} strokeWidth={2} />{t('empty.places.cta')}
            </Link>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--bdr)' }}>
            {data.pois.map((poi, idx) => {
              const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
              return (
                <Link
                  key={poi.place_id}
                  href={`/map?poi=${poi.place_id}`}
                  className="flex items-center gap-sp-3 p-sp-4 hover:bg-muted-3 transition-colors min-h-touch"
                  style={idx < data.pois.length - 1 ? { borderBottom: 'var(--bdr)' } : {}}
                  aria-label={t('place.ariaLabel', { name })}
                >
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--bg-3)' }}
                  >
                    <MapPin size={20} strokeWidth={2} className="text-muted-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-fg truncate">{name}</p>
                    <p className="text-[12px] text-muted mt-[2px]">{poi.display_region}</p>
                  </div>
                  <Bookmark size={16} strokeWidth={2} className="text-lav shrink-0" />
                </Link>
              )
            })}
          </div>
        )
      )}

      {!isLoading && !isError && data && tab === 'itineraries' && (
        data.plans.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-lg"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <Bookmark size={40} strokeWidth={2} className="text-muted-2 mb-sp-4" />
            <p className="text-[16px] font-semibold text-fg mb-sp-2">{t('empty.itineraries.title')}</p>
            <p className="text-[13px] text-muted max-w-[320px] mb-sp-5">{t('empty.itineraries.desc')}</p>
            <Link
              href="/map"
              className="flex items-center gap-sp-2 px-sp-5 py-sp-3 rounded-lg text-[13px] font-semibold text-bg min-h-touch"
              style={{ background: 'var(--lav)' }}
            >
              <Map size={15} strokeWidth={2} />{t('empty.itineraries.cta')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-sp-3">
            {data.plans.map(plan => (
              <Link
                key={plan.id}
                href={`/itinerary/${plan.id}`}
                className="flex items-start gap-sp-4 p-sp-4 rounded-lg transition-colors hover:bg-muted-3"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
                aria-label={t('plan.ariaLabel', { title: plan.title })}
              >
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--bg-3)' }}
                >
                  <MapPin size={22} strokeWidth={2} className="text-muted-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-fg leading-snug mb-[4px] line-clamp-2">
                    {plan.title}
                  </p>
                  <p className="text-[12px] text-muted mb-sp-2">{plan.author_name}</p>
                  <div className="flex items-center gap-sp-3 text-[11px] text-muted">
                    <span>{t('plan.stops', { count: plan.stop_count })}</span>
                    <span>·</span>
                    <span>{t('plan.days', { count: plan.duration_days })}</span>
                    <span>·</span>
                    <span className="flex items-center gap-[3px]">
                      <Heart size={11} strokeWidth={2} /> {plan.likes_count}
                    </span>
                  </div>
                </div>
                <Bookmark size={16} strokeWidth={2} className="text-lav shrink-0 mt-[2px]" />
              </Link>
            ))}
          </div>
        )
      )}
    </main>
  )
}
