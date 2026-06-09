'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Award, Lock, RefreshCw, AlertTriangle } from 'lucide-react'
import { useBadges } from '@/hooks/useBadges'
import type { BadgeRarity } from '@/app/api/badges/route'

type Filter = 'all' | BadgeRarity

const RARITY_RING: Record<BadgeRarity, string> = {
  common:    'ring-1 ring-white/10',
  rare:      'ring-1 ring-info/40',
  epic:      'ring-1 ring-lav-border',
  legendary: 'ring-1 ring-warning/50',
}
const RARITY_COLOR: Record<BadgeRarity, string> = {
  common:    'text-muted',
  rare:      'text-info',
  epic:      'text-lav',
  legendary: 'text-warning',
}

function BadgeSkeleton() {
  return (
    <div className="flex flex-col items-center gap-sp-2 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-muted-3" />
      <div className="h-3 w-14 rounded bg-muted-3" />
    </div>
  )
}

export default function BadgesPage() {
  const t = useTranslations('badges')
  const [filter, setFilter] = useState<Filter>('all')
  const { data, isLoading, isError, mutate } = useBadges()

  const filters: Filter[] = ['all', 'common', 'rare', 'epic', 'legendary']

  const filtered = data?.badges.filter(b => filter === 'all' || b.rarity === filter) ?? []

  const pillClass = (active: boolean) => [
    'px-sp-3 py-[6px] rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors min-h-[36px] flex items-center',
    active ? 'bg-lav text-bg' : 'text-muted hover:text-fg',
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

      <div className="flex items-center justify-between mb-sp-5">
        <h1 className="font-display font-black text-fg text-[clamp(22px,2.5vw,32px)]">
          {t('title')}
        </h1>
        {data && (
          <span className="text-[12px] font-semibold text-muted">
            {t('stats', { earned: data.earned_count, total: data.total_count })}
          </span>
        )}
      </div>

      {/* Filter pills */}
      <div
        className="flex gap-sp-2 overflow-x-auto pb-sp-1 mb-sp-6"
        role="group"
        aria-label={t('filter.ariaLabel')}
        style={{ scrollbarWidth: 'none' }}
      >
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={pillClass(filter === f)}
            style={filter !== f ? { background: 'var(--bg-3)', border: '1px solid var(--bdr)' } : {}}
            aria-pressed={filter === f}
          >
            {t(`filter.${f}`)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div
          aria-busy="true"
          aria-label={t('loading')}
          className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-sp-4"
        >
          {Array.from({ length: 12 }, (_, i) => <BadgeSkeleton key={i} />)}
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

      {!isLoading && !isError && data && (
        filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-lg"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <Award size={40} strokeWidth={2} className="text-muted-2 mb-sp-4" />
            <p className="text-[16px] font-semibold text-fg mb-sp-2">{t('empty.title')}</p>
            <p className="text-[13px] text-muted max-w-[300px]">{t('empty.desc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-x-sp-4 gap-y-sp-6">
            {filtered.map(badge => {
              const ring  = RARITY_RING[badge.rarity]
              const color = RARITY_COLOR[badge.rarity]
              return (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-sp-2"
                  aria-label={t('badge.ariaLabel', { name: badge.name, rarity: badge.rarity })}
                >
                  <div
                    className={[
                      'w-14 h-14 rounded-full flex items-center justify-center relative',
                      ring,
                      badge.earned ? 'bg-bg-3' : 'bg-bg-2 opacity-40',
                    ].join(' ')}
                  >
                    {badge.earned ? (
                      <Award size={24} strokeWidth={2} className={color} />
                    ) : (
                      <Lock size={18} strokeWidth={2} className="text-muted-2" />
                    )}
                    {badge.is_pinned && (
                      <span
                        className="absolute -top-[4px] -right-[4px] w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-bg"
                        style={{ background: 'var(--lav)' }}
                        aria-label={t('badge.pinned')}
                      >
                        ★
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-semibold text-center leading-tight text-muted line-clamp-2 px-[2px]">
                    {badge.name}
                  </p>
                  {badge.earned && badge.earned_at && (
                    <p className="text-[9px] text-muted-2 text-center">
                      {t('badge.earnedOn', { date: new Date(badge.earned_at).toLocaleDateString() })}
                    </p>
                  )}
                  {!badge.earned && (
                    <p className="text-[9px] text-muted-2 text-center">{t('badge.locked')}</p>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </main>
  )
}
