'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { GripVertical, X, Clock, ArrowRight, AlertTriangle } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import { estimateLegMinutes } from '@/lib/plan-estimate'
import type { MapPoi } from '@/hooks/useMapPois'

const MAX_DAYS = 7

interface Props {
  isOpen:           boolean
  stops:            MapPoi[]
  stopDurations:    Record<string, number>
  onReorder:        (newOrder: string[]) => void
  onRemove:         (id: string) => void
  onDurationChange: (id: string, minutes: number) => void
  onSavePlan:       () => void
  onDiscardPlan:    () => void
  onDismiss:        () => void
  stopDays:         Record<string, number>
  activeDay:        number
  onDayChange:      (day: number) => void
}

export default function PlanBottomSheet({
  isOpen, stops, stopDurations,
  onReorder, onRemove, onDurationChange, onSavePlan, onDiscardPlan, onDismiss,
  stopDays, activeDay, onDayChange,
}: Props) {
  const t = useTranslations('map.plan')

  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const [routeError]            = useState(false)

  // UF-5 (G4.2) — day tabs: always offer one more than the highest day in use, capped at 7
  const maxDayUsed = stops.reduce((max, s) => Math.max(max, stopDays[s.poi_id] ?? 1), 1)
  const dayCount = Math.min(Math.max(maxDayUsed, activeDay) + (maxDayUsed < MAX_DAYS ? 1 : 0), MAX_DAYS)
  const dayStops = stops.filter(s => (stopDays[s.poi_id] ?? 1) === activeDay)

  function handleDragStart(i: number) { dragItem.current = i; setDragging(i) }
  function handleDragEnter(i: number) { dragOver.current = i }
  function handleDragEnd() {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      const ids = dayStops.map(s => s.poi_id)
      const [moved] = ids.splice(dragItem.current, 1)
      ids.splice(dragOver.current, 0, moved)
      onReorder(ids)
    }
    dragItem.current = null
    dragOver.current = null
    setDragging(null)
  }

  const totalMin = stops.reduce((sum, s) => sum + (stopDurations[s.poi_id] ?? 60), 0)
  const hrs  = Math.floor(totalMin / 60)
  const mins = totalMin % 60

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'lg:hidden fixed inset-0 z-30 transition-opacity duration-200',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        style={{ background: 'var(--backdrop-50)' }}
        aria-hidden="true"
        onClick={onDismiss}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        className={[
          'lg:hidden fixed bottom-14 left-0 right-0 z-40 rounded-none',
          'transition-transform duration-[250ms] ease-out max-h-[70vh] flex flex-col',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Drag indicator */}
        <div className="flex justify-center pt-sp-2 pb-sp-1 shrink-0" aria-hidden="true">
          <div className="w-8 h-1 rounded-full bg-muted-2" />
        </div>

        {/* Header */}
        <div
          className="px-sp-4 py-sp-3 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid var(--bdr)' }}
        >
          <p className="divrow">
            {t('title')}
          </p>
          <div className="flex items-center gap-sp-3">
            <span className="text-xs text-muted tabular-nums">
              {stops.length} {t('stops')}
            </span>
            <button
              onClick={onDismiss}
              aria-label={t('close')}
              className="min-w-[28px] min-h-[28px] flex items-center justify-center text-fg hover:bg-muted-3 transition-colors"
            >
              <X size={16} strokeWidth={2} style={{ opacity: 0.35 }} />
            </button>
          </div>
        </div>

        {/* UF-5 (G4.2) — Day tabs */}
        <div className="flex gap-1 px-sp-3 py-sp-2 shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid var(--bdr)' }}>
          {Array.from({ length: dayCount }, (_, i) => i + 1).map(day => (
            <button
              key={day}
              onClick={() => onDayChange(day)}
              aria-pressed={day === activeDay}
              className="min-h-touch px-sp-3 rounded-full text-f-xxs font-semibold whitespace-nowrap transition-colors"
              style={day === activeDay
                ? { background: 'var(--lav-dim)', color: 'var(--lav)' }
                : { color: 'var(--muted)' }}
            >
              {t('dayTab', { n: day })}
            </button>
          ))}
        </div>

        {/* Stop list */}
        <div className="flex-1 overflow-y-auto themed-scrollbar">
          {dayStops.map((poi, i) => {
            const name     = getDisplayName(poi)
            const duration = stopDurations[poi.poi_id] ?? 60
            const next     = dayStops[i + 1]

            return (
              <div key={poi.poi_id}>
                <div
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragEnter={() => handleDragEnter(i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  className={[
                    'flex items-center gap-sp-2 px-sp-3 py-sp-3 group transition-opacity',
                    dragging === i ? 'opacity-40' : 'opacity-100',
                  ].join(' ')}
                  style={{ borderBottom: '1px solid var(--bdr)' }}
                >
                  <button
                    aria-label={t('dragHandle', { n: i + 1 })}
                    className="cursor-grab active:cursor-grabbing text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 min-w-[20px] min-h-[20px] flex items-center justify-center"
                  >
                    <GripVertical size={13} strokeWidth={2} />
                  </button>

                  <span
                    className="w-5 h-5 rounded-full bg-lav text-bg text-f-xxs font-bold flex items-center justify-center shrink-0 select-none"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>

                  <span className="flex-1 text-fg text-sm truncate min-w-0">{name}</span>

                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={duration}
                      onChange={e => onDurationChange(poi.poi_id, Math.max(5, Math.min(480, Number(e.target.value) || 60)))}
                      aria-label={t('durationAriaLabel', { name })}
                      className="w-[42px] text-center text-xs text-fg bg-bg-3 rounded-none py-0.5 outline-none focus:ring-1 focus:ring-lav tabular-nums"
                      style={{ border: '1px solid var(--bdr)' }}
                    />
                    <span className="text-muted text-f-xxs">{t('durationLabel')}</span>
                  </div>

                  <button
                    onClick={() => onRemove(poi.poi_id)}
                    aria-label={t('removeStop', { n: i + 1 })}
                    className="text-muted hover:text-danger transition-colors shrink-0 min-w-touch min-h-touch flex items-center justify-center"
                  >
                    <X size={13} strokeWidth={2} />
                  </button>
                </div>

                {/* UF-5 (G4.2 / DEC-13 §1) — bare leg estimate, no mode selector in the builder */}
                {next && (
                  <div
                    className="flex items-center gap-sp-2 py-1 pl-sp-4 ml-sp-3"
                    style={{ borderLeft: '1px solid var(--muted-3)' }}
                    aria-label={t('legAriaLabel', { from: i + 1, to: i + 2 })}
                  >
                    <span className="text-f-xxs text-muted-2">
                      {t('legEstimate', { min: estimateLegMinutes(poi.coords_lat, poi.coords_lng, next.coords_lat, next.coords_lng) })}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ERR_03 — Route generation failure */}
        {routeError && (
          <div
            className="flex items-center gap-sp-2 px-sp-4 py-sp-2 shrink-0"
            style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', borderTop: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
            role="alert"
          >
            <AlertTriangle size={13} strokeWidth={2} className="text-danger shrink-0" aria-hidden="true" />
            <span className="flex-1 text-f-xs text-danger">{t('routeError')}</span>
            <button
              onClick={onSavePlan}
              className="text-f-xs font-semibold text-danger hover:opacity-70 transition-opacity"
            >
              {t('routeRetry')}
            </button>
          </div>
        )}

        {/* Footer */}
        <div
          className="p-sp-4 flex flex-col gap-sp-3 shrink-0"
          style={{ borderTop: '1px solid var(--bdr)' }}
        >
          {/* Total duration */}
          <div className="flex items-center gap-sp-2 text-muted text-xs">
            <Clock size={12} strokeWidth={2} aria-hidden="true" />
            <span>
              {hrs > 0 ? `${hrs}h ` : ''}{mins > 0 || hrs === 0 ? `${mins}m` : ''}{' '}{t('total')}
            </span>
          </div>

          {/* Save Plan CTA */}
          <button
            onClick={onSavePlan}
            disabled={stops.length === 0}
            className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-fg text-bg rounded-none font-semibold text-sm hover:bg-royal-600 hover:text-fg transition-[background,color] duration-[80ms] disabled:opacity-40"
          >
            {t('save')}
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </button>

          {/* UF-6 (G5.6) — Discard draft */}
          <button
            onClick={onDiscardPlan}
            className="w-full min-h-touch flex items-center justify-center rounded-none font-medium text-sm text-danger bg-transparent border border-transparent hover:border-danger transition-[border-color,color] duration-[80ms]"
          >
            {t('discardDraft')}
          </button>
        </div>
      </div>
    </>
  )
}
