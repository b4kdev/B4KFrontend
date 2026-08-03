'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { X, ArrowLeft, MapPin, FolderOpen, FileText, Trash2 } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import { useSaved } from '@/hooks/useSaved'
import type { SavedFolder, SavedPoi } from '@/app/api/saved/route'

interface Props {
  onClose:        () => void
  onSelectPoi:    (placeId: string) => void
  onFolderChange: (pois: SavedPoi[] | null) => void
}

type Tab = 'places' | 'plans'

// SC-31 (S-HDTVGP) — desktop twin of SavedBottomSheet: State 3 in the
// LeftPanel's 5-state machine. 2 tabs (Places/My Plans), folder → POI
// drill-down, active folder's POIs pinned on the map via onFolderChange.
export default function LeftPanelSavedHub({ onClose, onSelectPoi, onFolderChange }: Props) {
  const t = useTranslations('saved')
  const { data, isLoading, mutate } = useSaved()
  const [tab, setTab] = useState<Tab>('places')
  const [activeFolder, setActiveFolder] = useState<SavedFolder | null>(null)
  const [removingPoiIds, setRemovingPoiIds] = useState<Set<string>>(new Set())

  // Pin sync — tell MapView which POIs to show while a folder is open;
  // clear on unmount/tab switch/close so the full map returns.
  useEffect(() => {
    onFolderChange(activeFolder ? activeFolder.pois : null)
    return () => onFolderChange(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder])

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

  const tabClass = (active: boolean) => [
    'flex-1 min-h-touch text-f-sm font-semibold transition-colors',
    active ? 'text-lav border-b-2 border-lav' : 'text-muted',
  ].join(' ')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center gap-sp-2 p-sp-4 pb-sp-2 min-h-touch">
          <h2 className="flex-1 text-fg font-display text-f-xl leading-tight truncate">
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('folder.back')}
            className="min-w-touch min-h-touch flex items-center justify-center text-fg hover:bg-muted-3 transition-colors shrink-0"
          >
            <X size={18} strokeWidth={2} aria-hidden="true" style={{ opacity: 0.35 }} />
          </button>
        </div>
        {!activeFolder && (
          <div className="flex px-sp-4">
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
      <div className="flex-1 overflow-y-auto themed-scrollbar">
        {isLoading ? (
          // Matches the real row shape below (w-8 h-8 icon + px-sp-4 py-sp-3).
          <div aria-busy="true">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-sp-2 px-sp-4 py-sp-3 animate-pulse">
                <div className="w-8 h-8 bg-muted-3 shrink-0" />
                <div className="flex-1 space-y-sp-2">
                  <div className="h-3.5 w-1/2 rounded bg-muted-3" />
                  <div className="h-3 w-1/3 rounded bg-muted-3" />
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'places' ? (
          activeFolder ? (
            <div>
              <button
                onClick={() => setActiveFolder(null)}
                className="group flex items-center gap-sp-2 hover:text-fg transition-colors text-f-sm m-sp-4 min-h-touch text-muted"
              >
                <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" className="text-fg opacity-[0.35] group-hover:opacity-100 transition-opacity" />{activeFolder.name}
              </button>
              {(() => {
                const visiblePois = activeFolder.pois.filter(p => !removingPoiIds.has(p.poi_id))
                if (visiblePois.length === 0) {
                  return (
                    <div className="flex flex-col items-center text-center p-sp-8">
                      <FolderOpen size={28} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-2" aria-hidden="true" />
                      <p className="text-f-sm text-muted">{t('empty.places.title')}</p>
                    </div>
                  )
                }
                return visiblePois.map((poi) => {
                  const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
                  return (
                    <div
                      key={poi.poi_id}
                      className="w-full flex items-center gap-sp-2 px-sp-4 py-sp-3 hover:bg-bg-3 transition-colors"
                    >
                      <button
                        onClick={() => onSelectPoi(poi.poi_id)}
                        className="flex-1 min-w-0 flex items-center gap-sp-2 text-left min-h-touch"
                      >
                        <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: 'var(--bg-3)' }}>
                          <MapPin size={14} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-f-sm font-semibold text-fg truncate">{name}</p>
                          <p className="text-f-xs text-muted mt-[2px]">{poi.display_region}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleRemovePoi(poi.poi_id)}
                        aria-label={t('poi.removeAriaLabel', { name })}
                        title={t('poi.removeLabel')}
                        className="group min-w-touch min-h-touch flex items-center justify-center shrink-0 text-fg hover:text-danger transition-colors"
                      >
                        <Trash2 size={14} strokeWidth={2} aria-hidden="true" className="opacity-[0.35] group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  )
                })
              })()}
            </div>
          ) : (data?.folders?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center text-center p-sp-8">
              <FolderOpen size={28} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-2" aria-hidden="true" />
              <p className="text-f-sm text-muted">{t('empty.places.title')}</p>
            </div>
          ) : (
            <div>
              {data!.folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder)}
                  className="w-full flex items-center gap-sp-2 px-sp-4 py-sp-3 text-left hover:bg-bg-3 transition-colors"
                >
                  <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: 'var(--bg-3)' }}>
                    <FolderOpen size={14} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-f-sm font-semibold text-fg truncate">{folder.name}</p>
                    <p className="text-f-xs text-muted mt-[2px]">{t('folder.poiCount', { count: folder.pois.length })}</p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (data?.myPlans?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center text-center p-sp-8">
            <FileText size={28} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-2" aria-hidden="true" />
            <p className="text-f-sm text-muted">{t('empty.myPlans.title')}</p>
          </div>
        ) : (
          <div>
            {data!.myPlans.map((plan) => (
              <Link
                key={plan.id}
                href={`/plan/${plan.id}`}
                onClick={onClose}
                className="w-full flex items-center gap-sp-2 px-sp-4 py-sp-3 hover:bg-bg-3 transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: 'var(--bg-3)' }}>
                  <FileText size={14} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-f-sm font-semibold text-fg truncate">{plan.title}</p>
                  <p className="text-f-xs text-muted mt-[2px]">{t('folder.poiCount', { count: plan.stop_count })}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
