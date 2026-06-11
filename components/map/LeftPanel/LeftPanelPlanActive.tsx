'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { GripVertical, X, Car, Bus, Clock, AlertTriangle } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import type { MapPoi } from '@/hooks/useMapPois'

interface Props {
  stops:            MapPoi[]
  stopDurations:    Record<string, number>
  transport:        'car' | 'public'
  routeError?:      boolean
  onReorder:        (newOrder: string[]) => void
  onRemove:         (id: string) => void
  onDurationChange: (id: string, minutes: number) => void
  onTransportChange:(mode: 'car' | 'public') => void
  onPreviewPlan:    () => void
}

export default function LeftPanelPlanActive({
  stops, stopDurations, transport, routeError = false,
  onReorder, onRemove, onDurationChange, onTransportChange, onPreviewPlan,
}: Props) {
  const t = useTranslations('map.plan')
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const [errorDismissed, setErrorDismissed] = useState(false)

  function handleDragStart(i: number) { dragItem.current = i; setDragging(i) }
  function handleDragEnter(i: number) { dragOver.current = i }
  function handleDragEnd() {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      const ids = stops.map(s => s.place_id)
      const [moved] = ids.splice(dragItem.current, 1)
      ids.splice(dragOver.current, 0, moved)
      onReorder(ids)
    }
    dragItem.current = null
    dragOver.current = null
    setDragging(null)
  }

  const totalMin = stops.reduce((sum, s) => sum + (stopDurations[s.place_id] ?? 60), 0)
  const hrs  = Math.floor(totalMin / 60)
  const mins = totalMin % 60

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div
        className="px-sp-4 py-sp-3 flex items-center justify-between shrink-0"
        style={{ borderBottom: '1px solid var(--bdr)' }}
      >
        <p className="text-f-xxs font-semibold uppercase tracking-widest text-muted">
          {t('title')}
        </p>
        <span className="text-xs text-muted tabular-nums">
          {stops.length} {t('stops')}
        </span>
      </div>

      {/* ERR_03 — Route generation failure banner */}
      {routeError && !errorDismissed && (
        <div
          className="flex items-start gap-sp-2 px-sp-3 py-sp-2 shrink-0"
          style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', borderBottom: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
          role="alert"
        >
          <AlertTriangle size={14} strokeWidth={2} className="text-danger mt-0.5 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-f-xs text-danger leading-snug">{t('routeError')}</span>
          <button
            onClick={() => setErrorDismissed(true)}
            aria-label={t('routeRetry')}
            className="text-danger text-f-xs font-semibold shrink-0 hover:opacity-70 transition-opacity"
          >
            {t('routeRetry')}
          </button>
        </div>
      )}

      {/* Stop list — LP_11, LP_12, LP_13 */}
      <div className="flex-1 overflow-y-auto themed-scrollbar">
        {stops.map((poi, i) => {
          const name     = getDisplayName(poi)
          const duration = stopDurations[poi.place_id] ?? 60

          return (
            <div
              key={poi.place_id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              className={[
                'flex items-center gap-sp-2 px-sp-2 py-2 group transition-opacity',
                dragging === i ? 'opacity-40' : 'opacity-100',
              ].join(' ')}
              style={{ borderBottom: '1px solid var(--bdr)' }}
            >
              {/* LP_12 — Drag handle (visible on hover) */}
              <button
                aria-label={t('dragHandle', { n: i + 1 })}
                className="cursor-grab active:cursor-grabbing text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 min-w-[20px] min-h-[20px] flex items-center justify-center"
              >
                <GripVertical size={13} strokeWidth={2} />
              </button>

              {/* Stop number badge */}
              <span
                className="w-5 h-5 rounded-full bg-lav text-bg text-f-xxs font-bold flex items-center justify-center shrink-0 select-none"
                aria-hidden="true"
              >
                {i + 1}
              </span>

              {/* LP_11 — POI name */}
              <span className="flex-1 text-fg text-xs truncate min-w-0">{name}</span>

              {/* LP_13 — Duration */}
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min={5}
                  max={480}
                  value={duration}
                  onChange={e => onDurationChange(poi.place_id, Math.max(5, Math.min(480, Number(e.target.value) || 60)))}
                  aria-label={t('durationAriaLabel', { name })}
                  className="w-[42px] text-center text-xs text-fg bg-bg-3 rounded py-0.5 outline-none focus:ring-1 focus:ring-lav tabular-nums"
                  style={{ border: '1px solid var(--bdr)' }}
                />
                <span className="text-muted text-f-xxs">{t('durationLabel')}</span>
              </div>

              {/* Remove */}
              <button
                onClick={() => onRemove(poi.place_id)}
                aria-label={t('removeStop', { n: i + 1 })}
                className="text-muted hover:text-danger transition-colors shrink-0 min-w-touch min-h-touch flex items-center justify-center"
              >
                <X size={13} strokeWidth={2} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer — LP_14, LP_15, MP_23 */}
      <div
        className="p-sp-4 flex flex-col gap-sp-3 shrink-0"
        style={{ borderTop: '1px solid var(--bdr)' }}
      >
        {/* MP_23 — Total duration */}
        <div className="flex items-center gap-sp-2 text-muted text-xs">
          <Clock size={12} strokeWidth={2} aria-hidden="true" />
          <span>
            {hrs > 0 ? `${hrs}h ` : ''}{mins > 0 || hrs === 0 ? `${mins}m` : ''}{' '}{t('total')}
          </span>
        </div>

        {/* LP_14 — Transport mode */}
        <div
          className="flex gap-1.5"
          role="group"
          aria-label={t('transport.label')}
        >
          {(['car', 'public'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => onTransportChange(mode)}
              aria-pressed={transport === mode}
              className={[
                'flex-1 min-h-[32px] flex items-center justify-center gap-1',
                'rounded-lg text-xs font-medium transition-colors',
                transport === mode
                  ? 'bg-lav-dim text-lav'
                  : 'bg-overlay-10 text-muted hover:text-fg',
              ].join(' ')}
            >
              {mode === 'car'
                ? <><Car  size={12} strokeWidth={2} aria-hidden="true" />{t('transport.car')}</>
                : <><Bus  size={12} strokeWidth={2} aria-hidden="true" />{t('transport.public')}</>
              }
            </button>
          ))}
        </div>

        {/* LP_15 — Preview plan */}
        <button
          onClick={onPreviewPlan}
          className="w-full min-h-touch flex items-center justify-center bg-lav text-bg rounded-xl font-body font-semibold text-sm hover:opacity-90 active:opacity-75 transition-opacity"
        >
          {t('previewPlan')}
        </button>
      </div>
    </div>
  )
}
