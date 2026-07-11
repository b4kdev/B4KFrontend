'use client'

import { useTranslations } from 'next-intl'
import { FolderOpen, MapPin, Sparkles } from 'lucide-react'
import type { SavedFolder } from '@/app/api/saved/route'

interface Props {
  folder:           SavedFolder
  onOpen:           () => void
  onGeneratePlan:   () => void
}

export default function FolderCard({ folder, onOpen, onGeneratePlan }: Props) {
  const t = useTranslations('saved.folder')

  const thumbnails = folder.pois.slice(0, 4)
  const extraCount = folder.pois.length - 4

  return (
    <div
      className="rounded-none overflow-hidden bg-bg-2 flex flex-col"
      style={{ border: '1px solid var(--bdr)' }}
    >
      {/* Thumbnail grid — tap whole grid opens folder */}
      <button
        onClick={onOpen}
        aria-label={t('openAriaLabel', { name: folder.name })}
        className="w-full grid grid-cols-2 gap-[2px] bg-bg-3 aspect-[2/1] overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-lav focus:ring-inset"
      >
        {thumbnails.length === 0 ? (
          <div className="col-span-2 row-span-2 flex items-center justify-center bg-bg-3">
            <FolderOpen size={32} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
          </div>
        ) : (
          thumbnails.map((poi, i) => (
            <div
              key={poi.place_id}
              className="relative flex items-center justify-center bg-bg-3"
            >
              {poi.primary_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={poi.primary_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <MapPin size={16} strokeWidth={2} className="text-muted-3" aria-hidden="true" />
              )}
              {/* +N overlay on last visible thumbnail */}
              {i === 3 && extraCount > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-backdrop-50">
                  <span className="text-fg text-f-base font-bold">+{extraCount}</span>
                </div>
              )}
            </div>
          ))
        )}
      </button>

      {/* Info row */}
      <div className="px-sp-3 pt-sp-3 pb-sp-2 flex items-start justify-between gap-sp-2">
        <div className="min-w-0">
          <button
            onClick={onOpen}
            aria-label={t('openAriaLabel', { name: folder.name })}
            className="text-fg text-f-base font-semibold truncate max-w-full text-left hover:text-lav transition-colors focus:outline-none focus:underline"
          >
            {folder.name}
          </button>
          <p className="text-muted text-f-sm mt-[2px]">
            {t('poiCount', { count: folder.pois.length })}
          </p>
        </div>
      </div>

      {/* Generate Plan CTA */}
      <div className="px-sp-3 pb-sp-3">
        <button
          onClick={onGeneratePlan}
          disabled={folder.pois.length === 0}
          className="w-full min-h-[36px] flex items-center justify-center gap-sp-2 rounded-none bg-lav-dim text-lav text-f-sm font-semibold hover:opacity-90 active:opacity-75 transition-opacity disabled:opacity-40"
          style={{ border: '1px solid var(--lav-border)' }}
        >
          <Sparkles size={12} strokeWidth={2} aria-hidden="true" />
          {t('generatePlan')}
        </button>
      </div>
    </div>
  )
}
