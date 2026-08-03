'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ChevronRight, Music } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import type { ExploreArtist } from '@/app/api/explore/[category]/route'

// SPEC-04: "23 of ~40 teams shown, '17 more' reveals the rest" — mirrors
// SearchClient.tsx's SeeAllLink pattern (same show-more/show-less shape).
const INITIAL_COUNT = 23

interface Props {
  artists: ExploreArtist[]
  selectedArtistId: string | null
  onSelect: (artistId: string | null) => void
}

export default function ArtistTileGrid({ artists, selectedArtistId, onSelect }: Props) {
  const t = useTranslations('explore')
  const [expanded, setExpanded] = useState(false)

  if (artists.length === 0) {
    return <p className="text-f-sm text-muted mb-sp-8">{t('kpopArtistNav.tileGrid.empty')}</p>
  }

  const visible = expanded ? artists : artists.slice(0, INITIAL_COUNT)
  const hiddenCount = artists.length - INITIAL_COUNT

  return (
    <div className="mb-sp-8">
      <div
        role="group"
        aria-label={t('kpopArtistNav.tileGrid.ariaLabel')}
        className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-sp-3"
      >
        {visible.map(artist => {
          const name = getDisplayName({ name_en: artist.name_en, name_ko: artist.name_ko, id: artist.id })
          const selected = selectedArtistId === artist.id
          return (
            <button
              key={artist.id}
              type="button"
              onClick={() => onSelect(selected ? null : artist.id)}
              aria-pressed={selected}
              aria-label={t('kpopArtistNav.tileGrid.selectAria', { name })}
              className="flex flex-col items-center gap-sp-2 p-sp-2 min-h-touch rounded-none transition-colors"
              style={{
                background: selected ? 'var(--lav-dim)' : 'var(--bg-2)',
                border: selected ? '1px solid var(--lav)' : '1px solid var(--bdr)',
              }}
            >
              <div
                className="w-full aspect-square flex items-center justify-center overflow-hidden relative"
                style={{ background: 'var(--bg-3)' }}
              >
                {artist.image_url ? (
                  <Image src={artist.image_url} alt={name} fill sizes="120px" className="object-cover" />
                ) : (
                  <Music size={20} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
                )}
              </div>
              <span
                className="text-f-xs font-semibold leading-tight line-clamp-1 text-center w-full"
                style={{ color: selected ? 'var(--lav)' : 'var(--fg)' }}
              >
                {name}
              </span>
            </button>
          )
        })}
      </div>

      {hiddenCount > 0 && (
        <div className="pt-sp-3">
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="text-f-sm font-semibold text-lav min-h-touch flex items-center gap-sp-1"
          >
            {expanded ? t('kpopArtistNav.tileGrid.showLess') : t('kpopArtistNav.tileGrid.showMore', { count: hiddenCount })}
            {!expanded && <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />}
          </button>
        </div>
      )}
    </div>
  )
}
