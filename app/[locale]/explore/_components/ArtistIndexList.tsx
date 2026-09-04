'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronRight } from 'lucide-react'
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

// Text-only index (rank code · name · agency, optional debut/members/fandom
// meta line) — no images. Was an image tile grid; entity/idol images are
// high-risk per legal counsel (IMAGE-BOUNDARIES.md, connect-kpop-artist
// revert), so this reads as a real catalog/index instead of avatar tiles.
export default function ArtistIndexList({ artists, selectedArtistId, onSelect }: Props) {
  const t = useTranslations('explore')
  const locale = useLocale()
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
        style={{ borderTop: '1px solid var(--bdr)' }}
      >
        {visible.map((artist, i) => {
          const name = getDisplayName({ name_en: artist.name_en, name_ko: artist.name_ko, id: artist.id }, locale)
          const selected = selectedArtistId === artist.id
          const meta = [
            artist.debut_year,
            artist.member_count != null ? t('kpopArtistNav.tileGrid.memberCount', { count: artist.member_count }) : null,
            artist.fandom_name,
          ].filter((v): v is string | number => v != null)

          return (
            <button
              key={artist.id}
              type="button"
              onClick={() => onSelect(selected ? null : artist.id)}
              aria-pressed={selected}
              aria-label={t('kpopArtistNav.tileGrid.selectAria', { name })}
              className="w-full flex items-center gap-sp-4 px-sp-2 py-sp-3 min-h-touch text-left transition-colors"
              style={{
                borderBottom: '1px solid var(--bdr)',
                background: selected ? 'var(--muted-3)' : 'transparent',
              }}
            >
              <span
                className="text-f-xs shrink-0 tabular-nums"
                style={{ fontFamily: 'var(--f-mono)', letterSpacing: '0.05em', color: 'var(--muted)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              <span className="flex-1 min-w-0 flex flex-col gap-[2px]">
                <span
                  className="text-f-base font-semibold leading-tight truncate"
                  style={{ color: 'var(--fg)' }}
                >
                  {name}
                </span>
                {meta.length > 0 && (
                  <span className="text-f-xs text-muted truncate">{meta.join(' · ')}</span>
                )}
              </span>

              <span className="px-sp-2 py-0.5 rounded-full bg-bg-3 text-fg text-f-xs font-medium shrink-0">
                {artist.agency}
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
            className="text-f-sm font-semibold text-fg min-h-touch flex items-center gap-sp-1"
          >
            {expanded ? t('kpopArtistNav.tileGrid.showLess') : t('kpopArtistNav.tileGrid.showMore', { count: hiddenCount })}
            {!expanded && <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />}
          </button>
        </div>
      )}
    </div>
  )
}
