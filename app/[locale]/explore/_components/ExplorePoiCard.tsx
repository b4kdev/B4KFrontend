'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import { TrendingUp, MapPin, Bookmark, Heart, ExternalLink } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import { useAuthGate } from '@/contexts/AuthGateContext'
import type { ExplorePoi } from '@/app/api/explore/[category]/route'

export default function ExplorePoiCard({ poi }: { poi: ExplorePoi }) {
  const t = useTranslations('explore')
  const { data: session } = useSession()
  const { open: openAuthGate } = useAuthGate()

  const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })

  const [saved,  setSaved]  = useState(false)
  const [liked,  setLiked]  = useState(false)

  // Partner redirect — Link href points to partner_url (validated https://) in new tab
  const isPartner = !!(poi.is_partner && poi.partner_url && /^https?:\/\//.test(poi.partner_url))

  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session) { openAuthGate('save_poi'); return }
    const next = !saved
    setSaved(next)
    await fetch('/api/saved/poi', {
      method:  next ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ place_id: poi.place_id }),
    }).catch(() => setSaved(!next))
  }, [session, saved, openAuthGate, poi.place_id])

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session) { openAuthGate('like'); return }
    const next = !liked
    setLiked(next)
    await fetch('/api/likes/poi', {
      method:  next ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ place_id: poi.place_id }),
    }).catch(() => setLiked(!next))
  }, [session, liked, openAuthGate, poi.place_id])

  return (
    <article
      className="flex flex-col overflow-hidden relative"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
    >
      <Link
        href={isPartner ? (poi.partner_url ?? `/map?poi=${poi.place_id}`) : `/map?poi=${poi.place_id}`}
        className="flex flex-col flex-1 transition-opacity hover:opacity-80"
        aria-label={t('card.ariaLabel', { name })}
        target={isPartner ? '_blank' : undefined}
        rel={isPartner ? 'noopener noreferrer' : undefined}
      >
        <div
          className="w-full aspect-[4/3] flex items-center justify-center relative"
          style={{ background: 'var(--bg-3)' }}
        >
          {poi.primary_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poi.primary_image_url}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <MapPin size={22} strokeWidth={2} className="text-muted-2" />
          )}
          {/* Sponsored label — DEC-05 / CLAUDE.md §9: LeftPanel card only on desktop, but Explore cards are equivalent */}
          {isPartner && (
            <span
              className="absolute top-sp-2 left-sp-2 text-f-xxs font-semibold px-sp-2 py-[3px] rounded-full"
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

      {/* Save + Like actions — outside Link to avoid <a>-in-<a> */}
      <div
        className="flex items-center gap-sp-1 px-sp-3 pb-sp-3"
        style={{ borderTop: '1px solid var(--bdr)' }}
      >
        <button
          onClick={handleSave}
          aria-label={saved ? t('card.unsaveAria', { name }) : t('card.saveAria', { name })}
          aria-pressed={saved}
          className="flex items-center justify-center min-h-touch w-touch transition-colors"
          style={{ color: saved ? 'var(--lav)' : 'var(--muted)' }}
        >
          <Bookmark
            size={20}
            strokeWidth={2}
            fill={saved ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </button>
        <button
          onClick={handleLike}
          aria-label={liked ? t('card.unlikeAria', { name }) : t('card.likeAria', { name })}
          aria-pressed={liked}
          className="flex items-center justify-center min-h-touch w-touch transition-colors"
          style={{ color: liked ? 'var(--danger)' : 'var(--muted)' }}
        >
          <Heart
            size={20}
            strokeWidth={2}
            fill={liked ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </button>
      </div>
    </article>
  )
}
