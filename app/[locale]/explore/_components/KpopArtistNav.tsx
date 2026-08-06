'use client'

import { useMemo, useState } from 'react'
import ExploreChipFilter, { ChipFilterConfig } from './ExploreChipFilter'
import ArtistIndexList from './ArtistIndexList'
import ExploreSectionRow from './ExploreSectionRow'
import type { ExploreData, ExplorePoi } from '@/app/api/explore/[category]/route'

// CT_KP_EXT (DEC-60) — global agency chip, promoted out of the per-section scope
// the generic hub shell uses. Order matches the content plan's source doc: 전체 ·
// HYBE · SM · YG · JYP · STARSHIP · KQ (전체/All is built into ExploreChipFilter).
const AGENCY_FILTER: ChipFilterConfig = {
  param: 'agency',
  values: ['HYBE', 'SM', 'YG', 'JYP', 'STARSHIP', 'KQ'],
}

// concerts/tours/merchandise/trending have no real per-item artist/agency
// attribution (BLK-35/BLK-36) — always shown in full regardless of selection.
// Trending Now is additionally date-driven server-side (see route.ts), not
// selection-driven — it just happens to also be untagged, so it passes through
// filterItems unfiltered the same way. agencyHq/memberFootsteps carry real tags
// (agency field / artistIds) and do filter. 'tours' is the only row that keeps the
// wide featured-card treatment (Leeum, is_featured:true) — agencyHq intentionally
// dropped that (see DEC-60 build notes: near-identical HQ-building placeholders
// don't need a featured pick).
const ROW_IDS = ['trending', 'concerts', 'tours', 'agencyHq', 'merchandise', 'memberFootsteps'] as const

// memberFootsteps is the only row that deep-links to a dedicated detail page
// instead of the generic search results — every other row keeps the shared href.
const VIEW_ALL_HREF: Partial<Record<(typeof ROW_IDS)[number], string>> = {
  memberFootsteps: '/explore/k-pop/bts/footsteps',
}

export default function KpopArtistNav({ data }: { data: ExploreData }) {
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null)
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null)

  const artists = data.artists ?? []
  const artistIndex = useMemo(
    () => Object.fromEntries((data.artists ?? []).map(a => [a.id, a])),
    [data.artists],
  )
  const visibleArtists = useMemo(
    () => (selectedAgency ? artists.filter(a => a.agency === selectedAgency) : artists),
    [artists, selectedAgency],
  )

  const handleSelectArtist = (id: string | null) => {
    setSelectedArtistId(id)
    setSelectedAgency(id ? (artistIndex[id]?.agency ?? null) : null)
  }
  const handleSelectAgency = (value: string | null) => {
    setSelectedAgency(value)
    setSelectedArtistId(null)
  }

  // Rows with no artist/agency tag on any item pass through unfiltered — see
  // ROW_IDS comment. Tagged rows: an item matches if its artistIds includes the
  // selected artist, its own `agency` field matches, or (browsing by agency
  // broadly, no specific artist picked) any of its tagged artists belong to
  // that agency.
  const filterItems = (items: ExplorePoi[]): ExplorePoi[] => {
    const anyTagged = items.some(it => (it.artistIds && it.artistIds.length > 0) || it.agency !== undefined)
    if (!anyTagged || (!selectedArtistId && !selectedAgency)) return items
    return items.filter(it => {
      if (selectedArtistId && it.artistIds?.includes(selectedArtistId)) return true
      if (selectedAgency) {
        if (it.agency === selectedAgency) return true
        if (it.artistIds?.some(id => artistIndex[id]?.agency === selectedAgency)) return true
      }
      return false
    })
  }

  return (
    <>
      <ExploreChipFilter config={AGENCY_FILTER} active={selectedAgency} onChange={handleSelectAgency} />
      <ArtistIndexList artists={visibleArtists} selectedArtistId={selectedArtistId} onSelect={handleSelectArtist} />

      {ROW_IDS.map(id => {
        const items = filterItems(data.sections.find(s => s.id === id)?.items ?? [])
        return (
          <ExploreSectionRow
            key={id}
            id={id}
            items={items}
            category="k-pop"
            hubDomain="kpop"
            viewAllHref={VIEW_ALL_HREF[id] ?? '/search?q=k-pop'}
            allowFeatured={id === 'tours'}
          />
        )
      })}
    </>
  )
}
