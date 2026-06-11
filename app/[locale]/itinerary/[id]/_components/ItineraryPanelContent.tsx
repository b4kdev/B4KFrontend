'use client'

import { useState, RefObject } from 'react'
import { useTranslations } from 'next-intl'
import {
  Heart, Bookmark, Share2, Edit2,
  Car, Train, MapPin, Route, Clock,
  BadgeCheck,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getDisplayName } from '@/lib/display-name'
import type { ItineraryDetail } from '@/app/api/itinerary/[id]/route'

interface Props {
  itinerary: ItineraryDetail
  selectedPoiId: string | null
  isLiked: boolean
  isSaved: boolean
  isOwner: boolean
  scrollRef?: RefObject<HTMLDivElement>
  onStopSelect: (poiId: string) => void
  onLike: () => void
  onSave: () => void
  onShare: () => void
  onEdit: () => void
}

function TransportIcon({ mode }: { mode: 'car' | 'public' | null }) {
  if (mode === 'car') return <Car size={11} strokeWidth={2} className="text-muted shrink-0" />
  if (mode === 'public') return <Train size={11} strokeWidth={2} className="text-muted shrink-0" />
  return null
}

export default function ItineraryPanelContent({
  itinerary,
  selectedPoiId,
  isLiked,
  isSaved,
  isOwner,
  scrollRef,
  onStopSelect,
  onLike,
  onSave,
  onShare,
  onEdit,
}: Props) {
  const t = useTranslations('itinerary')

  const hasDays = itinerary.stops.some(s => s.day !== null)
  const days = hasDays
    ? Array.from(new Set(itinerary.stops.map(s => s.day).filter((d): d is number => d !== null))).sort((a, b) => a - b)
    : []
  const [activeDay, setActiveDay] = useState<number | null>(null)

  const visibleStops = activeDay === null
    ? itinerary.stops
    : itinerary.stops.filter(s => s.day === activeDay)

  const totalHours = Math.floor(itinerary.total_duration_min / 60)
  const totalMins  = itinerary.total_duration_min % 60
  const durationLabel = totalHours > 0
    ? `${totalHours}h${totalMins > 0 ? ` ${totalMins}m` : ''}`
    : `${totalMins}m`

  const distanceLabel = itinerary.distance_m
    ? itinerary.distance_m >= 1000
      ? `${(itinerary.distance_m / 1000).toFixed(1)} km`
      : `${itinerary.distance_m} m`
    : null

  const transportModes = Array.from(new Set(itinerary.stops.map(s => s.transport_mode).filter(Boolean))) as ('car' | 'public')[]

  const authorName = getDisplayName({
    name_preferred: itinerary.author.name_preferred,
    name_en:        itinerary.author.name_en,
    name_ko:        itinerary.author.name_ko,
    id:             itinerary.author.id,
  })

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto overscroll-contain pb-sp-8"
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="px-sp-4 pt-sp-4 pb-sp-3">
        {/* Sponsored badge — LP_16B D05 */}
        {itinerary.is_partner && (
          <div className="flex items-center gap-1 mb-sp-2">
            <BadgeCheck size={12} strokeWidth={2} className="text-warning" aria-hidden="true" />
            <span
              className="text-f-xxs font-bold uppercase tracking-widest text-warning"
              aria-label={t('sponsored')}
            >
              {t('sponsored')}
            </span>
          </div>
        )}

        <h1 className="text-f-lg font-semibold text-fg leading-snug mb-sp-2">
          {itinerary.title}
        </h1>

        {/* Creator */}
        <div className="flex items-center gap-sp-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-lav"
            style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
            aria-hidden="true"
          >
            {authorName.charAt(0).toUpperCase()}
          </div>
          <span className="text-f-sm text-muted truncate">
            {t('createdBy', { name: authorName })}
          </span>
        </div>
      </div>

      {/* ─── Stats ──────────────────────────────────────────────── */}
      <div
        className="mx-sp-4 mb-sp-3 px-sp-3 py-sp-2 rounded-lg flex items-center gap-sp-3 flex-wrap"
        style={{ background: 'var(--bg-3)' }}
      >
        <span className="flex items-center gap-1 text-f-xs text-muted">
          <MapPin size={11} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
          {t('stats.stops', { count: itinerary.stops.length })}
        </span>
        <span className="flex items-center gap-1 text-f-xs text-muted">
          <Clock size={11} strokeWidth={2} className="shrink-0" aria-hidden="true" />
          {durationLabel}
        </span>
        {distanceLabel && (
          <span className="flex items-center gap-1 text-f-xs text-muted">
            <Route size={11} strokeWidth={2} className="shrink-0" aria-hidden="true" />
            {distanceLabel}
          </span>
        )}
        {transportModes.map(mode => (
          <span key={mode} className="flex items-center gap-1 text-f-xs text-muted">
            <TransportIcon mode={mode} />
            {t(`transport.${mode}`)}
          </span>
        ))}
      </div>

      {/* ─── Actions ────────────────────────────────────────────── */}
      <div className="px-sp-4 mb-sp-4 flex items-center gap-sp-2">
        <button
          onClick={onLike}
          aria-label={t('actions.likeAria')}
          aria-pressed={isLiked}
          className="flex items-center gap-1 min-h-touch px-sp-3 rounded-lg text-f-sm font-semibold transition-colors"
          style={{
            background: isLiked ? 'color-mix(in srgb, var(--danger) 12%, transparent)' : 'var(--bg-3)',
            color: isLiked ? 'var(--danger)' : 'var(--muted)',
            border: `1px solid ${isLiked ? 'color-mix(in srgb, var(--danger) 30%, transparent)' : 'transparent'}`,
          }}
        >
          <Heart size={13} strokeWidth={2} fill={isLiked ? 'currentColor' : 'none'} aria-hidden="true" />
          {isLiked ? t('actions.liked') : t('actions.like')}
        </button>

        <button
          onClick={onSave}
          aria-label={t('actions.saveAria')}
          aria-pressed={isSaved}
          className="flex items-center gap-1 min-h-touch px-sp-3 rounded-lg text-f-sm font-semibold transition-colors"
          style={{
            background: isSaved ? 'var(--lav-dim)' : 'var(--bg-3)',
            color: isSaved ? 'var(--lav)' : 'var(--muted)',
            border: `1px solid ${isSaved ? 'var(--lav-border)' : 'transparent'}`,
          }}
        >
          <Bookmark size={13} strokeWidth={2} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
          {isSaved ? t('actions.saved') : t('actions.save')}
        </button>

        <button
          onClick={onShare}
          aria-label={t('actions.shareAria')}
          className="min-h-touch w-touch flex items-center justify-center rounded-lg text-muted hover:text-fg transition-colors"
          style={{ background: 'var(--bg-3)' }}
        >
          <Share2 size={13} strokeWidth={2} aria-hidden="true" />
        </button>

        {isOwner && (
          <button
            onClick={onEdit}
            aria-label={t('actions.editAria')}
            className="flex items-center gap-1 min-h-touch px-sp-3 rounded-lg text-f-sm font-semibold text-lav hover:bg-lav-dim transition-colors"
            style={{ border: '1px solid var(--lav-border)' }}
          >
            <Edit2 size={13} strokeWidth={2} aria-hidden="true" />
            {t('actions.edit')}
          </button>
        )}
      </div>

      {/* ─── Day tabs ───────────────────────────────────────────── */}
      {hasDays && (
        <div
          className="flex items-center gap-sp-1 px-sp-4 mb-sp-4 overflow-x-auto"
          role="tablist"
          aria-label={t('stopList.ariaLabel')}
        >
          <button
            role="tab"
            aria-selected={activeDay === null}
            onClick={() => setActiveDay(null)}
            className="shrink-0 min-h-[30px] px-sp-3 rounded-full text-f-xs font-semibold transition-colors"
            style={{
              background: activeDay === null ? 'var(--lav-dim)' : 'var(--bg-3)',
              color: activeDay === null ? 'var(--lav)' : 'var(--muted)',
              border: `1px solid ${activeDay === null ? 'var(--lav-border)' : 'transparent'}`,
            }}
          >
            {t('tabs.all')}
          </button>
          {days.map(d => (
            <button
              key={d}
              role="tab"
              aria-selected={activeDay === d}
              onClick={() => setActiveDay(d)}
              className="shrink-0 min-h-[30px] px-sp-3 rounded-full text-f-xs font-semibold transition-colors"
              style={{
                background: activeDay === d ? 'var(--lav-dim)' : 'var(--bg-3)',
                color: activeDay === d ? 'var(--lav)' : 'var(--muted)',
                border: `1px solid ${activeDay === d ? 'var(--lav-border)' : 'transparent'}`,
              }}
            >
              {t('tabs.day', { n: d })}
            </button>
          ))}
        </div>
      )}

      {/* ─── Stop list ──────────────────────────────────────────── */}
      <ol
        className="px-sp-4 flex flex-col gap-sp-1 mb-sp-6"
        aria-label={t('stopList.ariaLabel')}
      >
        {visibleStops.map((stop, idx) => {
          const poiName = getDisplayName({
            name_preferred: stop.poi.name_preferred,
            name_en:        stop.poi.name_en,
            name_ko:        stop.poi.name_ko,
          })
          const isSelected = selectedPoiId === stop.poi.place_id
          const displayNum = activeDay === null ? stop.stop_order : idx + 1

          return (
            <li key={stop.stop_order}>
              <button
                data-poi={stop.poi.place_id}
                onClick={() => onStopSelect(stop.poi.place_id)}
                aria-label={t('stopItem.ariaLabel', { n: displayNum, name: poiName })}
                aria-current={isSelected ? 'true' : undefined}
                className="w-full text-left rounded-xl p-sp-3 transition-colors flex gap-sp-3 items-start"
                style={{
                  background: isSelected ? 'var(--lav-dim)' : 'var(--bg-3)',
                  border: `1px solid ${isSelected ? 'var(--lav-border)' : 'transparent'}`,
                }}
              >
                {/* Number badge */}
                <span
                  className="shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-f-xs font-bold mt-0.5"
                  style={{
                    background: isSelected ? 'var(--lav)' : 'var(--bg-2)',
                    color: isSelected ? 'var(--bg)' : 'var(--muted)',
                  }}
                  aria-hidden="true"
                >
                  {displayNum}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-f-md font-semibold text-fg leading-snug truncate">
                    {poiName}
                  </p>
                  <div className="flex items-center gap-sp-2 mt-0.5">
                    <span className="text-f-xs text-muted flex items-center gap-0.5">
                      <Clock size={10} strokeWidth={2} aria-hidden="true" />
                      {t('stopItem.min', { min: stop.duration_min })}
                    </span>
                    {stop.transport_mode && (
                      <span className="flex items-center gap-0.5 text-f-xs text-muted">
                        <TransportIcon mode={stop.transport_mode} />
                        {t(`transport.${stop.transport_mode}`)}
                      </span>
                    )}
                  </div>
                  {stop.notes && (
                    <p className="text-f-xs text-muted mt-sp-1 line-clamp-2 leading-relaxed">
                      {stop.notes}
                    </p>
                  )}
                </div>

                {/* Thumbnail placeholder */}
                <div
                  className="shrink-0 w-10 h-10 rounded-lg overflow-hidden"
                  style={{ background: 'var(--bg-2)' }}
                  aria-hidden="true"
                >
                  {stop.poi.primary_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={stop.poi.primary_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin size={14} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ol>

      {/* ─── Related ────────────────────────────────────────────── */}
      {itinerary.related.length > 0 && (
        <section aria-labelledby="related-heading" className="px-sp-4">
          <h2
            id="related-heading"
            className="text-f-xs font-bold uppercase tracking-widest text-muted mb-sp-3"
          >
            {t('related.title')}
          </h2>
          <div className="flex flex-col gap-sp-2">
            {itinerary.related.map(rel => (
              <Link
                key={rel.id}
                href={`/itinerary/${rel.id}`}
                className="flex items-center gap-sp-3 p-sp-3 rounded-xl transition-colors hover:bg-bg-3"
                style={{ border: '1px solid var(--bdr)' }}
              >
                <div
                  className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--bg-3)' }}
                  aria-hidden="true"
                >
                  {rel.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rel.thumbnail_url} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Route size={14} strokeWidth={2} className="text-muted-2" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-f-sm font-semibold text-fg leading-snug truncate">
                    {rel.title}
                  </p>
                  <div className="flex items-center gap-sp-2 mt-0.5">
                    <span className="text-f-xs text-muted">
                      {t('related.stops', { count: rel.stop_count })}
                    </span>
                    <span className="text-f-xs text-muted flex items-center gap-0.5">
                      <Heart size={10} strokeWidth={2} aria-hidden="true" />
                      {rel.like_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
