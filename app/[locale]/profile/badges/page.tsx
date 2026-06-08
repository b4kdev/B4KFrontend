'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  Star, Map, RefreshCw, AlertTriangle, X,
  Trophy, Music, Film, Sparkles, BookOpen, Zap, Award,
} from 'lucide-react'
import { useProfileBadges } from '@/hooks/useProfileBadges'
import type { ProfileBadge } from '@/app/api/profile/badges/route'

const RARITY_STYLES: Record<string, { bg: string; icon: string; ring: string; label: string }> = {
  common:    { bg: 'bg-muted-3',     icon: 'text-muted',   ring: 'ring-1 ring-white/10',      label: 'text-muted' },
  rare:      { bg: 'bg-info/10',     icon: 'text-info',    ring: 'ring-1 ring-info/30',       label: 'text-info' },
  epic:      { bg: 'bg-lav-dim',     icon: 'text-lav',     ring: 'ring-1 ring-lav-border',    label: 'text-lav' },
  legendary: { bg: 'bg-warning/10',  icon: 'text-warning', ring: 'ring-1 ring-warning/40',    label: 'text-warning' },
}

function categoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'milestone': return Trophy
    case 'exploration': return Map
    case 'special': return Zap
    case 'creator': return Award
    default: return Star
  }
}

function BadgeSkeleton() {
  return (
    <div className="flex flex-col items-center gap-sp-2 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-muted-3" />
      <div className="h-3 w-14 rounded bg-muted-3" />
    </div>
  )
}

function BadgeDetailModal({
  badge,
  onClose,
  onPin,
  pinLimitHit,
  t,
}: {
  badge: ProfileBadge
  onClose: () => void
  onPin: (id: string, pinned: boolean) => void
  pinLimitHit: boolean
  t: ReturnType<typeof useTranslations>
}) {
  const style = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common
  const Icon = categoryIcon(badge.category)
  const earned = new Date(badge.earned_at).toLocaleDateString()

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-sp-4"
      style={{ background: 'var(--backdrop-50)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('badges.modal.close')}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[360px] rounded-2xl p-sp-6 flex flex-col gap-sp-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr-color, rgba(255,255,255,0.08))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${style.bg} ${style.ring}`}>
            <Icon size={24} strokeWidth={2} className={style.icon} />
          </div>
          <button
            onClick={onClose}
            className="min-h-touch min-w-touch flex items-center justify-center text-muted hover:text-fg transition-colors"
            aria-label={t('badges.modal.close')}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Info */}
        <div>
          <h2 className="text-[17px] font-bold text-fg">{badge.name}</h2>
          <p className="text-[13px] text-muted mt-1">{badge.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-sp-3 text-[12px]">
          <div>
            <p className="text-muted uppercase tracking-widest text-[10px] font-semibold mb-0.5">{t('badges.modal.category')}</p>
            <p className="text-fg font-semibold">{badge.category}</p>
          </div>
          <div>
            <p className="text-muted uppercase tracking-widest text-[10px] font-semibold mb-0.5">{t('badges.modal.rarity')}</p>
            <p className={`font-semibold ${style.label}`}>{t(`badges.rarity.${badge.rarity}`)}</p>
          </div>
          <div>
            <p className="text-muted uppercase tracking-widest text-[10px] font-semibold mb-0.5">{t('badges.modal.earned')}</p>
            <p className="text-fg font-semibold">{earned}</p>
          </div>
        </div>

        {/* Pin toggle — PR_32 */}
        {pinLimitHit && !badge.is_pinned ? (
          <p className="text-[12px] text-warning text-center py-sp-2" role="alert">
            {t('badges.pinLimitError')}
          </p>
        ) : (
          <button
            onClick={() => onPin(badge.id, !badge.is_pinned)}
            className={[
              'min-h-touch w-full rounded-lg text-[13px] font-semibold flex items-center justify-center gap-sp-2 transition-colors',
              badge.is_pinned
                ? 'text-lav hover:bg-lav-dim'
                : 'text-muted hover:text-fg',
            ].join(' ')}
            style={{ border: '1px solid var(--bdr-color, rgba(255,255,255,0.08))' }}
            aria-label={badge.is_pinned
              ? t('badges.unpinAria', { name: badge.name })
              : t('badges.pinAria', { name: badge.name })
            }
            aria-pressed={badge.is_pinned}
          >
            <Star size={15} strokeWidth={2} fill={badge.is_pinned ? 'currentColor' : 'none'} />
            {badge.is_pinned ? t('badges.unpinAria', { name: '' }).trim() : t('badges.pinAria', { name: '' }).trim()}
          </button>
        )}
      </div>
    </div>
  )
}

export default function BadgesPage() {
  const t = useTranslations('profile')
  const { data: badges, isLoading, error, mutate } = useProfileBadges()
  const [selected, setSelected] = useState<ProfileBadge | null>(null)
  const [localBadges, setLocalBadges] = useState<ProfileBadge[] | null>(null)

  const displayBadges = localBadges ?? badges ?? []
  const pinnedCount = displayBadges.filter((b) => b.is_pinned).length
  const pinLimitHit = pinnedCount >= 3

  const handlePin = async (id: string, pinned: boolean) => {
    if (pinned && pinLimitHit) return
    const updated = displayBadges.map((b) => b.id === id ? { ...b, is_pinned: pinned } : b)
    setLocalBadges(updated)
    setSelected((prev) => prev?.id === id ? { ...prev, is_pinned: pinned } : prev)
    await fetch('/api/profile/badges', {
      method: 'PATCH',
      body: JSON.stringify({ id, is_pinned: pinned }),
    })
    mutate()
  }

  return (
    <>
      {/* Loading */}
      {isLoading && (
        <div
          className="grid gap-sp-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}
          aria-busy="true"
          aria-label={t('badges.loading')}
        >
          {Array.from({ length: 6 }).map((_, i) => <BadgeSkeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center gap-sp-4 py-sp-16 text-center" role="alert">
          <AlertTriangle size={36} strokeWidth={2} className="text-danger" />
          <p className="text-[15px] font-semibold text-fg">{t('badges.error.title')}</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-sp-2 min-h-touch px-sp-5 rounded-lg text-[13px] font-semibold text-lav"
            style={{ border: '1px solid var(--lav-border)' }}
          >
            <RefreshCw size={14} strokeWidth={2} />
            {t('badges.error.cta')}
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && displayBadges.length === 0 && (
        <div className="flex flex-col items-center text-center py-sp-16 px-sp-4 gap-sp-6">
          <Award size={40} strokeWidth={2} className="text-muted-2" />
          <div>
            <p className="text-[16px] font-semibold text-fg mb-1">{t('badges.empty.title')}</p>
            <p className="text-[13px] text-muted max-w-[280px]">{t('badges.empty.desc')}</p>
          </div>
          <Link
            href="/map"
            className="min-h-touch px-sp-6 flex items-center gap-sp-2 rounded-full text-[13px] font-semibold text-fg"
            style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
          >
            <Map size={15} strokeWidth={2} />
            {t('badges.empty.cta')}
          </Link>
        </div>
      )}

      {/* Success — badge grid — PR_30 */}
      {!isLoading && !error && displayBadges.length > 0 && (
        <div
          className="grid gap-sp-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}
        >
          {displayBadges.map((badge) => {
            const style = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common
            const Icon = categoryIcon(badge.category)
            return (
              <button
                key={badge.id}
                onClick={() => setSelected(badge)}
                className="flex flex-col items-center gap-sp-2 group"
                aria-label={badge.name}
              >
                {/* Badge icon */}
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${style.bg} ${style.ring}`}>
                  <Icon size={26} strokeWidth={2} className={style.icon} />
                  {/* Pinned star — PR_32 */}
                  {badge.is_pinned && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-bg flex items-center justify-center">
                      <Star size={11} strokeWidth={2} fill="currentColor" className="text-lav" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-muted text-center line-clamp-2 leading-tight max-w-[72px]">
                  {badge.name}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Badge detail modal */}
      {selected && (
        <BadgeDetailModal
          badge={selected}
          onClose={() => setSelected(null)}
          onPin={handlePin}
          pinLimitHit={pinLimitHit}
          t={t}
        />
      )}
    </>
  )
}
