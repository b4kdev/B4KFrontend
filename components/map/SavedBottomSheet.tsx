'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { X, ArrowLeft, MapPin, FolderOpen, FileText, Trash2 } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import { useSaved } from '@/hooks/useSaved'
import { useBottomSheetSnap } from '@/hooks/useBottomSheetSnap'
import type { SavedFolder } from '@/app/api/saved/route'

interface Props {
  open:           boolean
  onClose:        () => void
  onSelectPoi:    (placeId: string) => void
  onFolderChange: (poiIds: string[] | null) => void
}

type Tab = 'places' | 'plans'

// H13 — mobile Saved BottomSheet (S-IGOSPS): 3-snap sheet over the map,
// folder list → folder POI list, + My Plans tab. Reuses useBottomSheetSnap.
export default function SavedBottomSheet({ open, onClose, onSelectPoi, onFolderChange }: Props) {
  const t = useTranslations('saved')
  const { data, isLoading, mutate } = useSaved()
  const [tab, setTab] = useState<Tab>('places')
  const [activeFolder, setActiveFolder] = useState<SavedFolder | null>(null)
  // UF-3 — optimistic removal of a saved POI from the folder list
  const [removingPoiIds, setRemovingPoiIds] = useState<Set<string>>(new Set())

  // DEC-38 (S-IGOSPS) — active folder's POIs pinned on the map underneath the sheet
  useEffect(() => {
    onFolderChange(activeFolder ? activeFolder.pois.map(p => p.poi_id) : null)
    return () => onFolderChange(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder])

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

  const { sheetRef, snap, handleProps, sheetStyle } = useBottomSheetSnap({
    open, initialSnap: 'mid', onDismiss: onClose,
  })

  // reset to folder list each time it opens
  useEffect(() => {
    if (open) { setActiveFolder(null); setTab('places') }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const tabClass = (active: boolean) => [
    'flex-1 min-h-touch text-f-sm font-semibold transition-colors',
    active ? 'text-lav border-b-2 border-lav' : 'text-muted hover:text-fg',
  ].join(' ')

  return (
    <>
      <div
        className={[
          'lg:hidden fixed inset-0 z-30 transition-opacity duration-200',
          open && snap !== 'peek' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        style={{ background: 'var(--backdrop-50)' }}
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal={snap !== 'peek'}
        aria-label={t('title')}
        className="lg:hidden fixed bottom-14 left-0 right-0 z-40 h-[85vh] flex flex-col rounded-none"
        style={{ ...sheetStyle, background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Peek zone: handle + title + close — owns the gesture */}
        <div className="shrink-0" style={{ touchAction: 'none' }} {...handleProps}>
          <div className="flex justify-center pt-sp-2 pb-sp-1" aria-hidden="true">
            <div className="w-8 h-1 rounded-full bg-muted-2" />
          </div>
          <div className="flex items-center gap-sp-2 px-sp-4 pb-sp-2 min-h-touch">
            <h2 className="flex-1 text-fg font-display text-f-xl leading-tight truncate">
              {t('title')}
            </h2>
            <button
              onClick={onClose}
              aria-label={t('folder.back')}
              className="min-w-touch min-h-touch flex items-center justify-center text-muted hover:text-fg transition-colors shrink-0"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          {/* Tabs (hidden while inside a folder) */}
          {!activeFolder && (
            <div className="flex px-sp-4" style={{ borderBottom: '1px solid var(--bdr)' }}>
              <button onClick={() => setTab('places')} className={tabClass(tab === 'places')} aria-current={tab === 'places' ? 'page' : undefined}>
                {t('tabs.places')}
              </button>
              <button onClick={() => setTab('plans')} className={tabClass(tab === 'plans')} aria-current={tab === 'plans' ? 'page' : undefined}>
                {t('tabs.myPlans')}
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
          {isLoading ? (
            <div className="p-sp-4 flex flex-col gap-sp-2" aria-busy="true">
              {[0, 1, 2].map(i => <div key={i} className="h-14 bg-bg-3 rounded-none animate-pulse" />)}
            </div>
          ) : tab === 'places' ? (
            activeFolder ? (
              /* Folder POI list */
              <div>
                <button onClick={() => setActiveFolder(null)} className="flex items-center gap-sp-2 text-muted hover:text-fg transition-colors text-f-sm m-sp-4 min-h-touch">
                  <ArrowLeft size={14} strokeWidth={2} />{activeFolder.name}
                </button>
                {(() => {
                  const visiblePois = activeFolder.pois.filter(p => !removingPoiIds.has(p.poi_id))
                  return visiblePois.map((poi, idx) => {
                    const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
                    return (
                      <div
                        key={poi.poi_id}
                        className="w-full flex items-center gap-sp-3 p-sp-4 hover:bg-bg-3 transition-colors"
                        style={idx < visiblePois.length - 1 ? { borderBottom: '1px solid var(--bdr)' } : undefined}
                      >
                        <button
                          onClick={() => onSelectPoi(poi.poi_id)}
                          className="flex-1 min-w-0 flex items-center gap-sp-3 text-left min-h-touch"
                        >
                          <div className="w-10 h-10 rounded-none flex items-center justify-center shrink-0" style={{ background: 'var(--bg-3)' }}>
                            <MapPin size={16} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-f-base font-semibold text-fg truncate">{name}</p>
                            <p className="text-f-sm text-muted mt-[2px]">{poi.display_region}</p>
                          </div>
                        </button>
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
                  })
                })()}
              </div>
            ) : (data?.folders?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center text-center p-sp-10">
                <FolderOpen size={32} strokeWidth={2} className="text-muted-2 mb-sp-3" aria-hidden="true" />
                <p className="text-f-md text-muted">{t('empty.places.title')}</p>
              </div>
            ) : (
              /* Folder list */
              <div>
                {data!.folders.map((folder, idx) => (
                  <button
                    key={folder.id}
                    onClick={() => setActiveFolder(folder)}
                    className="w-full flex items-center gap-sp-3 p-sp-4 text-left hover:bg-bg-3 transition-colors"
                    style={idx < data!.folders.length - 1 ? { borderBottom: '1px solid var(--bdr)' } : undefined}
                  >
                    <div className="w-10 h-10 rounded-none flex items-center justify-center shrink-0" style={{ background: 'var(--bg-3)' }}>
                      <FolderOpen size={16} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-f-base font-semibold text-fg truncate">{folder.name}</p>
                      <p className="text-f-sm text-muted mt-[2px]">{t('folder.poiCount', { count: folder.pois.length })}</p>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            /* My Plans */
            (data?.myPlans?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center text-center p-sp-10">
                <FileText size={32} strokeWidth={2} className="text-muted-2 mb-sp-3" aria-hidden="true" />
                <p className="text-f-md text-muted">{t('empty.myPlans.title')}</p>
              </div>
            ) : (
              <div>
                {data!.myPlans.map((plan, idx) => (
                  <Link
                    key={plan.id}
                    href={`/plan/${plan.id}`}
                    onClick={onClose}
                    className="w-full flex items-center gap-sp-3 p-sp-4 hover:bg-bg-3 transition-colors"
                    style={idx < data!.myPlans.length - 1 ? { borderBottom: '1px solid var(--bdr)' } : undefined}
                  >
                    <div className="w-10 h-10 rounded-none flex items-center justify-center shrink-0" style={{ background: 'var(--bg-3)' }}>
                      <FileText size={16} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-f-base font-semibold text-fg truncate">{plan.title}</p>
                      <p className="text-f-sm text-muted mt-[2px]">{t('folder.poiCount', { count: plan.stop_count })}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  )
}
