'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { Link } from '@/i18n/navigation'
import { MapPin, Bookmark, Heart } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import { useAuthGate } from '@/contexts/AuthGateContext'
import { useSaved } from '@/hooks/useSaved'
import { track } from '@/lib/analytics'
import type { HomeTrendingPoi } from '@/app/api/home/trending/route'

interface Props {
  poi: HomeTrendingPoi
  badge?: string
}

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

export default function HomePoiCard({ poi, badge }: Props) {
  const t = useTranslations('home.poiCard')
  const locale = useLocale()
  const { user } = useAuth()
  const { open: openAuthGate } = useAuthGate()
  const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
  const { data: savedData, mutate: mutateSaved } = useSaved()

  // Seed from the real saved list — undefined until the SWR fetch resolves, then
  // overridden optimistically by handleSave. See EXPLORE-POI-SEED (orchestrator queue).
  const isSavedRemote = !!savedData?.pois.some(p => p.poi_id === poi.poi_id)
  const [savedOverride, setSavedOverride] = useState<boolean | null>(null)
  const saved = savedOverride ?? isSavedRemote
  const [liked, setLiked] = useState(false)
  // Home seed content ships a content-sheet code ('KP-207') as poi_id, not the
  // live DB's numeric id — save/like can't resolve these yet. Disable rather
  // than silently fail. See B4KVault/blockers/ (bookmark seed-id mismatch).
  const hasRealId = Number.isFinite(Number(poi.poi_id))

  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!hasRealId) return
    if (!user) { openAuthGate('save_poi'); return }
    const next = !saved
    setSavedOverride(next)
    if (next) track('poi_save', { poi_id: poi.poi_id, locale, screen_id: 'HM_01' })
    await fetch('/api/saved/poi', {
      method:  next ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ poi_id: poi.poi_id }),
    }).then(() => mutateSaved())
      .catch(() => setSavedOverride(!next))
  }, [user, saved, openAuthGate, poi.poi_id, hasRealId, mutateSaved, locale])

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!hasRealId) return
    if (!user) { openAuthGate('like'); return }
    const next = !liked
    setLiked(next)
    await fetch('/api/likes/poi', {
      method:  next ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ poi_id: poi.poi_id }),
    }).catch(() => setLiked(!next))
  }, [user, liked, openAuthGate, poi.poi_id, hasRealId])

  return (
    <article
      className="relative overflow-hidden"
      style={{ width: 'clamp(220px, 44vw, 280px)', background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
    >
      <Link
        href={`/place/${poi.poi_id}`}
        className="flex flex-col hover:opacity-90 transition-opacity"
        aria-label={t('ariaLabel', { name, region: poi.display_region })}
      >
        <div className="relative bg-bg-3 flex flex-col items-center justify-center gap-sp-1 overflow-hidden" style={{ aspectRatio: '4/3' }}>
          {!poi.primary_image_url && (
            <>
              <MapPin size={28} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
              <span className="text-f-xxs text-muted">{t('imagePending')}</span>
            </>
          )}
          {poi.primary_image_url && (
            <Image
              src={poi.primary_image_url}
              alt=""
              fill
              sizes="(max-width: 1024px) 44vw, 280px"
              className="object-cover"
              aria-hidden="true"
            />
          )}
          {badge && (
            <span
              className="absolute bottom-sp-2 left-sp-2 text-f-xxs font-bold tracking-[0.1em] uppercase text-bg bg-lav px-[6px] py-[3px] leading-none"
              aria-label={badge}
            >
              {badge}
            </span>
          )}
          <span
            className="absolute top-sp-2 right-sp-2 text-f-xxs font-semibold text-fg leading-none"
            style={{ background: 'var(--backdrop-50)', padding: '2px 6px' }}
            aria-hidden="true"
          >
            {poi.display_domain}
          </span>
        </div>
        <div className="p-sp-3 flex flex-col gap-[3px]">
          <p className="text-f-md font-semibold text-fg leading-snug line-clamp-1">{name}</p>
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-[3px] text-f-xs text-muted">
              <MapPin size={10} strokeWidth={2} aria-hidden="true" />
              <span className="line-clamp-1">{poi.display_region}</span>
            </p>
            <p className="flex items-center gap-[3px] text-f-xs text-muted tabular-nums shrink-0">
              <Bookmark size={10} strokeWidth={2} aria-hidden="true" />
              {formatCount(poi.save_count)}
            </p>
          </div>
        </div>
      </Link>

      {/* Save + Like — top-left, sibling of Link (not nested — avoids <button> inside <a>).
          Hidden (not just disabled) when the card has no real DB id — a visibly
          clickable-but-inert button reads as broken, not intentional. */}
      {hasRealId && (
        <div className="absolute top-sp-2 left-sp-2 flex items-center gap-1">
          <button
            onClick={handleSave}
            aria-label={saved ? t('unsaveAria', { name }) : t('saveAria', { name })}
            aria-pressed={saved}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-[80ms]"
            style={{ background: 'var(--backdrop-50)', color: saved ? 'var(--lav)' : 'var(--fg)' }}
          >
            <Bookmark size={15} strokeWidth={2} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
          <button
            onClick={handleLike}
            aria-label={liked ? t('unlikeAria', { name }) : t('likeAria', { name })}
            aria-pressed={liked}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-[80ms]"
            style={{ background: 'var(--backdrop-50)', color: liked ? 'var(--danger)' : 'var(--fg)' }}
          >
            <Heart size={15} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  )
}

export function HomePoiCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden animate-pulse"
      style={{ width: 'clamp(220px, 44vw, 280px)', background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
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
