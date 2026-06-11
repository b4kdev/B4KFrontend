'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import {
  Bookmark, MapPin, Heart, Map, RefreshCw, AlertTriangle,
  ArrowLeft, Check, Sparkles, Loader2, FolderOpen,
} from 'lucide-react'
import { useSaved } from '@/hooks/useSaved'
import { getDisplayName } from '@/lib/display-name'
import { saveDraftPlan } from '@/lib/draft-plan'
import FolderCard from '@/components/saved/FolderCard'
import type { SavedFolder, SavedPoi } from '@/app/api/saved/route'
import type { MapPoi } from '@/hooks/useMapPois'

type Tab        = 'places' | 'itineraries'
type PlacesView = 'folders' | 'folder-detail' | 'folder-select'

function RowSkeleton() {
  return (
    <div className="flex items-center gap-sp-3 p-sp-4 animate-pulse" style={{ borderBottom: '1px solid var(--bdr)' }}>
      <div className="w-14 h-14 rounded-lg bg-muted-3 shrink-0" />
      <div className="flex-1 space-y-sp-2">
        <div className="h-4 w-2/3 rounded bg-muted-3" />
        <div className="h-3 w-1/3 rounded bg-muted-3" />
      </div>
    </div>
  )
}

function savedPoiToMapPoi(poi: SavedPoi): MapPoi {
  return {
    place_id:      poi.place_id,
    name_ko:       poi.name_ko,
    name_en:       poi.name_en,
    coords_lat:    0,
    coords_lng:    0,
    display_domain:  '',
    display_region:  poi.display_region,
    is_trending:   false,
    is_partner:    false,
    quality_score: poi.quality_score,
  }
}

export default function SavedPage() {
  const t      = useTranslations('saved')
  const router = useRouter()

  const [tab,              setTab]              = useState<Tab>('places')
  const [placesView,       setPlacesView]       = useState<PlacesView>('folders')
  const [activeFolder,     setActiveFolder]     = useState<SavedFolder | null>(null)
  const [selectedPoiIds,   setSelectedPoiIds]   = useState<Set<string>>(new Set())
  const [generating,       setGenerating]       = useState(false)
  const [generateError,    setGenerateError]    = useState(false)

  const { data, isLoading, isError, mutate } = useSaved()

  const tabClass = (active: boolean) => [
    'px-sp-4 py-sp-3 text-[13px] font-semibold tracking-[0.02em] transition-colors min-h-[44px] flex items-center -mb-px',
    active ? 'text-lav border-b-2 border-lav' : 'text-muted hover:text-fg',
  ].join(' ')

  function openFolder(folder: SavedFolder) {
    setActiveFolder(folder)
    setSelectedPoiIds(new Set())
    setPlacesView('folder-detail')
  }

  function enterSelectMode(folder: SavedFolder) {
    setActiveFolder(folder)
    setSelectedPoiIds(new Set(folder.pois.map(p => p.place_id)))
    setPlacesView('folder-select')
  }

  function togglePoi(id: string) {
    setSelectedPoiIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleAll() {
    if (!activeFolder) return
    const allIds = activeFolder.pois.map(p => p.place_id)
    if (selectedPoiIds.size === allIds.length) {
      setSelectedPoiIds(new Set())
    } else {
      setSelectedPoiIds(new Set(allIds))
    }
  }

  async function handleGenerate() {
    if (!activeFolder || selectedPoiIds.size === 0) return
    setGenerating(true)
    setGenerateError(false)

    const selectedPois = activeFolder.pois.filter(p => selectedPoiIds.has(p.place_id))

    try {
      const res = await fetch('/api/plans/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ poi_ids: selectedPois.map(p => p.place_id) }),
      })
      if (!res.ok) throw new Error('generate_failed')

      const generated = await res.json()
      const stops = selectedPois.map(p => savedPoiToMapPoi(p))
      const durations: Record<string, number> = {}
      generated.stops.forEach((s: { poi_id: string; duration_min: number }) => {
        durations[s.poi_id] = s.duration_min
      })

      saveDraftPlan({ stops, durations, transport: generated.transport ?? 'public' })
      router.push('/plan/preview')
    } catch {
      setGenerateError(true)
      setGenerating(false)
    }
  }

  function backToFolders() {
    setPlacesView('folders')
    setActiveFolder(null)
    setSelectedPoiIds(new Set())
    setGenerateError(false)
  }

  const allSelected = activeFolder
    ? selectedPoiIds.size === activeFolder.pois.length
    : false

  return (
    <main
      className="max-w-[1200px] mx-auto px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-20"
      aria-label={t('ariaLabel')}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg transition-colors">B4K</Link>
        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>

      <h1 className="font-display font-black text-fg text-[clamp(22px,2.5vw,32px)] mb-sp-5">
        {t('title')}
      </h1>

      {/* Tabs */}
      <nav
        className="flex gap-sp-1 mb-sp-4"
        style={{ borderBottom: '1px solid var(--bdr)' }}
        aria-label={t('tabs.ariaLabel')}
      >
        <button
          onClick={() => { setTab('places'); backToFolders() }}
          className={tabClass(tab === 'places')}
          aria-current={tab === 'places' ? 'page' : undefined}
        >
          {t('tabs.places')}
        </button>
        <button
          onClick={() => setTab('itineraries')}
          className={tabClass(tab === 'itineraries')}
          aria-current={tab === 'itineraries' ? 'page' : undefined}
        >
          {t('tabs.itineraries')}
        </button>
      </nav>

      {/* ── Loading ── */}
      {isLoading && (
        <div aria-busy="true" aria-label={t('loading')} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--bdr)' }}>
          {Array.from({ length: 3 }, (_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {/* ── Error ── */}
      {isError && !isLoading && (
        <div
          className="flex flex-col items-center justify-center text-center py-16 rounded-lg"
          style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
          role="alert"
        >
          <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
          <p className="text-[15px] font-semibold text-fg mb-sp-2">{t('error.title')}</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-sp-2 text-[13px] font-semibold text-lav hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
          >
            <RefreshCw size={14} strokeWidth={2} />{t('error.retry')}
          </button>
        </div>
      )}

      {/* ── Places tab ── */}
      {!isLoading && !isError && data && tab === 'places' && (

        // Folders list
        placesView === 'folders' ? (
          data.folders.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-lg"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
            >
              <FolderOpen size={40} strokeWidth={2} className="text-muted-2 mb-sp-4" />
              <p className="text-[16px] font-semibold text-fg mb-sp-2">{t('empty.places.title')}</p>
              <p className="text-[13px] text-muted max-w-[320px] mb-sp-5">{t('empty.places.desc')}</p>
              <Link
                href="/map"
                className="flex items-center gap-sp-2 px-sp-5 py-sp-3 rounded-lg text-[13px] font-semibold text-bg min-h-touch"
                style={{ background: 'var(--lav)' }}
              >
                <Map size={15} strokeWidth={2} />{t('empty.places.cta')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sp-4">
              {data.folders.map(folder => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onOpen={() => openFolder(folder)}
                  onGeneratePlan={() => enterSelectMode(folder)}
                />
              ))}
            </div>
          )

        // Folder detail — POI list + Generate Plan button
        ) : placesView === 'folder-detail' && activeFolder ? (
          <div>
            <button
              onClick={backToFolders}
              className="flex items-center gap-sp-2 text-muted hover:text-fg transition-colors text-sm mb-sp-4 min-h-touch"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              {t('folder.back')}
            </button>

            <div className="flex items-center justify-between mb-sp-4">
              <h2 className="font-display font-bold text-fg text-lg">{activeFolder.name}</h2>
              <span className="text-xs text-muted">
                {t('folder.poiCount', { count: activeFolder.pois.length })}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden mb-sp-4" style={{ border: '1px solid var(--bdr)' }}>
              {activeFolder.pois.map((poi, idx) => {
                const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
                return (
                  <div
                    key={poi.place_id}
                    className="flex items-center gap-sp-3 p-sp-4"
                    style={idx < activeFolder.pois.length - 1 ? { borderBottom: '1px solid var(--bdr)' } : undefined}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--bg-3)' }}>
                      <MapPin size={16} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-fg truncate">{name}</p>
                      <p className="text-[12px] text-muted mt-[2px]">{poi.display_region}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => enterSelectMode(activeFolder)}
              className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-lav text-bg rounded-xl font-semibold text-sm hover:opacity-90 active:opacity-75 transition-opacity"
            >
              <Sparkles size={16} strokeWidth={2} aria-hidden="true" />
              {t('folder.generatePlan')}
            </button>
          </div>

        // Folder select — checkbox mode
        ) : placesView === 'folder-select' && activeFolder ? (
          <div>
            <button
              onClick={() => setPlacesView('folder-detail')}
              className="flex items-center gap-sp-2 text-muted hover:text-fg transition-colors text-sm mb-sp-4 min-h-touch"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              {activeFolder.name}
            </button>

            <div className="flex items-center justify-between mb-sp-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
                {t('folder.selectHint')}
              </p>
              <button
                onClick={toggleAll}
                className="text-xs font-semibold text-lav hover:text-fg transition-colors min-h-touch px-sp-2"
              >
                {allSelected ? t('folder.deselectAll') : t('folder.selectAll')}
              </button>
            </div>

            <div className="rounded-xl overflow-hidden mb-sp-4" style={{ border: '1px solid var(--bdr)' }}>
              {activeFolder.pois.map((poi, idx) => {
                const name     = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
                const selected = selectedPoiIds.has(poi.place_id)
                return (
                  <button
                    key={poi.place_id}
                    onClick={() => togglePoi(poi.place_id)}
                    aria-pressed={selected}
                    aria-label={t('folder.selectAriaLabel', { name })}
                    className="w-full flex items-center gap-sp-3 p-sp-4 text-left hover:bg-bg-3 transition-colors"
                    style={idx < activeFolder.pois.length - 1 ? { borderBottom: '1px solid var(--bdr)' } : undefined}
                  >
                    <div
                      className={[
                        'w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors',
                        selected ? 'bg-lav' : 'bg-muted-3',
                      ].join(' ')}
                      style={selected ? undefined : { border: '1px solid var(--bdr)' }}
                      aria-hidden="true"
                    >
                      {selected && <Check size={12} strokeWidth={2} className="text-bg" />}
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--bg-3)' }}>
                      <MapPin size={16} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-fg truncate">{name}</p>
                      <p className="text-[12px] text-muted mt-[2px]">{poi.display_region}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {generateError && (
              <div
                className="flex items-center gap-sp-3 px-sp-4 py-sp-3 rounded-xl text-danger text-sm mb-sp-3"
                style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
                role="alert"
              >
                <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
                {t('folder.generateError')}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || selectedPoiIds.size === 0}
              className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-lav text-bg rounded-xl font-semibold text-sm hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-40"
            >
              {generating
                ? <><Loader2 size={16} strokeWidth={2} className="animate-spin" aria-hidden="true" />{t('folder.generating')}</>
                : <><Sparkles size={16} strokeWidth={2} aria-hidden="true" />{t('folder.generate', { count: selectedPoiIds.size })}</>
              }
            </button>
          </div>
        ) : null
      )}

      {/* ── Itineraries tab ── */}
      {!isLoading && !isError && data && tab === 'itineraries' && (
        data.plans.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-lg"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <Bookmark size={40} strokeWidth={2} className="text-muted-2 mb-sp-4" />
            <p className="text-[16px] font-semibold text-fg mb-sp-2">{t('empty.itineraries.title')}</p>
            <p className="text-[13px] text-muted max-w-[320px] mb-sp-5">{t('empty.itineraries.desc')}</p>
            <Link
              href="/map"
              className="flex items-center gap-sp-2 px-sp-5 py-sp-3 rounded-lg text-[13px] font-semibold text-bg min-h-touch"
              style={{ background: 'var(--lav)' }}
            >
              <Map size={15} strokeWidth={2} />{t('empty.itineraries.cta')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-sp-3">
            {data.plans.map(plan => (
              <Link
                key={plan.id}
                href={`/itinerary/${plan.id}`}
                className="flex items-start gap-sp-4 p-sp-4 rounded-lg transition-colors hover:bg-muted-3"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
                aria-label={t('plan.ariaLabel', { title: plan.title })}
              >
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--bg-3)' }}
                >
                  <MapPin size={22} strokeWidth={2} className="text-muted-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-fg leading-snug mb-[4px] line-clamp-2">
                    {plan.title}
                  </p>
                  <p className="text-[12px] text-muted mb-sp-2">{plan.author_name}</p>
                  <div className="flex items-center gap-sp-3 text-[11px] text-muted">
                    <span>{t('plan.stops', { count: plan.stop_count })}</span>
                    <span>·</span>
                    <span>{t('plan.days', { count: plan.duration_days })}</span>
                    <span>·</span>
                    <span className="flex items-center gap-[3px]">
                      <Heart size={11} strokeWidth={2} /> {plan.likes_count}
                    </span>
                  </div>
                </div>
                <Bookmark size={16} strokeWidth={2} className="text-lav shrink-0 mt-[2px]" />
              </Link>
            ))}
          </div>
        )
      )}
    </main>
  )
}
