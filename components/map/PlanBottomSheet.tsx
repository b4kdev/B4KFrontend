'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { GripVertical, X, Car, Bus, Clock, ArrowRight, AlertTriangle } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import { saveDraftPlan } from '@/lib/draft-plan'
import type { MapPoi } from '@/hooks/useMapPois'

interface Props {
  isOpen:           boolean
  stops:            MapPoi[]
  stopDurations:    Record<string, number>
  transport:        'car' | 'public'
  onReorder:        (newOrder: string[]) => void
  onRemove:         (id: string) => void
  onDurationChange: (id: string, minutes: number) => void
  onTransportChange:(mode: 'car' | 'public') => void
  onDismiss:        () => void
}

export default function PlanBottomSheet({
  isOpen, stops, stopDurations, transport,
  onReorder, onRemove, onDurationChange, onTransportChange, onDismiss,
}: Props) {
  const t      = useTranslations('map.plan')
  const router = useRouter()

  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const [routeError, setRouteError] = useState(false)

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

  function handlePreviewPlan() {
    try {
      setRouteError(false)
      const durations: Record<string, number> = {}
      stops.forEach(s => { durations[s.place_id] = stopDurations[s.place_id] ?? 60 })
      saveDraftPlan({ stops, durations, transport })
      router.push('/plan/preview')
    } catch {
      setRouteError(true)
    }
  }

  const totalMin = stops.reduce((sum, s) => sum + (stopDurations[s.place_id] ?? 60), 0)
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
          'lg:hidden fixed bottom-14 left-0 right-0 z-40 bg-bg-2 rounded-t-2xl',
          'transition-transform duration-300 ease-out max-h-[70vh] flex flex-col',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ borderTop: '1px solid var(--bdr)' }}
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
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
            {t('title')}
          </p>
          <div className="flex items-center gap-sp-3">
            <span className="text-xs text-muted tabular-nums">
              {stops.length} {t('stops')}
            </span>
            <button
              onClick={onDismiss}
              aria-label={t('close')}
              className="min-w-[28px] min-h-[28px] flex items-center justify-center text-muted hover:text-fg transition-colors"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Stop list */}
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
                  className="w-5 h-5 rounded-full bg-lav text-bg text-[10px] font-bold flex items-center justify-center shrink-0 select-none"
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
                    onChange={e => onDurationChange(poi.place_id, Math.max(5, Math.min(480, Number(e.target.value) || 60)))}
                    aria-label={t('durationAriaLabel', { name })}
                    className="w-[42px] text-center text-xs text-fg bg-bg-3 rounded py-0.5 outline-none focus:ring-1 focus:ring-lav tabular-nums"
                    style={{ border: '1px solid var(--bdr)' }}
                  />
                  <span className="text-muted text-[10px]">{t('durationLabel')}</span>
                </div>

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

        {/* ERR_03 — Route generation failure */}
        {routeError && (
          <div
            className="flex items-center gap-sp-2 px-sp-4 py-sp-2 shrink-0"
            style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', borderTop: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
            role="alert"
          >
            <AlertTriangle size={13} strokeWidth={2} className="text-danger shrink-0" aria-hidden="true" />
            <span className="flex-1 text-[11px] text-danger">{t('routeError')}</span>
            <button
              onClick={handlePreviewPlan}
              className="text-[11px] font-semibold text-danger hover:opacity-70 transition-opacity"
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

          {/* Transport toggle */}
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

          {/* Preview Plan CTA */}
          <button
            onClick={handlePreviewPlan}
            disabled={stops.length === 0}
            className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-lav text-bg rounded-xl font-semibold text-sm hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-40"
          >
            {t('previewPlan')}
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  )
}
