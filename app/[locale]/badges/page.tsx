'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { Award, Lock, RefreshCw, AlertTriangle, X, Trophy, Pin, PinOff } from 'lucide-react'
import { useBadges } from '@/hooks/useBadges'
import { useToast } from '@/contexts/ToastContext'
import type { Badge, BadgeRarity, BadgesData } from '@/app/api/badges/route'

type Filter = 'all' | BadgeRarity

const RARITY_RING: Record<BadgeRarity, string> = {
  common:    'ring-1 ring-white/10',
  rare:      'ring-1 ring-info/40',
  epic:      'ring-1 ring-muted-2',
  legendary: 'ring-1 ring-warning/50',
}
const RARITY_COLOR: Record<BadgeRarity, string> = {
  common:    'text-muted',
  rare:      'text-info',
  epic:      'text-fg',
  legendary: 'text-warning',
}
// Chip background per rarity — token-derived via color-mix, no hex.
const RARITY_CHIP_BG: Record<BadgeRarity, string> = {
  common:    'color-mix(in srgb, var(--muted) 18%, transparent)',
  rare:      'color-mix(in srgb, var(--info) 18%, transparent)',
  epic:      'color-mix(in srgb, var(--fg) 18%, transparent)',
  legendary: 'color-mix(in srgb, var(--warning) 18%, transparent)',
}

const MAX_PINS = 3

function BadgeSkeleton() {
  return (
    <div className="flex flex-col items-center gap-sp-2 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-muted-3" />
      <div className="h-3 w-14 rounded bg-muted-3" />
    </div>
  )
}

function BadgeDetailSheet({
  badge,
  onClose,
  onTogglePin,
  pinnedCount,
  t,
  locale,
}: {
  badge: Badge
  onClose: () => void
  onTogglePin: (badge: Badge) => void
  pinnedCount: number
  t: ReturnType<typeof useTranslations>
  locale: string
}) {
  const color = RARITY_COLOR[badge.rarity] ?? 'text-muted'
  const ring  = RARITY_RING[badge.rarity] ?? ''
  const atPinLimit = !badge.is_pinned && pinnedCount >= MAX_PINS

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-sp-4"
      style={{ background: 'var(--backdrop-50)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('badges.detail.ariaLabel')}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[360px] p-sp-6 flex flex-col gap-sp-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      >
        {/* Drag handle — mobile */}
        <div className="sm:hidden flex justify-center -mt-sp-2" aria-hidden="true">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--muted-2)' }} />
        </div>

        {/* Close */}
        <div className="flex justify-end -mb-sp-2">
          <button
            onClick={onClose}
            className="min-h-touch min-w-touch flex items-center justify-center text-muted hover:text-fg transition-colors"
            aria-label={t('badges.detail.close')}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Badge icon */}
        <div className="flex flex-col items-center gap-sp-3 text-center">
          <div
            className={[
              'w-16 h-16 rounded-full flex items-center justify-center',
              ring,
              badge.earned ? 'bg-bg-3' : 'bg-bg-2 opacity-50',
            ].join(' ')}
          >
            {badge.earned ? (
              <Trophy size={28} strokeWidth={2} className={color} aria-hidden="true" />
            ) : (
              <Lock size={22} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
            )}
          </div>

          <div>
            <h2 className="text-f-2xl font-bold text-fg">{badge.name}</h2>
            <p className={`text-f-xs font-semibold uppercase tracking-widest mt-sp-1 ${color}`}>
              {t(`badges.rarity.${badge.rarity}`)}
            </p>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-sp-3 text-f-sm">
          <div>
            <p className="text-muted uppercase tracking-widest text-f-xxs font-semibold mb-sp-1">
              {t('badges.detail.category')}
            </p>
            <p className="text-fg font-semibold capitalize">{badge.category}</p>
          </div>
          <div>
            <p className="text-muted uppercase tracking-widest text-f-xxs font-semibold mb-sp-1">
              {t('badges.detail.status')}
            </p>
            <p className={`font-semibold ${badge.earned ? 'text-success' : 'text-muted'}`}>
              {badge.earned ? t('badges.detail.earned') : t('badges.badge.locked')}
            </p>
          </div>
        </div>

        {/* M17 — Unlock criteria */}
        {badge.unlock_criteria?.description && (
          <div>
            <p className="text-muted uppercase tracking-widest text-f-xxs font-semibold mb-sp-1">
              {t('badges.detail.unlockCriteria')}
            </p>
            <p className="text-f-sm text-fg leading-relaxed">
              {badge.unlock_criteria.description}
            </p>
          </div>
        )}

        {badge.earned && badge.earned_at && (
          <p className="text-f-xs text-muted text-center">
            {t('badges.detail.earnedOn', { date: new Date(badge.earned_at).toLocaleDateString(locale) })}
          </p>
        )}

        {/* M16 — Pin toggle (earned badges, own profile only) */}
        {badge.earned && (
          <button
            onClick={() => onTogglePin(badge)}
            disabled={atPinLimit}
            aria-pressed={badge.is_pinned}
            className={[
              'min-h-touch flex items-center justify-center gap-sp-2 rounded-full text-f-sm font-semibold transition-colors px-sp-4',
              badge.is_pinned
                ? 'bg-fg text-bg'
                : atPinLimit
                  ? 'text-muted-2 cursor-not-allowed'
                  : 'text-fg hover:text-fg',
            ].join(' ')}
            style={!badge.is_pinned ? { background: 'var(--bg-3)', border: '1px solid var(--bdr)' } : {}}
          >
            {badge.is_pinned ? (
              <PinOff size={16} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Pin size={16} strokeWidth={2} aria-hidden="true" />
            )}
            {badge.is_pinned ? t('badges.detail.unpin') : t('badges.detail.pin')}
          </button>
        )}
        {atPinLimit && (
          <p className="text-f-xxs text-muted text-center">{t('badges.detail.pinLimit')}</p>
        )}
      </div>
    </div>
  )
}

export default function BadgesPage() {
  const t = useTranslations()
  const locale = useLocale()
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Badge | null>(null)
  const { data, isLoading, isError, mutate } = useBadges()
  const { showToast } = useToast()
  const searchParams = useSearchParams()

  // Unlock toast — fires once per ?badge=<slug> (not on every data mutation, e.g. pin toggle)
  const unlockToastFiredRef = useRef<string | null>(null)
  useEffect(() => {
    const newBadgeSlug = searchParams.get('badge')
    if (!newBadgeSlug || !data?.badges) return
    if (unlockToastFiredRef.current === newBadgeSlug) return
    const earned = data.badges.find((b) => b.slug === newBadgeSlug && b.earned)
    if (earned) {
      unlockToastFiredRef.current = newBadgeSlug
      // UF-13 (G11.2) — explicit "view badge" action + dismiss, not just an auto-timeout
      showToast(
        t('badges.detail.unlockToast', { name: earned.name }),
        'success',
        { label: t('badges.detail.unlockToastView'), onClick: () => setSelected(earned) },
      )
    }
  }, [searchParams, data, showToast, t])

  const filters: Filter[] = ['all', 'common', 'rare', 'epic', 'legendary']
  const filtered = data?.badges.filter(b => filter === 'all' || b.rarity === filter) ?? []

  const pillClass = (active: boolean) => [
    'px-sp-3 py-[6px] rounded-full text-f-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] flex items-center',
    active ? 'bg-fg text-bg' : 'text-muted hover:text-fg',
  ].join(' ')

  const handleBadgeClick = useCallback((badge: Badge) => {
    setSelected(badge)
  }, [])

  const pinnedCount = data?.badges.filter(b => b.is_pinned).length ?? 0

  const handleTogglePin = useCallback(async (badge: Badge) => {
    if (!data) return
    const nextPinned = !badge.is_pinned
    // Block a 4th pin — do not call the API.
    if (nextPinned && pinnedCount >= MAX_PINS) {
      showToast(t('badges.detail.pinLimit'), 'info')
      return
    }
    const applyPin = (bs: Badge[]) =>
      bs.map(b => (b.id === badge.id ? { ...b, is_pinned: nextPinned } : b))
    const optimistic: BadgesData = { ...data, badges: applyPin(data.badges) }
    // Optimistic update + keep the open sheet in sync.
    mutate(optimistic, { revalidate: false })
    setSelected(prev => (prev && prev.id === badge.id ? { ...prev, is_pinned: nextPinned } : prev))
    try {
      const res = await fetch(`/api/badges/${badge.id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: nextPinned }),
      })
      if (!res.ok) throw new Error('pin failed')
    } catch {
      // Revert on failure.
      mutate()
      setSelected(prev => (prev && prev.id === badge.id ? { ...prev, is_pinned: badge.is_pinned } : prev))
      showToast(t('badges.detail.pinError'), 'error')
    }
  }, [data, pinnedCount, mutate, showToast, t])

  return (
    <div
      className="max-w-[1200px] mx-auto px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-20"
      aria-label={t('badges.ariaLabel')}
    >
      <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg transition-colors">B4K</Link>
        <span>›</span>
        <span className="text-fg">{t('badges.breadcrumb')}</span>
      </div>

      <div className="flex items-center justify-between mb-sp-5">
        <h1 className="font-display text-fg text-f-display-tile">
          {t('badges.title')}
        </h1>
        {data && (
          <span className="text-f-sm font-semibold text-muted">
            {t('badges.stats', { earned: data.earned_count, total: data.total_count })}
          </span>
        )}
      </div>

      {/* Filter pills */}
      <div
        className="flex gap-sp-2 overflow-x-auto pb-sp-1 mb-sp-6"
        role="group"
        aria-label={t('badges.filter.ariaLabel')}
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
            {t(`badges.filter.${f}`)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div
          aria-busy="true"
          aria-label={t('badges.loading')}
          className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-sp-4"
        >
          {Array.from({ length: 12 }, (_, i) => <BadgeSkeleton key={i} />)}
        </div>
      )}

      {isError && !isLoading && (
        <div
          className="flex flex-col items-center justify-center text-center py-16"
          style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
          role="alert"
        >
          <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
          <p className="text-f-lg font-semibold text-fg mb-sp-2">{t('badges.error.title')}</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-sp-2 text-f-md font-semibold text-fg hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
          >
            <RefreshCw size={14} strokeWidth={2} />{t('badges.error.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && data && (
        filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-6"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <Award size={40} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-4" />
            <p className="text-f-xl font-semibold text-fg mb-sp-2">{t('badges.empty.title')}</p>
            <p className="text-f-md text-muted max-w-[300px]">{t('badges.empty.desc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-x-sp-4 gap-y-sp-6">
            {filtered.map(badge => {
              const ring  = RARITY_RING[badge.rarity]
              const color = RARITY_COLOR[badge.rarity]
              return (
                <button
                  key={badge.id}
                  onClick={() => handleBadgeClick(badge)}
                  className="flex flex-col items-center gap-sp-2 group"
                  aria-label={t('badges.badge.ariaLabel', { name: badge.name, rarity: badge.rarity })}
                >
                  <div
                    className={[
                      'w-14 h-14 rounded-full flex items-center justify-center relative transition-transform group-hover:scale-105',
                      ring,
                      badge.earned ? 'bg-bg-3' : 'bg-bg-2 opacity-40',
                    ].join(' ')}
                  >
                    {badge.earned ? (
                      <Award size={24} strokeWidth={2} className={color} />
                    ) : (
                      <Lock size={18} strokeWidth={2} className="text-fg opacity-[0.15]" />
                    )}
                    {badge.is_pinned && (
                      <span
                        className="absolute -top-[4px] -right-[4px] w-4 h-4 rounded-full flex items-center justify-center text-f-xxs font-bold text-bg"
                        style={{ background: 'var(--fg)' }}
                        aria-label={t('badges.badge.pinned')}
                      >
                        ★
                      </span>
                    )}
                  </div>
                  <p className="text-f-xxs font-semibold text-center leading-tight text-muted line-clamp-2 px-[2px]">
                    {badge.name}
                  </p>
                  {/* L6 — Rarity chip on earned cells */}
                  {badge.earned && (
                    <span
                      className={`rounded-full px-sp-2 py-[1px] text-f-xxs font-semibold uppercase tracking-wide leading-none ${color}`}
                      style={{ background: RARITY_CHIP_BG[badge.rarity] }}
                    >
                      {t(`badges.rarity.${badge.rarity}`)}
                    </span>
                  )}
                  {badge.earned && badge.earned_at && (
                    <p className="text-f-xxs text-muted-2 text-center">
                      {t('badges.badge.earnedOn', { date: new Date(badge.earned_at).toLocaleDateString(locale) })}
                    </p>
                  )}
                  {!badge.earned && (
                    <p className="text-f-xxs text-muted-2 text-center">{t('badges.badge.locked')}</p>
                  )}
                </button>
              )
            })}
          </div>
        )
      )}

      {/* Badge detail sheet */}
      {selected && (
        <BadgeDetailSheet
          badge={selected}
          onClose={() => setSelected(null)}
          onTogglePin={handleTogglePin}
          pinnedCount={pinnedCount}
          t={t}
          locale={locale}
        />
      )}
    </div>
  )
}
