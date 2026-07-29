'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ExploreChipFilter, { ChipFilterConfig } from './ExploreChipFilter'
import ArtistTileGrid from './ArtistTileGrid'
import ExploreSectionRow from './ExploreSectionRow'
import type { ExploreData, ExplorePoi } from '@/app/api/explore/[category]/route'

// CT_KP_EXT (DEC-60) — global agency chip, promoted out of the per-section scope
// the generic hub shell uses. Widened HYBE/SM/JYP/YG -> +STARSHIP/KQ.
const AGENCY_FILTER: ChipFilterConfig = {
  param: 'agency',
  values: ['HYBE', 'SM', 'JYP', 'YG', 'STARSHIP', 'KQ'],
}

// concerts/tours/merchandise/trending have no real per-item artist/agency
// attribution (BLK-35/BLK-36) — always shown in full regardless of selection.
// agencyHq/memberFootsteps carry real tags (agency field / artistIds) and do
// filter. 'tours' is the only row that keeps the wide featured-card treatment
// (Leeum, is_featured:true) — agencyHq intentionally dropped that (see DEC-60
// build notes: 3 near-identical HQ-building placeholders don't need a featured pick).
const ROW_IDS = ['trending', 'concerts', 'tours', 'agencyHq', 'merchandise', 'memberFootsteps'] as const

export default function KpopArtistNav({ data }: { data: ExploreData }) {
  const searchParams = useSearchParams()
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null)
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null)

  const artists = data.artists ?? []
  const artistIndex = useMemo(
    () => Object.fromEntries((data.artists ?? []).map(a => [a.id, a])),
    [data.artists],
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

  // Dev-only: override "current month" to test the birthday-cafe row's
  // conditional without waiting for a real member's birthday month to arrive.
  // No-op in production regardless of query param.
  const devMonth =
    process.env.NODE_ENV !== 'production' ? Number(searchParams.get('devMonth')) : NaN
  const currentMonth = devMonth >= 1 && devMonth <= 12 ? devMonth : new Date().getMonth() + 1

  const selectedArtist = selectedArtistId ? artistIndex[selectedArtistId] : undefined
  const showBirthdayCafe = !!selectedArtist && selectedArtist.birthday_month === currentMonth
  const birthdayCafeItems = data.sections.find(s => s.id === 'birthdayCafe')?.items ?? []

  return (
    <>
      <ExploreChipFilter config={AGENCY_FILTER} active={selectedAgency} onChange={handleSelectAgency} />
      <ArtistTileGrid artists={artists} selectedArtistId={selectedArtistId} onSelect={handleSelectArtist} />

      {ROW_IDS.map(id => {
        const items = filterItems(data.sections.find(s => s.id === id)?.items ?? [])
        return (
          <ExploreSectionRow
            key={id}
            id={id}
            items={items}
            category="k-pop"
            hubDomain="kpop"
            viewAllHref="/search?q=k-pop"
            allowFeatured={id === 'tours'}
          />
        )
      })}

      {showBirthdayCafe && (
        <ExploreSectionRow
          id="birthdayCafe"
          items={filterItems(birthdayCafeItems)}
          category="k-pop"
          hubDomain="kpop"
          viewAllHref="/search?q=k-pop"
        />
      )}
    </>
  )
}
