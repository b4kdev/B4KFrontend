'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FolderOpen, MapPin, MoreVertical, Edit2, Trash2, Check } from 'lucide-react'
import type { SavedFolder } from '@/app/api/saved/route'

interface Props {
  folder:         SavedFolder
  selectMode:     boolean
  selected:       boolean
  onOpen:         () => void
  onToggleSelect: () => void
  onRename:       () => void
  onDelete:       () => void
}

export default function FolderCard({
  folder, selectMode, selected, onOpen, onToggleSelect, onRename, onDelete,
}: Props) {
  const t = useTranslations('saved.folder')
  const [menuOpen, setMenuOpen] = useState(false)

  const thumbnails = folder.pois.slice(0, 4)
  const extraCount = folder.pois.length - 4
  // "All Saved" is the default folder — not renamable/deletable
  const isDefault = folder.is_default === true

  const thumbGrid = (
    <div className="w-full grid grid-cols-2 gap-[2px] bg-bg-3 aspect-[2/1] overflow-hidden">
      {thumbnails.length === 0 ? (
        <div className="col-span-2 row-span-2 flex items-center justify-center bg-bg-3">
          <FolderOpen size={32} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
        </div>
      ) : (
        thumbnails.map((poi, i) => (
          <div key={poi.poi_id} className="relative flex items-center justify-center bg-bg-3">
            {poi.primary_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poi.primary_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <MapPin size={16} strokeWidth={2} className="text-muted-3" aria-hidden="true" />
            )}
            {i === 3 && extraCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-backdrop-50">
                <span className="text-fg text-f-base font-bold">+{extraCount}</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )

  // ── Select mode: whole card toggles folder selection (M5 FL2 folder-level) ──
  if (selectMode) {
    return (
      <button
        onClick={onToggleSelect}
        aria-pressed={selected}
        aria-label={t('selectFolderAria', { name: folder.name })}
        className="relative rounded-none overflow-hidden bg-bg-2 flex flex-col text-left focus:outline-none focus:ring-2 focus:ring-lav focus:ring-inset"
        style={{ border: selected ? '1px solid var(--lav)' : '1px solid var(--bdr)' }}
      >
        <div className="relative">
          {thumbGrid}
          <div
            className={['absolute top-sp-2 right-sp-2 w-6 h-6 rounded-full flex items-center justify-center', selected ? 'bg-lav' : 'bg-backdrop-50'].join(' ')}
            aria-hidden="true"
          >
            {selected && <Check size={14} strokeWidth={2} className="text-bg" />}
          </div>
        </div>
        <div className="px-sp-3 pt-sp-3 pb-sp-3">
          <p className="text-fg text-f-base font-semibold truncate">{folder.name}</p>
          <p className="text-muted text-f-sm mt-[2px]">{t('poiCount', { count: folder.pois.length })}</p>
        </div>
      </button>
    )
  }

  // ── Normal mode: tap opens; kebab menu → rename / delete ──
  return (
    <div className="rounded-none overflow-hidden bg-bg-2 flex flex-col" style={{ border: '1px solid var(--bdr)' }}>
      <button
        onClick={onOpen}
        aria-label={t('openAriaLabel', { name: folder.name })}
        className="w-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-lav focus:ring-inset"
      >
        {thumbGrid}
      </button>

      <div className="px-sp-3 pt-sp-3 pb-sp-3 flex items-start justify-between gap-sp-2">
        <div className="min-w-0">
          <button
            onClick={onOpen}
            aria-label={t('openAriaLabel', { name: folder.name })}
            className="text-fg text-f-base font-semibold truncate max-w-full text-left hover:text-lav transition-colors focus:outline-none focus:underline"
          >
            {folder.name}
          </button>
          <p className="text-muted text-f-sm mt-[2px]">{t('poiCount', { count: folder.pois.length })}</p>
        </div>

        {!isDefault && (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label={t('folderMenu', { name: folder.name })}
              aria-expanded={menuOpen}
              className="min-w-touch min-h-touch flex items-center justify-center text-muted hover:text-fg transition-colors -mr-sp-2 -mt-sp-1"
            >
              <MoreVertical size={18} strokeWidth={2} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div
                  className="absolute right-0 top-full z-50 min-w-[140px] rounded-none py-sp-1"
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--bdr)' }}
                  role="menu"
                >
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); onRename() }}
                    className="w-full flex items-center gap-sp-2 px-sp-3 min-h-touch text-f-sm text-fg hover:bg-muted-3 transition-colors"
                  >
                    <Edit2 size={14} strokeWidth={2} aria-hidden="true" />{t('rename')}
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); onDelete() }}
                    className="w-full flex items-center gap-sp-2 px-sp-3 min-h-touch text-f-sm text-danger hover:bg-muted-3 transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={2} aria-hidden="true" />{t('delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
