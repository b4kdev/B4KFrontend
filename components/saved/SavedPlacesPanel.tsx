'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useRouter, Link } from '@/i18n/navigation'
import {
  MapPin, Map, RefreshCw, AlertTriangle,
  ArrowLeft, Sparkles, FolderOpen, FolderPlus, Trash2,
} from 'lucide-react'
import { useSaved } from '@/hooks/useSaved'
import { useOnline } from '@/hooks/useOnline'
import { getDisplayName } from '@/lib/display-name'
import FolderCard from '@/components/saved/FolderCard'
import type { SavedFolder } from '@/app/api/saved/route'

type PlacesView = 'folders' | 'folder-detail'

// Matches FolderCard.tsx's actual shape (aspect-[2/1] thumbnail grid + title/count
// text block) — a flat list-row skeleton here would mismatch the real grid-of-cards
// content and register as layout shift the instant useSaved() resolves.
function FolderCardSkeleton() {
  return (
    <div className="rounded-none overflow-hidden bg-bg-2 flex flex-col animate-pulse" style={{ border: '1px solid var(--bdr)' }}>
      <div className="w-full aspect-[2/1] bg-muted-3" />
      <div className="px-sp-3 pt-sp-3 pb-sp-3">
        <div className="h-4 w-2/3 rounded bg-muted-3" />
        <div className="h-3 w-1/3 rounded bg-muted-3 mt-sp-2" />
      </div>
    </div>
  )
}

// SPEC-08 Folder List view + SPEC-09 Saved Tab ("Own profile: Full CRUD on
// folders. FL2 entry from here.") — the two specs describe identical behavior
// for the logged-in owner, so this is one component reused at both `/saved`
// and `/profile` (own) Saved tab rather than two parallel implementations.
export default function SavedPlacesPanel() {
  const t      = useTranslations('saved')
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnline = useOnline() // SC-21 (OFF_03)

  const [placesView,       setPlacesView]       = useState<PlacesView>('folders')
  const [activeFolder,     setActiveFolder]     = useState<SavedFolder | null>(null)
  const [generating,       setGenerating]       = useState(false)
  const [generateError,    setGenerateError]    = useState(false)

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

  // GAP H17 — ?select=1 URL param → auto-enter folder-select mode (M5)
  useEffect(() => {
    if (searchParams.get('select') !== '1') return
    if (!data?.folders || data.folders.length === 0) return
    if (placesView !== 'folders' || selectMode) return
    enterSelectMode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, data?.folders])

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
        .flatMap(f => f.pois.map(p => p.poi_id)),
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
      // BFF deletes the folder's saved POIs along with it (backend gap vs DEC-24's
      // "move to All Saved" — see app/api/folders/[id]/route.ts comment). UI copy
      // corrected to warn accurately instead of promising a move that doesn't happen.
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

  // UF-3 — remove a saved POI (optimistic → DELETE → mutate, revert on failure)
  function handleRemovePoi(placeId: string) {
    if (removingPoiIds.has(placeId)) return
    setRemovingPoiIds(prev => { const next = new Set(prev); next.add(placeId); return next })
    fetch('/api/saved/poi', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ poi_id: placeId }),
    })
      .then(res => { if (!res.ok) throw new Error(); return mutate() })
      .catch(() => {
        setRemovingPoiIds(prev => { const next = new Set(prev); next.delete(placeId); return next })
      })
  }

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label={t('loading')} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sp-4">
        {Array.from({ length: 3 }, (_, i) => <FolderCardSkeleton key={i} />)}
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center py-16 rounded-none"
        style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
        role="alert"
      >
        <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
        <p className="text-f-lg font-semibold text-fg mb-sp-2">{t('error.title')}</p>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-sp-2 text-f-md font-semibold text-fg hover:opacity-80 transition-opacity mt-sp-2 min-h-touch px-sp-4"
        >
          <RefreshCw size={14} strokeWidth={2} />{t('error.retry')}
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <>
      {placesView === 'folders' ? (
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
                  className="flex items-center gap-sp-2 text-f-sm font-semibold text-fg hover:opacity-80 transition-opacity min-h-touch"
                >
                  <FolderPlus size={16} strokeWidth={2} aria-hidden="true" />{t('folder.newFolder')}
                </button>
                {data.folders.length > 0 && (
                  <button
                    onClick={() => enterSelectMode()}
                    className="flex items-center gap-sp-2 text-f-sm font-semibold text-fg hover:opacity-80 transition-opacity min-h-touch"
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
                className="flex-1 min-h-touch px-sp-3 rounded-none bg-bg-3 text-f-base text-fg outline-none focus:ring-1 focus:ring-fg"
                style={{ border: '1px solid var(--bdr)' }}
              />
              <button onClick={handleCreateFolder} disabled={!newFolderName.trim() || crudBusy} className="min-h-touch px-sp-4 rounded-none bg-fg text-bg text-f-sm font-semibold disabled:opacity-40">
                {t('folder.create')}
              </button>
            </div>
          )}

          {data.folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-none" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
              <FolderOpen size={40} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-4" />
              <p className="text-f-xl font-semibold text-fg mb-sp-2">{t('empty.places.title')}</p>
              <p className="text-f-md text-muted max-w-[320px] mb-sp-5">{t('empty.places.desc')}</p>
              <Link href="/map" className="flex items-center gap-sp-2 px-sp-5 py-sp-3 rounded-none text-f-md font-semibold text-bg bg-fg min-h-touch">
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
                className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-fg text-bg rounded-none font-semibold text-f-base hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-40"
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
          const visiblePois = activeFolder.pois.filter(p => !removingPoiIds.has(p.poi_id))
          return (
            <div>
              <button onClick={backToFolders} className="flex items-center gap-sp-2 text-muted hover:text-fg transition-colors text-f-base mb-sp-4 min-h-touch">
                <ArrowLeft size={14} strokeWidth={2} />{t('folder.back')}
              </button>
              <div className="flex items-center justify-between mb-sp-4">
                <h2 className="font-display text-fg text-f-lg">{activeFolder.name}</h2>
                <span className="text-f-sm text-muted">{t('folder.poiCount', { count: visiblePois.length })}</span>
              </div>
              <div className="rounded-none overflow-hidden mb-sp-4" style={{ border: '1px solid var(--bdr)' }}>
                {visiblePois.map((poi, idx) => {
                  const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
                  return (
                    <div key={poi.poi_id} className="flex items-center gap-sp-3 p-sp-4" style={idx < visiblePois.length - 1 ? { borderBottom: '1px solid var(--bdr)' } : undefined}>
                      <div className="w-10 h-10 rounded-none flex items-center justify-center shrink-0" style={{ background: 'var(--bg-3)' }}>
                        <MapPin size={16} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-f-base font-semibold text-fg truncate">{name}</p>
                        <p className="text-f-sm text-muted mt-[2px]">{poi.display_region}</p>
                      </div>
                      <button
                        onClick={() => handleRemovePoi(poi.poi_id)}
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
              <div className="flex flex-col gap-sp-3">
                <button
                  onClick={() => { setPlacesView('folders'); enterSelectMode(activeFolder) }}
                  disabled={visiblePois.length === 0}
                  className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-fg text-bg rounded-none font-semibold text-f-base hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-40"
                >
                  <Sparkles size={16} strokeWidth={2} aria-hidden="true" />{t('folder.generatePlan')}
                </button>
                {/* View this folder's places on the map — exclusive set + fitBounds,
                    same convention as Google/Naver/Kakao's "view saved on map":
                    explicit action, never an ambient camera shift. */}
                <Link
                  href={`/map?view=saved&folder=${activeFolder.id}`}
                  aria-disabled={visiblePois.length === 0}
                  className={[
                    'w-full min-h-touch flex items-center justify-center gap-sp-2 rounded-none font-semibold text-f-base transition-colors',
                    visiblePois.length === 0
                      ? 'pointer-events-none opacity-40'
                      : 'text-fg hover:bg-muted-3',
                  ].join(' ')}
                  style={{ border: '1px solid var(--bdr)' }}
                >
                  <Map size={16} strokeWidth={2} aria-hidden="true" />{t('folder.viewOnMap')}
                </Link>
              </div>
            </div>
          )
        })()
      ) : null}

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
              className="w-full min-h-touch px-sp-3 rounded-none bg-bg-3 text-f-base text-fg outline-none focus:ring-1 focus:ring-fg"
              style={{ border: '1px solid var(--bdr)' }}
            />
            <div className="flex gap-sp-3">
              <button onClick={() => setRenameFolder(null)} className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-muted hover:text-fg transition-colors" style={{ border: '1px solid var(--bdr)' }}>
                {t('folder.deleteCancel')}
              </button>
              <button onClick={handleRenameFolder} disabled={!renameValue.trim() || crudBusy} className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-bg bg-fg disabled:opacity-40">
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
    </>
  )
}
