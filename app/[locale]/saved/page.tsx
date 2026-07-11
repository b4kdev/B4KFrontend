'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import {
  Bookmark, MapPin, Heart, Map, RefreshCw, AlertTriangle,
  ArrowLeft, Check, Sparkles, Loader2, FolderOpen,
  Edit2, Share2, Trash2, FileText,
} from 'lucide-react'
import { useSaved } from '@/hooks/useSaved'
import { getDisplayName } from '@/lib/display-name'
import FolderCard from '@/components/saved/FolderCard'
import type { SavedFolder, SavedPoi } from '@/app/api/saved/route'

type Tab        = 'places' | 'myPlans' | 'savedPlans'
type PlacesView = 'folders' | 'folder-detail' | 'folder-select'

function RowSkeleton() {
  return (
    <div className="flex items-center gap-sp-3 p-sp-4 animate-pulse" style={{ borderBottom: '1px solid var(--bdr)' }}>
      <div className="w-14 h-14 rounded-none bg-muted-3 shrink-0" />
      <div className="flex-1 space-y-sp-2">
        <div className="h-4 w-2/3 rounded bg-muted-3" />
        <div className="h-3 w-1/3 rounded bg-muted-3" />
      </div>
    </div>
  )
}

function savedPoiToCoords(poi: SavedPoi) {
  return { ...poi, coords_lat: 0, coords_lng: 0, display_domain: '', is_trending: false, is_partner: false }
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
  const [unsavedPlanIds,   setUnsavedPlanIds]   = useState<Set<string>>(new Set())
  const [deletePlanId,     setDeletePlanId]     = useState<string | null>(null)

  const { data, isLoading, isError, mutate } = useSaved()

  const tabClass = (active: boolean) => [
    'px-sp-4 py-sp-3 text-f-md font-semibold tracking-[0.02em] transition-colors min-h-[44px] flex items-center -mb-px',
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
    setSelectedPoiIds(prev =>
      prev.size === allIds.length ? new Set() : new Set(allIds)
    )
  }

  async function handleGenerate() {
    if (!activeFolder || selectedPoiIds.size === 0) return
    setGenerating(true)
    setGenerateError(false)
    try {
      const res = await fetch('/api/plans/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ poi_ids: Array.from(selectedPoiIds) }),
      })
      if (!res.ok) throw new Error()
      const generated = await res.json()
      const planId = generated.plan?.id ?? generated.id
      if (planId) {
        router.push(`/itinerary/${planId}`)
      } else {
        throw new Error('no_plan_id')
      }
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

  function handleUnsave(planId: string) {
    setUnsavedPlanIds(prev => { const next = new Set(prev); next.add(planId); return next })
    fetch('/api/saved/plan', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plan_id: planId }),
    })
      .then(() => mutate())
      .catch(() => {})
  }

  const allSelected = activeFolder ? selectedPoiIds.size === activeFolder.pois.length : false

  const visibleSavedPlans = (data?.plans ?? []).filter(p => !unsavedPlanIds.has(p.id))

  return (
    <main
      className="max-w-[1200px] mx-auto px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-20"
      aria-label={t('ariaLabel')}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
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
          onClick={() => setTab('myPlans')}
          className={tabClass(tab === 'myPlans')}
          aria-current={tab === 'myPlans' ? 'page' : undefined}
        >
          {t('tabs.myPlans')}
        </button>
        <button
          onClick={() => setTab('savedPlans')}
          className={tabClass(tab === 'savedPlans')}
          aria-current={tab === 'savedPlans' ? 'page' : undefined}
        >
          {t('tabs.savedPlans')}
        </button>
      </nav>

      {/* ── Loading ── */}
      {isLoading && (
        <div aria-busy="true" aria-label={t('loading')} className="rounded-none overflow-hidden" style={{ border: '1px solid var(--bdr)' }}>
          {Array.from({ length: 3 }, (_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {/* ── Error ── */}
      {isError && !isLoading && (
        <div
          className="flex flex-col items-center justify-center text-center py-16 rounded-none"
          style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
          role="alert"
        >
          <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
          <p className="text-f-lg font-semibold text-fg mb-sp-2">{t('error.title')}</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-sp-2 text-f-md font-semibold text-lav hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
          >
            <RefreshCw size={14} strokeWidth={2} />{t('error.retry')}
          </button>
        </div>
      )}

      {/* ── Places tab ── */}
      {!isLoading && !isError && data && tab === 'places' && (

        placesView === 'folders' ? (
          data.folders.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-none"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
            >
              <FolderOpen size={40} strokeWidth={2} className="text-muted-2 mb-sp-4" />
              <p className="text-f-xl font-semibold text-fg mb-sp-2">{t('empty.places.title')}</p>
              <p className="text-f-md text-muted max-w-[320px] mb-sp-5">{t('empty.places.desc')}</p>
              <Link href="/map" className="flex items-center gap-sp-2 px-sp-5 py-sp-3 rounded-none text-f-md font-semibold text-bg min-h-touch" style={{ background: 'var(--lav)' }}>
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

        ) : placesView === 'folder-detail' && activeFolder ? (
          <div>
            <button onClick={backToFolders} className="flex items-center gap-sp-2 text-muted hover:text-fg transition-colors text-f-base mb-sp-4 min-h-touch">
              <ArrowLeft size={14} strokeWidth={2} />{t('folder.back')}
            </button>
            <div className="flex items-center justify-between mb-sp-4">
              <h2 className="font-display font-bold text-fg text-f-lg">{activeFolder.name}</h2>
              <span className="text-f-sm text-muted">{t('folder.poiCount', { count: activeFolder.pois.length })}</span>
            </div>
            <div className="rounded-none overflow-hidden mb-sp-4" style={{ border: '1px solid var(--bdr)' }}>
              {activeFolder.pois.map((poi, idx) => {
                const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
                return (
                  <div key={poi.place_id} className="flex items-center gap-sp-3 p-sp-4" style={idx < activeFolder.pois.length - 1 ? { borderBottom: '1px solid var(--bdr)' } : undefined}>
                    <div className="w-10 h-10 rounded-none flex items-center justify-center shrink-0" style={{ background: 'var(--bg-3)' }}>
                      <MapPin size={16} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-f-base font-semibold text-fg truncate">{name}</p>
                      <p className="text-f-sm text-muted mt-[2px]">{poi.display_region}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={() => enterSelectMode(activeFolder)} className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-lav text-bg rounded-none font-semibold text-f-base hover:opacity-90 active:opacity-75 transition-opacity">
              <Sparkles size={16} strokeWidth={2} aria-hidden="true" />{t('folder.generatePlan')}
            </button>
          </div>

        ) : placesView === 'folder-select' && activeFolder ? (
          <div>
            <button onClick={() => setPlacesView('folder-detail')} className="flex items-center gap-sp-2 text-muted hover:text-fg transition-colors text-f-base mb-sp-4 min-h-touch">
              <ArrowLeft size={14} strokeWidth={2} />{activeFolder.name}
            </button>
            <div className="flex items-center justify-between mb-sp-3">
              <p className="text-f-xs font-semibold uppercase tracking-widest text-muted">{t('folder.selectHint')}</p>
              <button onClick={toggleAll} className="text-f-sm font-semibold text-lav hover:text-fg transition-colors min-h-touch px-sp-2">
                {allSelected ? t('folder.deselectAll') : t('folder.selectAll')}
              </button>
            </div>
            <div className="rounded-none overflow-hidden mb-sp-4" style={{ border: '1px solid var(--bdr)' }}>
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
                    <div className={['w-5 h-5 rounded-none flex items-center justify-center shrink-0 transition-colors', selected ? 'bg-lav' : 'bg-muted-3'].join(' ')} style={selected ? undefined : { border: '1px solid var(--bdr)' }} aria-hidden="true">
                      {selected && <Check size={12} strokeWidth={2} className="text-bg" />}
                    </div>
                    <div className="w-10 h-10 rounded-none flex items-center justify-center shrink-0" style={{ background: 'var(--bg-3)' }}>
                      <MapPin size={16} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-f-base font-semibold text-fg truncate">{name}</p>
                      <p className="text-f-sm text-muted mt-[2px]">{poi.display_region}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {generateError && (
              <div className="flex items-center gap-sp-3 px-sp-4 py-sp-3 rounded-none text-danger text-f-base mb-sp-3" style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }} role="alert">
                <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />{t('folder.generateError')}
              </div>
            )}
            <button onClick={handleGenerate} disabled={generating || selectedPoiIds.size === 0} className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-lav text-bg rounded-none font-semibold text-f-base hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-40">
              {generating
                ? <><Loader2 size={16} strokeWidth={2} className="animate-spin" aria-hidden="true" />{t('folder.generating')}</>
                : <><Sparkles size={16} strokeWidth={2} aria-hidden="true" />{t('folder.generate', { count: selectedPoiIds.size })}</>
              }
            </button>
          </div>
        ) : null
      )}

      {/* ── My Plans tab (flow 39) ── */}
      {!isLoading && !isError && data && tab === 'myPlans' && (
        data.myPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-none" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
            <FileText size={40} strokeWidth={2} className="text-muted-2 mb-sp-4" />
            <p className="text-f-xl font-semibold text-fg mb-sp-2">{t('empty.myPlans.title')}</p>
            <p className="text-f-md text-muted max-w-[320px] mb-sp-5">{t('empty.myPlans.desc')}</p>
            <Link href="/map" className="flex items-center gap-sp-2 px-sp-5 py-sp-3 rounded-none text-f-md font-semibold text-bg min-h-touch" style={{ background: 'var(--lav)' }}>
              <Map size={15} strokeWidth={2} />{t('empty.myPlans.cta')}
            </Link>
          </div>
        ) : (
          <>
            {deletePlanId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-sp-4" role="dialog" aria-modal="true" aria-label={t('confirmDelete.title')}>
                <div className="absolute inset-0 bg-backdrop-50" onClick={() => setDeletePlanId(null)} aria-hidden="true" />
                <div className="relative bg-bg-2 rounded-none p-sp-6 max-w-sm w-full" style={{ border: '1px solid var(--bdr)' }}>
                  <h3 className="text-fg font-bold text-f-lg mb-sp-2">{t('confirmDelete.title')}</h3>
                  <p className="text-muted text-f-base mb-sp-5">{t('confirmDelete.desc')}</p>
                  <div className="flex gap-sp-3">
                    <button onClick={() => setDeletePlanId(null)} className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-muted hover:text-fg transition-colors" style={{ border: '1px solid var(--bdr)' }}>
                      {t('confirmDelete.cancel')}
                    </button>
                    <button
                      onClick={() => {
                        const id = deletePlanId
                        setDeletePlanId(null)
                        fetch(`/api/plans/${id}`, { method: 'DELETE' })
                          .then(() => mutate())
                          .catch(() => {})
                      }}
                      className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-bg"
                      style={{ background: 'var(--danger)' }}
                    >
                      {t('confirmDelete.confirm')}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-sp-3">
              {data.myPlans.map(plan => (
                <div
                  key={plan.id}
                  className="flex items-start gap-sp-4 p-sp-4 rounded-none"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
                >
                  <Link
                    href={`/itinerary/${plan.id}`}
                    className="w-16 h-16 rounded-none flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--bg-3)' }}
                    aria-label={t('myPlan.ariaLabel', { title: plan.title })}
                  >
                    <MapPin size={22} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sp-2 mb-[4px]">
                      <Link href={`/itinerary/${plan.id}`} className="text-f-base font-semibold text-fg leading-snug line-clamp-1 hover:text-lav transition-colors">
                        {plan.title}
                      </Link>
                      {plan.is_draft && (
                        <span className="shrink-0 px-[6px] py-[2px] rounded-full text-f-xxs font-semibold text-warning" style={{ background: 'color-mix(in srgb, var(--warning) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)' }}>
                          {t('myPlan.draft')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-sp-3 text-f-xs text-muted mb-sp-3">
                      <span>{t('plan.stops', { count: plan.stop_count })}</span>
                      <span>·</span>
                      <span>{t('plan.days', { count: plan.duration_days })}</span>
                      <span>·</span>
                      <span className="flex items-center gap-[3px]"><Heart size={11} strokeWidth={2} /> {plan.likes_count}</span>
                    </div>
                    <div className="flex items-center gap-sp-2">
                      <Link
                        href={`/map?plan=${plan.id}`}
                        aria-label={t('myPlan.editAriaLabel', { title: plan.title })}
                        className="flex items-center gap-[4px] text-f-xs font-semibold text-lav hover:opacity-70 transition-opacity min-h-[28px] px-sp-2 rounded-none"
                        style={{ border: '1px solid var(--lav-border)' }}
                      >
                        <Edit2 size={11} strokeWidth={2} aria-hidden="true" />
                        {t('myPlan.edit')}
                      </Link>
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/itinerary/${plan.id}`
                          await navigator.clipboard.writeText(url).catch(() => {})
                        }}
                        aria-label={t('myPlan.shareAriaLabel', { title: plan.title })}
                        className="flex items-center gap-[4px] text-f-xs font-semibold text-muted hover:text-fg transition-colors min-h-[28px] px-sp-2"
                      >
                        <Share2 size={11} strokeWidth={2} aria-hidden="true" />
                        {t('myPlan.share')}
                      </button>
                      <button
                        onClick={() => setDeletePlanId(plan.id)}
                        aria-label={t('myPlan.deleteAriaLabel', { title: plan.title })}
                        className="flex items-center gap-[4px] text-f-xs font-semibold text-muted hover:text-danger transition-colors min-h-[28px] px-sp-2 ml-auto"
                      >
                        <Trash2 size={11} strokeWidth={2} aria-hidden="true" />
                        {t('myPlan.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* ── Saved Plans tab (flow 40) ── */}
      {!isLoading && !isError && data && tab === 'savedPlans' && (
        visibleSavedPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-none" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
            <Bookmark size={40} strokeWidth={2} className="text-muted-2 mb-sp-4" />
            <p className="text-f-xl font-semibold text-fg mb-sp-2">{t('empty.savedPlans.title')}</p>
            <p className="text-f-md text-muted max-w-[320px] mb-sp-5">{t('empty.savedPlans.desc')}</p>
            <Link href="/map" className="flex items-center gap-sp-2 px-sp-5 py-sp-3 rounded-none text-f-md font-semibold text-bg min-h-touch" style={{ background: 'var(--lav)' }}>
              <Map size={15} strokeWidth={2} />{t('empty.savedPlans.cta')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-sp-3">
            {visibleSavedPlans.map(plan => (
              <div
                key={plan.id}
                className="flex items-start gap-sp-4 p-sp-4 rounded-none"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
              >
                <Link
                  href={`/itinerary/${plan.id}`}
                  className="w-16 h-16 rounded-none flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--bg-3)' }}
                  aria-label={t('plan.ariaLabel', { title: plan.title })}
                >
                  <MapPin size={22} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/itinerary/${plan.id}`} className="block text-f-base font-semibold text-fg leading-snug mb-[4px] line-clamp-2 hover:text-lav transition-colors">
                    {plan.title}
                  </Link>
                  <p className="text-f-sm text-muted mb-sp-2">{plan.author_name}</p>
                  <div className="flex items-center gap-sp-3 text-f-xs text-muted">
                    <span>{t('plan.stops', { count: plan.stop_count })}</span>
                    <span>·</span>
                    <span>{t('plan.days', { count: plan.duration_days })}</span>
                    <span>·</span>
                    <span className="flex items-center gap-[3px]"><Heart size={11} strokeWidth={2} /> {plan.likes_count}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleUnsave(plan.id)}
                  aria-label={t('unsave.ariaLabel', { title: plan.title })}
                  className="text-lav hover:text-muted transition-colors min-w-touch min-h-touch flex items-center justify-center shrink-0"
                  title={t('unsave.label')}
                >
                  <Bookmark size={16} strokeWidth={2} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </main>
  )
}
