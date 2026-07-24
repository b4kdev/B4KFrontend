'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { Link } from '@/i18n/navigation'
import { TrendingUp, MapPin, Bookmark, Heart, ExternalLink } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import { useAuthGate } from '@/contexts/AuthGateContext'
import { useToast } from '@/contexts/ToastContext'
import type { ExplorePoi } from '@/app/api/explore/[category]/route'

export default function ExplorePoiCard({ poi }: { poi: ExplorePoi }) {
  const t = useTranslations('explore')
  const tToast = useTranslations('toast')
  const { user } = useAuth()
  const { open: openAuthGate } = useAuthGate()
  const { showToast } = useToast()

  const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })

  const [saved,  setSaved]  = useState(false)
  const [liked,  setLiked]  = useState(false)

  // Partner redirect — Link href points to partner_url (validated https://) in new tab
  const isPartner = !!(poi.is_partner && poi.partner_url && /^https?:\/\//.test(poi.partner_url))

  // D-Day countdown — days until event_date (whole-day delta from today).
  let dDay: string | null = null
  if (poi.event_date) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const target = new Date(poi.event_date + 'T00:00:00')
    const days = Math.round((target.getTime() - today.getTime()) / 86400000)
    dDay = days > 0 ? t('card.dDay', { days }) : days === 0 ? t('card.dDayToday') : t('card.dDayPast')
  }

  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { openAuthGate('save_poi'); return }
    const next = !saved
    setSaved(next)
    await fetch('/api/saved/poi', {
      method:  next ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ poi_id: poi.poi_id }),
    }).catch(() => { setSaved(!next); showToast(tToast('actionFailed'), 'error') })
  }, [user, saved, openAuthGate, poi.poi_id, showToast, tToast])

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { openAuthGate('like'); return }
    const next = !liked
    setLiked(next)
    await fetch('/api/likes/poi', {
      method:  next ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ poi_id: poi.poi_id }),
    }).catch(() => { setLiked(!next); showToast(tToast('actionFailed'), 'error') })
  }, [user, liked, openAuthGate, poi.poi_id, showToast, tToast])

  return (
    <article
      className="flex flex-col overflow-hidden relative w-[clamp(220px,72vw,260px)] shrink-0"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
    >
      <Link
        href={isPartner ? (poi.partner_url ?? `/map?poi=${poi.poi_id}`) : `/map?poi=${poi.poi_id}`}
        className="flex flex-col flex-1 transition-opacity hover:opacity-80"
        aria-label={t('card.ariaLabel', { name })}
        target={isPartner ? '_blank' : undefined}
        rel={isPartner ? 'noopener noreferrer' : undefined}
      >
        <div
          className="w-full aspect-[4/3] flex items-center justify-center relative overflow-hidden"
          style={{ background: 'var(--bg-3)' }}
        >
          {poi.primary_image_url ? (
            <Image
              src={poi.primary_image_url}
              alt={name}
              fill
              sizes="(max-width: 1024px) 72vw, 260px"
              className="object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-sp-1">
              <MapPin size={22} strokeWidth={2} className="text-fg opacity-[0.15]" />
              <span className="text-f-xxs text-muted">{t('card.imagePending')}</span>
            </div>
          )}
          {/* D-Day countdown badge — event/festival/merch items */}
          {dDay && (
            <span
              className="absolute top-sp-2 right-sp-2 text-f-xxs font-bold px-sp-2 py-[3px] rounded-full text-bg"
              style={{ background: 'var(--lav)' }}
            >
              {dDay}
            </span>
          )}
          {/* Sponsored label — DEC-05 / CLAUDE.md §9: LeftPanel card only on desktop, but Explore cards are equivalent */}
          {isPartner && (
            <span
              className="absolute bottom-sp-2 left-sp-2 text-f-xxs font-semibold px-sp-2 py-[3px] rounded-full"
              style={{ background: 'var(--backdrop-50)', color: 'var(--fg)', border: '1px solid var(--bdr)' }}
            >
              {t('card.sponsored')}
            </span>
          )}
        </div>
        <div className="p-sp-3 flex flex-col gap-[4px]">
          <div className="flex items-start justify-between gap-sp-2">
            <span className="text-f-md font-semibold text-fg leading-tight line-clamp-2 flex-1">
              {name}
            </span>
            <div className="flex items-center gap-sp-1 shrink-0">
              {poi.is_trending && (
                <span
                  className="flex items-center gap-[3px] text-f-xxs font-semibold text-lav px-[6px] py-[2px] rounded-full"
                  style={{ background: 'var(--lav-dim)' }}
                >
                  <TrendingUp size={9} strokeWidth={2} aria-hidden="true" />
                  {t('card.trending')}
                </span>
              )}
              {isPartner && (
                <ExternalLink size={12} strokeWidth={2} className="text-muted" aria-hidden="true" />
              )}
            </div>
          </div>
          <span className="text-f-xs text-muted">{poi.display_region}</span>
        </div>
      </Link>

      {/* Save + Like — top-left, sibling of Link (not nested — avoids <button> inside <a>) */}
      <div className="absolute top-sp-2 left-sp-2 flex items-center gap-1">
        <button
          onClick={handleSave}
          aria-label={saved ? t('card.unsaveAria', { name }) : t('card.saveAria', { name })}
          aria-pressed={saved}
          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
          style={{ background: 'var(--backdrop-50)', color: saved ? 'var(--lav)' : 'var(--fg)' }}
        >
          <Bookmark size={15} strokeWidth={2} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
        <button
          onClick={handleLike}
          aria-label={liked ? t('card.unlikeAria', { name }) : t('card.likeAria', { name })}
          aria-pressed={liked}
          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
          style={{ background: 'var(--backdrop-50)', color: liked ? 'var(--danger)' : 'var(--fg)' }}
        >
          <Heart size={15} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
