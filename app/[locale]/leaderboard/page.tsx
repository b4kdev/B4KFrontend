'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Trophy, RefreshCw, AlertTriangle, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import type { LeaderboardWindow, LeaderboardTrend } from '@/app/api/leaderboard/route'

const WINDOWS: LeaderboardWindow[] = ['weekly', 'rising', 'annual']

function TrendIndicator({ trend, label }: { trend: LeaderboardTrend; label: string }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const color = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-muted-2'
  return (
    <span className={`shrink-0 ${color}`} role="img" aria-label={label}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
    </span>
  )
}

const RANK_STYLE: Record<number, { ring: string; icon: string; bg: string }> = {
  1: { ring: 'ring-2 ring-warning/60', icon: 'text-warning', bg: 'bg-bg-3' },
  2: { ring: 'ring-2 ring-muted/40',   icon: 'text-muted',   bg: 'bg-bg-3' },
  3: { ring: 'ring-2 ring-warning/30', icon: 'text-muted',   bg: 'bg-bg-3' },
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-sp-3 p-sp-4 animate-pulse" style={{ borderBottom: 'var(--bdr)' }}>
      <div className="w-6 h-4 rounded bg-muted-3 shrink-0" />
      <div className="w-9 h-9 rounded-full bg-muted-3 shrink-0" />
      <div className="flex-1 space-y-sp-2">
        <div className="h-4 w-1/3 rounded bg-muted-3" />
        <div className="h-3 w-1/4 rounded bg-muted-3" />
      </div>
      <div className="h-5 w-16 rounded bg-muted-3" />
    </div>
  )
}

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard')
  const locale = useLocale()
  const [window, setWindow] = useState<LeaderboardWindow>('weekly')
  const { data, isLoading, isError, mutate } = useLeaderboard(window)

  const pillClass = (active: boolean) => [
    'px-sp-4 py-[7px] rounded-full text-f-sm font-semibold whitespace-nowrap transition-colors min-h-touch flex items-center shrink-0',
    active ? 'bg-lav text-bg' : 'text-muted hover:text-fg',
  ].join(' ')

  return (
    <div
      className="max-w-[720px] mx-auto px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-20"
      aria-label={t('ariaLabel')}
    >
      <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg transition-colors">B4K</Link>
        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>

      <h1 className="font-display text-fg text-f-display-tile mb-sp-5">
        {t('title')}
      </h1>

      {/* Window tabs */}
      <div
        className="flex gap-sp-2 overflow-x-auto pb-sp-1 mb-sp-5"
        role="tablist"
        aria-label={t('windows.ariaLabel')}
        style={{ scrollbarWidth: 'none' }}
      >
        {WINDOWS.map(w => (
          <button
            key={w}
            role="tab"
            aria-selected={window === w}
            onClick={() => setWindow(w)}
            className={pillClass(window === w)}
            style={window !== w ? { background: 'var(--bg-3)', border: '1px solid var(--bdr)' } : {}}
          >
            {t(`windows.${w}`)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div
          aria-busy="true"
          aria-label={t('loading')}
          className="rounded-none overflow-hidden"
          style={{ border: '1px solid var(--bdr)' }}
        >
          {Array.from({ length: 8 }, (_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {isError && !isLoading && (
        <div
          className="flex flex-col items-center justify-center text-center py-16 rounded-none"
          style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
          role="alert"
        >
          <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
          <p className="text-f-lg font-semibold text-fg mb-sp-2">{t('error.title')}</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-sp-2 text-f-md font-semibold text-lav hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
          >
            <RefreshCw size={14} strokeWidth={2} />{t('error.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && data && (
        data.entries.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-none"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <Trophy size={40} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-4" />
            <p className="text-f-xl font-semibold text-fg mb-sp-2">{t('empty.title')}</p>
            <p className="text-f-md text-muted max-w-[300px]">{t('empty.desc')}</p>
          </div>
        ) : (
          <div className="rounded-none overflow-hidden" style={{ border: '1px solid var(--bdr)' }}>
            {data.entries.map((entry, idx) => {
              const isTop = entry.rank <= 3
              const style = RANK_STYLE[entry.rank]
              const isLast = idx === data.entries.length - 1
              const initial = entry.user.name.charAt(0).toUpperCase()
              return (
                <Link
                  key={entry.user.id}
                  href={`/profile/${entry.user.id}`}
                  className="flex items-center gap-sp-3 p-sp-4 min-h-touch hover:bg-muted-3 transition-colors"
                  style={!isLast ? { borderBottom: 'var(--bdr)' } : {}}
                  aria-label={`${t('rank', { rank: entry.rank })} ${entry.user.name}`}
                >
                  {/* Rank */}
                  <div className="w-7 text-center shrink-0">
                    {isTop ? (
                      <Trophy size={16} strokeWidth={2} className={style?.icon ?? 'text-muted'} />
                    ) : (
                      <span className="text-f-md font-bold text-muted">{entry.rank}</span>
                    )}
                  </div>
                  {/* Avatar — SC-16: 28px base, 36px for rank 1 only */}
                  <div
                    className={[
                      'relative',
                      entry.rank === 1 ? 'w-9 h-9' : 'w-7 h-7',
                      'rounded-full flex items-center justify-center shrink-0 text-f-md font-bold',
                      isTop ? `${style?.ring ?? ''} ${style?.bg ?? 'bg-bg-3'}` : 'bg-bg-3',
                    ].join(' ')}
                    style={!isTop ? { border: 'var(--bdr)' } : {}}
                    aria-hidden
                  >
                    {entry.user.avatar_url ? (
                      <Image src={entry.user.avatar_url} alt={entry.user.name} fill sizes="36px" className="rounded-full object-cover" />
                    ) : (
                      <span className={isTop ? (style?.icon ?? 'text-muted') : 'text-muted'}>{initial}</span>
                    )}
                  </div>
                  {/* Name + stats */}
                  <div className="flex-1 min-w-0">
                    <p className="text-f-md font-semibold text-fg truncate">{entry.user.name}</p>
                    <div className="flex items-center gap-sp-2 text-f-xs text-muted mt-[2px]">
                      <span>{t('plans', { count: entry.plans_count })}</span>
                      <span>·</span>
                      <Award size={10} strokeWidth={2} />
                      <span>{entry.badge_count}</span>
                    </div>
                  </div>
                  {/* Trend vs previous period */}
                  <TrendIndicator trend={entry.trend} label={t(`trend.${entry.trend}`)} />
                  {/* Score */}
                  <div className="text-right shrink-0">
                    <span
                      className={['text-f-md font-bold', isTop ? (style?.icon ?? 'text-fg') : 'text-fg'].join(' ')}
                    >
                      {entry.score.toLocaleString(locale)}
                    </span>
                    <p className="text-f-xxs text-muted">{t('scoreUnit')}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )
      )}

      {/* Own-user rank — sticky at bottom when not in visible top N */}
      {!isLoading && !isError && data?.your_rank && (
        <div
          className="sticky bottom-0 z-10 mt-sp-3 flex items-center gap-sp-3 p-sp-4 min-h-touch"
          style={{ background: 'var(--bg-3)', border: '1px solid var(--lav-border)' }}
          aria-label={t('yourRank.ariaLabel', { rank: data.your_rank.rank })}
        >
          <span className="text-f-md font-bold text-lav shrink-0">
            {t('yourRank.label', { rank: data.your_rank.rank })}
          </span>
          <TrendIndicator trend={data.your_rank.trend} label={t(`trend.${data.your_rank.trend}`)} />
          <div className="flex-1" />
          <div className="text-right shrink-0">
            <span className="text-f-md font-bold text-fg">{data.your_rank.score.toLocaleString(locale)}</span>
            <p className="text-f-xxs text-muted">{t('scoreUnit')}</p>
          </div>
        </div>
      )}

      {data && (
        <p className="text-f-xs text-muted text-center mt-sp-4">
          {t('computedAt', { date: new Date(data.computed_at).toLocaleDateString(locale) })}
        </p>
      )}
    </div>
  )
}
