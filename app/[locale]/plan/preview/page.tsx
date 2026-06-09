'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import {
  ArrowLeft, GripVertical, X, Car, Bus, Clock,
  Map, BookmarkPlus, Globe, AlertCircle, MapPin,
} from 'lucide-react'
import { getDraftPlan, saveDraftPlan, clearDraftPlan } from '@/lib/draft-plan'
import { getDisplayName } from '@/lib/display-name'
import type { MapPoi } from '@/hooks/useMapPois'

type Status = 'loading' | 'ready' | 'empty' | 'saving' | 'saved' | 'error'

export default function PlanPreviewPage() {
  const t      = useTranslations('planPreview')
  const router = useRouter()

  const [status,    setStatus]    = useState<Status>('loading')
  const [stops,     setStops]     = useState<MapPoi[]>([])
  const [durations, setDurations] = useState<Record<string, number>>({})
  const [transport, setTransport] = useState<'car' | 'public'>('public')
  const [name,      setName]      = useState('')
  const [saveError, setSaveError] = useState(false)

  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)
  const [dragging, setDragging]   = useState<number | null>(null)

  useEffect(() => {
    const draft = getDraftPlan()
    if (!draft || draft.stops.length === 0) {
      setStatus('empty')
      return
    }
    setStops(draft.stops)
    setDurations(draft.durations)
    setTransport(draft.transport)
    setName(draft.name ?? `${t('defaultName')} · ${new Date().toLocaleDateString()}`)
    setStatus('ready')
  }, [t])

  function handleDragStart(i: number) { dragItem.current = i; setDragging(i) }
  function handleDragEnter(i: number) { dragOver.current = i }
  function handleDragEnd() {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      const next = [...stops]
      const [moved] = next.splice(dragItem.current, 1)
      next.splice(dragOver.current, 0, moved)
      setStops(next)
    }
    dragItem.current = null
    dragOver.current = null
    setDragging(null)
  }

  function handleDurationChange(id: string, val: number) {
    setDurations(prev => ({ ...prev, [id]: Math.max(5, Math.min(480, val)) }))
  }

  function handleRemove(id: string) {
    setStops(prev => prev.filter(s => s.place_id !== id))
  }

  function handleEditOnMap() {
    saveDraftPlan({ stops, durations, transport, name })
    router.push('/map')
  }

  async function handleSave(publish: boolean) {
    setStatus('saving')
    setSaveError(false)
    try {
      const res = await fetch('/api/plans', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:        name,
          stops:        stops.map((s, i) => ({ poi_id: s.place_id, stop_order: i + 1, duration_min: durations[s.place_id] ?? 60 })),
          is_published: publish,
        }),
      })
      if (!res.ok) throw new Error('save_failed')
      clearDraftPlan()
      setStatus('saved')
    } catch {
      setSaveError(true)
      setStatus('ready')
    }
  }

  const totalMin = stops.reduce((sum, s) => sum + (durations[s.place_id] ?? 60), 0)
  const hrs      = Math.floor(totalMin / 60)
  const mins     = totalMin % 60

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-bg" aria-label={t('ariaLabel')} aria-busy="true">
        <header
          className="sticky top-0 z-10 bg-bg flex items-center gap-sp-3 px-sp-4 py-sp-3"
          style={{ borderBottom: '1px solid var(--bdr)' }}
        >
          <div className="w-8 h-8 rounded-full bg-muted-3 animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted-3 animate-pulse" />
        </header>
        <div className="max-w-2xl mx-auto px-sp-4 py-sp-6 space-y-sp-3">
          <div className="h-10 rounded-xl bg-muted-3 animate-pulse" />
          {[1, 2, 3].map(n => (
            <div key={n} className="h-14 rounded-xl bg-muted-3 animate-pulse" />
          ))}
        </div>
      </main>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (status === 'empty') {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-sp-4 py-sp-10" aria-label={t('ariaLabel')}>
        <MapPin size={40} strokeWidth={2} className="text-muted mb-sp-4" aria-hidden="true" />
        <h1 className="font-display font-bold text-fg text-xl mb-sp-2 text-center">{t('empty.title')}</h1>
        <p className="text-muted text-sm text-center mb-sp-6 max-w-xs">{t('empty.desc')}</p>
        <button
          onClick={() => router.push('/map')}
          className="min-h-touch px-sp-6 bg-lav text-bg rounded-xl font-semibold text-sm hover:opacity-90 active:opacity-75 transition-opacity"
        >
          {t('empty.cta')}
        </button>
      </main>
    )
  }

  // ── Saved confirmation ─────────────────────────────────────────────────
  if (status === 'saved') {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-sp-4 py-sp-10" aria-label={t('ariaLabel')}>
        <BookmarkPlus size={40} strokeWidth={2} className="text-success mb-sp-4" aria-hidden="true" />
        <h1 className="font-display font-bold text-fg text-xl mb-sp-2 text-center">{t('savedTitle')}</h1>
        <p className="text-muted text-sm text-center mb-sp-6 max-w-xs">{t('savedDesc')}</p>
        <div className="flex gap-sp-3">
          <button
            onClick={() => router.push('/saved')}
            className="min-h-touch px-sp-5 bg-lav text-bg rounded-xl font-semibold text-sm hover:opacity-90 active:opacity-75 transition-opacity"
          >
            {t('viewSaved')}
          </button>
          <button
            onClick={() => router.push('/map')}
            className="min-h-touch px-sp-5 bg-overlay-10 text-fg rounded-xl font-semibold text-sm hover:opacity-90 active:opacity-75 transition-opacity"
            style={{ border: '1px solid var(--bdr)' }}
          >
            {t('backToMap')}
          </button>
        </div>
      </main>
    )
  }

  // ── Ready / Saving ─────────────────────────────────────────────────────
  const isSaving = status === 'saving'

  return (
    <main className="min-h-screen bg-bg pb-sp-20" aria-label={t('ariaLabel')}>

      {/* Sticky header */}
      <header
        className="sticky top-0 z-10 bg-bg flex items-center gap-sp-3 px-sp-4 py-sp-3"
        style={{ borderBottom: '1px solid var(--bdr)' }}
      >
        <button
          onClick={() => router.back()}
          aria-label={t('back')}
          className="min-w-[32px] min-h-[32px] flex items-center justify-center text-muted hover:text-fg transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <h1 className="font-display font-bold text-fg text-base flex-1">{t('title')}</h1>
        <span className="text-xs text-muted tabular-nums">
          {stops.length} {t('stopsLabel')}
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-sp-4 pt-sp-6 space-y-sp-6">

        {/* Plan name */}
        <section aria-label={t('nameSection')}>
          <label
            htmlFor="plan-name"
            className="block text-[11px] font-semibold uppercase tracking-widest text-muted mb-sp-2"
          >
            {t('nameLabel')}
          </label>
          <input
            id="plan-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            disabled={isSaving}
            className="w-full min-h-touch px-sp-4 bg-bg-2 text-fg text-sm rounded-xl outline-none focus:ring-1 focus:ring-lav disabled:opacity-50"
            style={{ border: '1px solid var(--bdr)' }}
          />
        </section>

        {/* Stop list */}
        <section aria-label={t('stopsSection')}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-sp-2">
            {t('stopsSection')}
          </p>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--bdr)' }}
          >
            {stops.map((poi, i) => {
              const displayName = getDisplayName(poi)
              const duration    = durations[poi.place_id] ?? 60

              return (
                <div
                  key={poi.place_id}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragEnter={() => handleDragEnter(i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  className={[
                    'flex items-center gap-sp-2 px-sp-3 py-sp-3 bg-bg-2 group transition-opacity',
                    dragging === i ? 'opacity-40' : 'opacity-100',
                    i < stops.length - 1 ? 'border-b' : '',
                  ].join(' ')}
                  style={i < stops.length - 1 ? { borderBottomColor: 'var(--bdr)' } : undefined}
                >
                  {/* Drag handle */}
                  <button
                    aria-label={t('dragHandle', { n: i + 1 })}
                    disabled={isSaving}
                    className="cursor-grab active:cursor-grabbing text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 min-w-[20px] min-h-[20px] flex items-center justify-center disabled:cursor-default"
                  >
                    <GripVertical size={14} strokeWidth={2} />
                  </button>

                  {/* Stop number */}
                  <span
                    className="w-5 h-5 rounded-full bg-lav text-bg text-[10px] font-bold flex items-center justify-center shrink-0 select-none"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>

                  {/* POI name */}
                  <span className="flex-1 text-fg text-sm truncate min-w-0">{displayName}</span>

                  {/* Duration input */}
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={duration}
                      disabled={isSaving}
                      onChange={e => handleDurationChange(poi.place_id, Number(e.target.value) || 60)}
                      aria-label={t('durationAriaLabel', { name: displayName })}
                      className="w-[46px] text-center text-xs text-fg bg-bg-3 rounded py-1 outline-none focus:ring-1 focus:ring-lav tabular-nums disabled:opacity-50"
                      style={{ border: '1px solid var(--bdr)' }}
                    />
                    <span className="text-muted text-[10px]">{t('durationLabel')}</span>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(poi.place_id)}
                    disabled={isSaving}
                    aria-label={t('removeStop', { n: i + 1 })}
                    className="text-muted hover:text-danger transition-colors shrink-0 min-w-touch min-h-touch flex items-center justify-center disabled:opacity-40"
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              )
            })}

            {/* Ghost row when all stops removed */}
            {stops.length === 0 && (
              <div className="flex items-center justify-center px-sp-4 py-sp-6 bg-bg-2 text-muted text-sm">
                {t('noStops')}
              </div>
            )}
          </div>
        </section>

        {/* Transport + total */}
        <section aria-label={t('transportSection')}>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted mb-sp-2">
            {t('transportSection')}
          </p>

          <div
            className="flex gap-1.5 p-1.5 rounded-xl bg-bg-2"
            role="group"
            aria-label={t('transport.label')}
          >
            {(['car', 'public'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setTransport(mode)}
                disabled={isSaving}
                aria-pressed={transport === mode}
                className={[
                  'flex-1 min-h-[38px] flex items-center justify-center gap-sp-2',
                  'rounded-lg text-sm font-medium transition-colors',
                  transport === mode
                    ? 'bg-lav-dim text-lav'
                    : 'text-muted hover:text-fg',
                ].join(' ')}
              >
                {mode === 'car'
                  ? <><Car  size={14} strokeWidth={2} aria-hidden="true" />{t('transport.car')}</>
                  : <><Bus  size={14} strokeWidth={2} aria-hidden="true" />{t('transport.public')}</>
                }
              </button>
            ))}
          </div>

          {/* Total duration */}
          <div className="flex items-center gap-sp-2 mt-sp-3 text-muted text-xs">
            <Clock size={12} strokeWidth={2} aria-hidden="true" />
            <span>
              {hrs > 0 ? `${hrs}h ` : ''}{mins > 0 || hrs === 0 ? `${mins}m` : ''}{' '}{t('total')}
            </span>
          </div>
        </section>

        {/* Error banner */}
        {saveError && (
          <div
            className="flex items-center gap-sp-3 px-sp-4 py-sp-3 rounded-xl text-danger text-sm"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
            role="alert"
          >
            <AlertCircle size={16} strokeWidth={2} aria-hidden="true" />
            {t('saveError')}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-sp-3 pb-sp-4">

          {/* Edit on Map */}
          <button
            onClick={handleEditOnMap}
            disabled={isSaving}
            className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-overlay-10 text-fg rounded-xl font-semibold text-sm hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-40"
            style={{ border: '1px solid var(--bdr)' }}
          >
            <Map size={16} strokeWidth={2} aria-hidden="true" />
            {t('editOnMap')}
          </button>

          {/* Save (unpublished) */}
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving || stops.length === 0}
            className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-overlay-10 text-lav rounded-xl font-semibold text-sm hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-40"
            style={{ border: '1px solid var(--lav-border)' }}
          >
            <BookmarkPlus size={16} strokeWidth={2} aria-hidden="true" />
            {isSaving ? t('saving') : t('save')}
          </button>

          {/* Save & Publish */}
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving || stops.length === 0}
            className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-lav text-bg rounded-xl font-semibold text-sm hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-40"
          >
            <Globe size={16} strokeWidth={2} aria-hidden="true" />
            {isSaving ? t('saving') : t('savePublish')}
          </button>
        </div>

      </div>
    </main>
  )
}
