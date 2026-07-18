'use client'

import { useState, RefObject } from 'react'
import { useTranslations } from 'next-intl'
import {
  Heart, Bookmark, Share2, Edit2, Trash2,
  Car, Train, Footprints, MapPin, Route, Clock, Loader2,
  BadgeCheck,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getDisplayName } from '@/lib/display-name'
import { useOnline } from '@/hooks/useOnline'
import type { ItineraryDetail, ItineraryLeg } from '@/lib/itinerary'

type TransportMode = 'car' | 'public' | 'walk'
const MODES: TransportMode[] = ['car', 'public', 'walk']

type TFn = ReturnType<typeof useTranslations>

export function formatDuration(t: TFn, min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0 && m > 0) return t('duration.hoursMinutes', { h, m })
  if (h > 0) return t('duration.hours', { h })
  return t('duration.minutes', { m })
}

function formatDistance(t: TFn, meters: number): string {
  return meters >= 1000
    ? t('leg.km', { km: (meters / 1000).toFixed(1) })
    : t('leg.m', { m: meters })
}

interface Props {
  itinerary: ItineraryDetail
  selectedPoiId: string | null
  isLiked: boolean
  isSaved: boolean
  isOwner: boolean
  planId: string
  scrollRef?: RefObject<HTMLDivElement>
  onStopSelect: (poiId: string) => void
  onLike: () => void
  onSave: () => void
  onShare: () => void
  onEdit: () => void
  onDeleteClick?: () => void
  // SC-34 — mobile 3-snap content: 'full' shows untruncated stop notes +
  // Related; 'mid' (and desktop, where this stays undefined) keeps the
  // compact clamped view. Peek never renders this component at all.
  snap?: 'mid' | 'full'
}

function TransportIcon({ mode }: { mode: TransportMode | null }) {
  if (mode === 'car') return <Car size={11} strokeWidth={2} className="text-muted shrink-0" />
  if (mode === 'public') return <Train size={11} strokeWidth={2} className="text-muted shrink-0" />
  if (mode === 'walk') return <Footprints size={11} strokeWidth={2} className="text-muted shrink-0" />
  return null
}

/**
 * Leg row between two consecutive stop cards.
 * Transport mode lives on the leg (DEC-13): owner taps to cycle Car → Public → Walk,
 * non-owners see it read-only. While the (mock) recompute is pending — and when the
 * leg is missing entirely (TMAP cache miss) — shows "Calculating route…".
 */
function LegRow({
  leg,
  fromOrder,
  toOrder,
  isOwner,
  isOnline,
  planId,
  onModeChange,
}: {
  leg: ItineraryLeg | undefined
  fromOrder: number
  toOrder: number
  isOwner: boolean
  isOnline: boolean
  planId: string
  onModeChange: (fromOrder: number, next: TransportMode) => void
}) {
  const t = useTranslations('itinerary')
  const [saving, setSaving] = useState(false)

  if (!leg) {
    return (
      <div
        className="flex items-center gap-sp-2 py-sp-1 pl-sp-3 ml-sp-2"
        style={{ borderLeft: '1px solid var(--muted-3)' }}
        aria-label={t('leg.ariaLabel', { from: fromOrder, to: toOrder })}
      >
        <Loader2 size={11} strokeWidth={2} className="animate-spin shrink-0 text-muted-2" aria-hidden="true" />
        <span className="text-f-xs text-muted-2">{t('leg.calculating')}</span>
      </div>
    )
  }

  const mode = leg.transport_mode

  async function handleCycle() {
    if (!isOwner || !isOnline || saving) return
    const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length]
    setSaving(true)
    onModeChange(fromOrder, next) // optimistic
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_stop_order: fromOrder, transport_mode: next }),
      })
      if (!res.ok) throw new Error('patch_failed')
    } catch {
      onModeChange(fromOrder, mode) // revert
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="flex items-center gap-sp-2 py-sp-1 pl-sp-3 ml-sp-2"
      style={{ borderLeft: '1px solid var(--muted-3)' }}
      aria-label={t('leg.ariaLabel', { from: fromOrder, to: toOrder })}
    >
      <button
        onClick={handleCycle}
        disabled={!isOwner || !isOnline || saving}
        title={isOwner && !isOnline ? t('transport.offlineNote') : undefined}
        aria-label={
          isOwner
            ? t('transport.changeMode', { mode: t(`transport.${mode}`) })
            : t('transport.mode', { mode: t(`transport.${mode}`) })
        }
        className={`flex items-center gap-1 rounded-none text-f-xs text-muted transition-opacity ${isOwner && isOnline ? 'hover:opacity-70 cursor-pointer' : 'cursor-default'}`}
        style={{ border: 'none', background: 'none', padding: 0 }}
      >
        <TransportIcon mode={mode} />
        {t(`transport.${mode}`)}
      </button>
      {saving ? (
        <span className="text-f-xs text-muted-2 font-mono">{t('leg.calculating')}</span>
      ) : (
        <span className="text-f-xs text-muted-2">
          {formatDuration(t, Math.max(1, Math.round(leg.estimated_duration_s / 60)))}
          {/* SC-14 (S-GUUJBG) — distance only shown past 500m */}
          {leg.distance_m > 500 && <>{' · '}{formatDistance(t, leg.distance_m)}</>}
        </span>
      )}
    </div>
  )
}

export default function ItineraryPanelContent({
  itinerary,
  selectedPoiId,
  isLiked,
  isSaved,
  isOwner,
  planId,
  scrollRef,
  onStopSelect,
  onLike,
  onSave,
  onShare,
  onEdit,
  onDeleteClick,
  snap = 'full',
}: Props) {
  const t = useTranslations('itinerary')
  const isOnline = useOnline() // SC-21 (OFF_04)

  // Leg transport mode overrides (owner edits, optimistic) — keyed by from_stop_order
  const [legModeOverrides, setLegModeOverrides] = useState<Record<number, TransportMode>>({})
  function handleLegModeChange(fromOrder: number, next: TransportMode) {
    setLegModeOverrides(prev => ({ ...prev, [fromOrder]: next }))
  }

  const legs: ItineraryLeg[] = itinerary.legs.map(l =>
    legModeOverrides[l.from_stop_order]
      ? { ...l, transport_mode: legModeOverrides[l.from_stop_order] }
      : l
  )
  const findLeg = (from: number, to: number) =>
    legs.find(l => l.from_stop_order === from && l.to_stop_order === to)

  const hasDays = itinerary.stops.some(s => s.day !== null)
  const days = hasDays
    ? Array.from(new Set(itinerary.stops.map(s => s.day).filter((d): d is number => d !== null))).sort((a, b) => a - b)
    : []
  const [activeDay, setActiveDay] = useState<number | null>(null)

  const orderedStops = [...itinerary.stops].sort((a, b) => a.stop_order - b.stop_order)
  const visibleStops = activeDay === null
    ? orderedStops
    : orderedStops.filter(s => s.day === activeDay)

  // Cumulative time from stop 1 (arrival at each stop) — stop durations + leg durations so far
  const cumulativeMin: Record<number, number> = {}
  let acc = 0
  orderedStops.forEach((stop, i) => {
    if (i > 0) {
      const prev = orderedStops[i - 1]
      const leg = findLeg(prev.stop_order, stop.stop_order)
      acc += prev.duration_min + (leg ? Math.round(leg.estimated_duration_s / 60) : 0)
    }
    cumulativeMin[stop.stop_order] = acc
  })

  const durationLabel = formatDuration(t, itinerary.total_duration_min)

  const distanceLabel = itinerary.distance_m
    ? formatDistance(t, itinerary.distance_m)
    : null

  const transportModes = Array.from(new Set(legs.map(l => l.transport_mode)))

  const authorName = getDisplayName({
    name_preferred: itinerary.author.name_preferred,
    name_en:        itinerary.author.name_en,
    name_ko:        itinerary.author.name_ko,
    id:             itinerary.author.id,
  })

  return (
    <>
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
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-f-xxs font-bold text-lav"
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
        className="mx-sp-4 mb-sp-3 px-sp-3 py-sp-2 rounded-none flex items-center gap-sp-3 flex-wrap"
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

      {/* ─── Actions (secondary — primary CTAs live in the sticky footer) ── */}
      <div className="px-sp-4 mb-sp-4 flex items-center gap-sp-2">
        <button
          onClick={onLike}
          aria-label={t('actions.likeAria')}
          aria-pressed={isLiked}
          className="flex items-center gap-1 min-h-touch px-sp-3 rounded-none text-f-sm font-semibold transition-colors"
          style={{
            background: isLiked ? 'color-mix(in srgb, var(--danger) 12%, transparent)' : 'var(--bg-3)',
            color: isLiked ? 'var(--danger)' : 'var(--muted)',
            border: `1px solid ${isLiked ? 'color-mix(in srgb, var(--danger) 30%, transparent)' : 'transparent'}`,
          }}
        >
          <Heart size={13} strokeWidth={2} fill={isLiked ? 'currentColor' : 'none'} aria-hidden="true" />
          {isLiked ? t('actions.liked') : t('actions.like')}
        </button>
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
          const isSelected = selectedPoiId === stop.poi.poi_id
          const displayNum = activeDay === null ? stop.stop_order : idx + 1
          const fromStart  = cumulativeMin[stop.stop_order] ?? 0
          const nextStop   = visibleStops[idx + 1]

          return (
            <li key={stop.stop_order}>
              <button
                data-poi={stop.poi.poi_id}
                onClick={() => onStopSelect(stop.poi.poi_id)}
                aria-label={t('stopItem.ariaLabel', { n: displayNum, name: poiName })}
                aria-current={isSelected ? 'true' : undefined}
                className="w-full text-left rounded-none p-sp-3 transition-colors flex gap-sp-3 items-start"
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
                  <div className="flex items-center gap-sp-2 mt-0.5 flex-wrap">
                    <span className="text-f-xs text-muted flex items-center gap-0.5">
                      <Clock size={10} strokeWidth={2} aria-hidden="true" />
                      {t('stopItem.min', { min: stop.duration_min })}
                    </span>
                    {fromStart > 0 && (
                      <span className="text-f-xs text-muted-2">
                        {t('stopItem.fromStart', { time: formatDuration(t, fromStart) })}
                      </span>
                    )}
                  </div>
                  {stop.notes && (
                    <p className={`text-f-xs text-muted mt-sp-1 leading-relaxed ${snap === 'full' ? '' : 'line-clamp-2'}`}>
                      {stop.notes}
                    </p>
                  )}
                </div>

                {/* Thumbnail placeholder */}
                <div
                  className="shrink-0 w-10 h-10 rounded-none overflow-hidden"
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

              {/* Leg row to next stop */}
              {nextStop && (
                <LegRow
                  leg={findLeg(stop.stop_order, nextStop.stop_order)}
                  fromOrder={stop.stop_order}
                  toOrder={nextStop.stop_order}
                  isOwner={isOwner}
                  isOnline={isOnline}
                  planId={planId}
                  onModeChange={handleLegModeChange}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* ─── Related ────────────────────────────────────────────── */}
      {snap === 'full' && itinerary.related.length > 0 && (
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
                href={`/plan/${rel.id}`}
                className="flex items-center gap-sp-3 p-sp-3 rounded-none transition-colors hover:bg-bg-3"
                style={{ border: '1px solid var(--bdr)' }}
              >
                <div
                  className="shrink-0 w-10 h-10 rounded-none flex items-center justify-center overflow-hidden"
                  style={{ background: 'var(--bg-3)' }}
                  aria-hidden="true"
                >
                  {rel.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rel.thumbnail_url} alt="" className="w-full h-full object-cover" />
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

    {/* ─── Sticky footer — total duration + primary CTAs (S-BMGOFW) ── */}
    <div
      className="flex-none px-sp-4 py-sp-3 flex flex-col gap-sp-2 bg-bg-2"
      style={{ borderTop: '1px solid var(--bdr)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-f-xs text-muted">{t('footer.totalDuration')}</span>
        <span className="text-f-sm font-semibold text-fg">{durationLabel}</span>
      </div>
      <div className="flex items-center gap-sp-2">
        {isOwner ? (
          <button
            onClick={onEdit}
            aria-label={t('actions.editAria')}
            className="flex-1 flex items-center justify-center gap-1 min-h-touch px-sp-3 rounded-none text-f-sm font-semibold text-lav hover:bg-lav-dim transition-colors"
            style={{ border: '1px solid var(--lav-border)' }}
          >
            <Edit2 size={13} strokeWidth={2} aria-hidden="true" />
            {t('actions.edit')}
          </button>
        ) : (
          <button
            onClick={onSave}
            aria-label={t('actions.saveAria')}
            aria-pressed={isSaved}
            className="flex-1 flex items-center justify-center gap-1 min-h-touch px-sp-3 rounded-none text-f-sm font-semibold transition-colors"
            style={{
              background: isSaved ? 'var(--lav-dim)' : 'var(--bg-3)',
              color: isSaved ? 'var(--lav)' : 'var(--muted)',
              border: `1px solid ${isSaved ? 'var(--lav-border)' : 'transparent'}`,
            }}
          >
            <Bookmark size={13} strokeWidth={2} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
            {isSaved ? t('actions.saved') : t('actions.save')}
          </button>
        )}

        <button
          onClick={onShare}
          aria-label={t('actions.shareAria')}
          className="min-h-touch w-touch flex items-center justify-center rounded-none text-muted hover:text-fg transition-colors"
          style={{ background: 'var(--bg-3)' }}
        >
          <Share2 size={13} strokeWidth={2} aria-hidden="true" />
        </button>

        {isOwner && onDeleteClick && (
          <button
            onClick={onDeleteClick}
            aria-label={t('actions.deleteAria')}
            className="min-h-touch w-touch flex items-center justify-center rounded-none text-danger transition-colors"
            style={{ background: 'var(--bg-3)' }}
          >
            <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
    </>
  )
}
