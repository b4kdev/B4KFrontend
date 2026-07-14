'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import {
  Bookmark, MapPin, Heart, Map, RefreshCw, AlertTriangle,
  ArrowLeft, Sparkles, FolderOpen, FolderPlus,
  Edit2, Share2, Trash2, FileText,
} from 'lucide-react'
import { useSaved } from '@/hooks/useSaved'
import { useAuthGate } from '@/contexts/AuthGateContext'
import { useOnline } from '@/hooks/useOnline'
import { getDisplayName } from '@/lib/display-name'
import FolderCard from '@/components/saved/FolderCard'
import type { SavedFolder } from '@/app/api/saved/route'

type Tab        = 'places' | 'myPlans' | 'savedPlans'
type PlacesView = 'folders' | 'folder-detail'

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


export default function SavedPage() {
  const t      = useTranslations('saved')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const { open: openAuthGate } = useAuthGate()
  const isOnline = useOnline() // SC-21 (OFF_03)

  const [tab,              setTab]              = useState<Tab>('places')
  const [placesView,       setPlacesView]       = useState<PlacesView>('folders')
  const [activeFolder,     setActiveFolder]     = useState<SavedFolder | null>(null)
  const [generating,       setGenerating]       = useState(false)
  const [generateError,    setGenerateError]    = useState(false)
  const [unsavedPlanIds,   setUnsavedPlanIds]   = useState<Set<string>>(new Set())
  const [deletePlanId,     setDeletePlanId]     = useState<string | null>(null)

  // M5 — FL2 folder-level multi-select (DEC-24)
  const [selectMode,       setSelectMode]       = useState(false)
  const [selectedFolderIds,setSelectedFolderIds]= useState<Set<string>>(new Set())
  // UF-3 — optimistic removal of a saved POI from the folder-detail list
  const [removingPoiIds,   setRemovingPoiIds]   = useState<Set<string>>(new Set())
  // M4 — folder CRUD
  const [newFolderOpen,    setNewFolderOpen]    = useState(false)
  const [newFolderName,    setNewFolderName]    = useState('')
  const [renameFolder,     setRenameFolder]     = useState<SavedFolder | null>(null)
  const [renameValue,      setRenameValue]      = useState('')
  const [deleteFolder,     setDeleteFolder]     = useState<SavedFolder | null>(null)
  const [crudBusy,         setCrudBusy]         = useState(false)

  const { data, isLoading, isError, mutate } = useSaved()

  // GAP H8 — proactive auth gate when unauthenticated
  useEffect(() => {
    if (!loading && !user) {
      openAuthGate('saved_tab')
    }
  }, [loading, user, openAuthGate])

  // GAP H17 — ?select=1 URL param → auto-enter folder-select mode (M5)
  useEffect(() => {
    if (searchParams.get('select') !== '1') return
    if (!data?.folders || data.folders.length === 0) return
    if (placesView !== 'folders' || selectMode) return
    enterSelectMode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, data?.folders])

  const tabClass = (active: boolean) => [
    'px-sp-4 py-sp-3 text-f-md font-semibold tracking-[0.02em] transition-colors min-h-[44px] flex items-center -mb-px',
    active ? 'text-lav border-b-2 border-lav' : 'text-muted hover:text-fg',
  ].join(' ')

  function openFolder(folder: SavedFolder) {
    setActiveFolder(folder)
    setPlacesView('folder-detail')
  }

  // M5 — folder-level select (FL2). enterSelect(folder) pre-selects one folder
  // (used by the folder-detail "Generate plan" shortcut + ?select=1).
  function enterSelectMode(folder?: SavedFolder) {
    setSelectMode(true)
    setSelectedFolderIds(new Set(folder ? [folder.id] : []))
    setGenerateError(false)
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedFolderIds(new Set())
    setGenerateError(false)
  }

  function toggleFolderSelect(id: string) {
    setSelectedFolderIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleGenerate() {
    if (selectedFolderIds.size === 0 || !data?.folders) return
    // union of POIs across the selected folders
    const poiIds = Array.from(new Set(
      data.folders
        .filter(f => selectedFolderIds.has(f.id))
        .flatMap(f => f.pois.map(p => p.place_id)),
    ))
    if (poiIds.length === 0) { setGenerateError(true); return }
    setGenerating(true)
    setGenerateError(false)
    try {
      const res = await fetch('/api/plans/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ folder_ids: Array.from(selectedFolderIds), poi_ids: poiIds }),
      })
      if (!res.ok) throw new Error()
      const generated = await res.json()
      const planId = generated.plan?.id ?? generated.id
      if (planId) router.push(`/plan/${planId}`)
      else throw new Error('no_plan_id')
    } catch {
      setGenerateError(true)
      setGenerating(false)
    }
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim()
    if (!name || crudBusy) return
    setCrudBusy(true)
    try {
      const res = await fetch('/api/folders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error()
      await mutate()
      setNewFolderOpen(false)
      setNewFolderName('')
    } catch { /* keep input open on failure */ } finally { setCrudBusy(false) }
  }

  async function handleRenameFolder() {
    const name = renameValue.trim()
    if (!renameFolder || !name || crudBusy) return
    setCrudBusy(true)
    try {
      const res = await fetch(`/api/folders/${renameFolder.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error()
      await mutate()
      setRenameFolder(null)
      setRenameValue('')
    } catch { /* keep modal open */ } finally { setCrudBusy(false) }
  }

  async function handleDeleteFolder() {
    if (!deleteFolder || crudBusy) return
    setCrudBusy(true)
    try {
      // server moves the folder's POIs back to "All Saved" (DEC-24)
      const res = await fetch(`/api/folders/${deleteFolder.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await mutate()
      setDeleteFolder(null)
    } catch { /* keep modal open */ } finally { setCrudBusy(false) }
  }

  function backToFolders() {
    setPlacesView('folders')
    setActiveFolder(null)
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

  // UF-3 — remove a saved POI (optimistic → DELETE → mutate, revert on failure)
  function handleRemovePoi(placeId: string) {
    if (removingPoiIds.has(placeId)) return
    setRemovingPoiIds(prev => { const next = new Set(prev); next.add(placeId); return next })
    fetch('/api/saved/poi', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ place_id: placeId }),
    })
      .then(res => { if (!res.ok) throw new Error(); return mutate() })
      .catch(() => {
        setRemovingPoiIds(prev => { const next = new Set(prev); next.delete(placeId); return next })
      })
  }

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
          <div>
            {/* Header: New folder · Create plan (folder-select) */}
            <div className="flex items-center justify-between gap-sp-2 mb-sp-4 min-h-touch">
              {selectMode ? (
                <>
                  <p className="text-f-sm font-semibold text-muted">{t('folder.selectFoldersHint')}</p>
                  <button onClick={exitSelectMode} className="text-f-sm font-semibold text-muted hover:text-fg transition-colors min-h-touch px-sp-2">
                    {t('folder.cancel')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setNewFolderOpen(v => !v)}
                    className="flex items-center gap-sp-2 text-f-sm font-semibold text-lav hover:opacity-80 transition-opacity min-h-touch"
                  >
                    <FolderPlus size={16} strokeWidth={2} aria-hidden="true" />{t('folder.newFolder')}
                  </button>
                  {data.folders.length > 0 && (
                    <button
                      onClick={() => enterSelectMode()}
                      className="flex items-center gap-sp-2 text-f-sm font-semibold text-lav hover:opacity-80 transition-opacity min-h-touch"
                    >
                      <Sparkles size={16} strokeWidth={2} aria-hidden="true" />{t('folder.createPlan')}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* New folder inline input */}
            {newFolderOpen && !selectMode && (
              <div className="flex gap-sp-2 mb-sp-4">
                <input
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder() }}
                  placeholder={t('folder.newFolderPlaceholder')}
                  maxLength={50}
                  autoFocus
                  aria-label={t('folder.newFolderPlaceholder')}
                  className="flex-1 min-h-touch px-sp-3 rounded-none bg-bg-3 text-f-base text-fg outline-none focus:ring-1 focus:ring-lav-border"
                  style={{ border: '1px solid var(--bdr)' }}
                />
                <button onClick={handleCreateFolder} disabled={!newFolderName.trim() || crudBusy} className="min-h-touch px-sp-4 rounded-none bg-lav text-bg text-f-sm font-semibold disabled:opacity-40">
                  {t('folder.create')}
                </button>
              </div>
            )}

            {data.folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-none" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
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
                    selectMode={selectMode}
                    selected={selectedFolderIds.has(folder.id)}
                    onOpen={() => openFolder(folder)}
                    onToggleSelect={() => toggleFolderSelect(folder.id)}
                    onRename={() => { setRenameFolder(folder); setRenameValue(folder.name) }}
                    onDelete={() => setDeleteFolder(folder)}
                  />
                ))}
              </div>
            )}

            {/* Generate bar (folder-select) */}
            {selectMode && (
              <div className="sticky bottom-sp-4 mt-sp-4">
                {generateError && (
                  <div className="flex items-center gap-sp-3 px-sp-4 py-sp-3 rounded-none text-danger text-f-base mb-sp-3" style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }} role="alert">
                    <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />{t('folder.generateError')}
                  </div>
                )}
                {/* SC-21 (OFF_03) — a write action; disabled with an explicit reason when offline */}
                {!isOnline && (
                  <p className="text-f-sm text-muted text-center mb-sp-2">{t('folder.offlineNote')}</p>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={generating || selectedFolderIds.size === 0 || !isOnline}
                  className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-lav text-bg rounded-none font-semibold text-f-base hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-40"
                >
                  {generating
                    ? <span className="font-mono">{t('folder.generating')}</span>
                    : <><Sparkles size={16} strokeWidth={2} aria-hidden="true" />{t('folder.generateFolders', { count: selectedFolderIds.size })}</>}
                </button>
              </div>
            )}
          </div>

        ) : placesView === 'folder-detail' && activeFolder ? (
          (() => {
            const visiblePois = activeFolder.pois.filter(p => !removingPoiIds.has(p.place_id))
            return (
          <div>
            <button onClick={backToFolders} className="flex items-center gap-sp-2 text-muted hover:text-fg transition-colors text-f-base mb-sp-4 min-h-touch">
              <ArrowLeft size={14} strokeWidth={2} />{t('folder.back')}
            </button>
            <div className="flex items-center justify-between mb-sp-4">
              <h2 className="font-display font-bold text-fg text-f-lg">{activeFolder.name}</h2>
              <span className="text-f-sm text-muted">{t('folder.poiCount', { count: visiblePois.length })}</span>
            </div>
            <div className="rounded-none overflow-hidden mb-sp-4" style={{ border: '1px solid var(--bdr)' }}>
              {visiblePois.map((poi, idx) => {
                const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
                return (
                  <div key={poi.place_id} className="flex items-center gap-sp-3 p-sp-4" style={idx < visiblePois.length - 1 ? { borderBottom: '1px solid var(--bdr)' } : undefined}>
                    <div className="w-10 h-10 rounded-none flex items-center justify-center shrink-0" style={{ background: 'var(--bg-3)' }}>
                      <MapPin size={16} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-f-base font-semibold text-fg truncate">{name}</p>
                      <p className="text-f-sm text-muted mt-[2px]">{poi.display_region}</p>
                    </div>
                    <button
                      onClick={() => handleRemovePoi(poi.place_id)}
                      aria-label={t('poi.removeAriaLabel', { name })}
                      title={t('poi.removeLabel')}
                      className="min-w-touch min-h-touch flex items-center justify-center shrink-0 text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => { setPlacesView('folders'); enterSelectMode(activeFolder) }}
              disabled={visiblePois.length === 0}
              className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-lav text-bg rounded-none font-semibold text-f-base hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-40"
            >
              <Sparkles size={16} strokeWidth={2} aria-hidden="true" />{t('folder.generatePlan')}
            </button>
          </div>
            )
          })()
        ) : null
      )}

      {/* M4 — rename folder modal */}
      {renameFolder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-sp-4" style={{ background: 'var(--backdrop-50)' }} role="dialog" aria-modal="true" aria-label={t('folder.renameTitle')}>
          <div className="w-full max-w-[360px] rounded-none p-sp-6 flex flex-col gap-sp-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
            <p className="text-f-lg font-semibold text-fg">{t('folder.renameTitle')}</p>
            <input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameFolder() }}
              maxLength={50}
              autoFocus
              aria-label={t('folder.renameTitle')}
              className="w-full min-h-touch px-sp-3 rounded-none bg-bg-3 text-f-base text-fg outline-none focus:ring-1 focus:ring-lav-border"
              style={{ border: '1px solid var(--bdr)' }}
            />
            <div className="flex gap-sp-3">
              <button onClick={() => setRenameFolder(null)} className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-muted hover:text-fg transition-colors" style={{ border: '1px solid var(--bdr)' }}>
                {t('folder.deleteCancel')}
              </button>
              <button onClick={handleRenameFolder} disabled={!renameValue.trim() || crudBusy} className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-bg bg-lav disabled:opacity-40">
                {t('folder.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* M4 — delete folder confirm */}
      {deleteFolder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-sp-4" style={{ background: 'var(--backdrop-50)' }} role="dialog" aria-modal="true" aria-label={t('folder.deleteTitle')}>
          <div className="w-full max-w-[360px] rounded-none p-sp-6 flex flex-col gap-sp-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
            <div className="flex items-start gap-sp-3">
              <AlertTriangle size={20} strokeWidth={2} className="text-danger shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-f-lg font-semibold text-fg">{t('folder.deleteTitle')}</p>
                <p className="text-f-md text-muted mt-sp-2">{t('folder.deleteWarning', { name: deleteFolder.name })}</p>
              </div>
            </div>
            <div className="flex gap-sp-3">
              <button onClick={() => setDeleteFolder(null)} className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-muted hover:text-fg transition-colors" style={{ border: '1px solid var(--bdr)' }}>
                {t('folder.deleteCancel')}
              </button>
              <button onClick={handleDeleteFolder} disabled={crudBusy} className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-fg disabled:opacity-40" style={{ background: 'var(--danger)' }}>
                {t('folder.delete')}
              </button>
            </div>
          </div>
        </div>
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
                    href={`/plan/${plan.id}`}
                    className="w-16 h-16 rounded-none flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--bg-3)' }}
                    aria-label={t('myPlan.ariaLabel', { title: plan.title })}
                  >
                    <MapPin size={22} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sp-2 mb-[4px]">
                      <Link href={`/plan/${plan.id}`} className="text-f-base font-semibold text-fg leading-snug line-clamp-1 hover:text-lav transition-colors">
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
                          const url = `${window.location.origin}/plan/${plan.id}`
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
                  href={`/plan/${plan.id}`}
                  className="w-16 h-16 rounded-none flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--bg-3)' }}
                  aria-label={t('plan.ariaLabel', { title: plan.title })}
                >
                  <MapPin size={22} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/plan/${plan.id}`} className="block text-f-base font-semibold text-fg leading-snug mb-[4px] line-clamp-2 hover:text-lav transition-colors">
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
