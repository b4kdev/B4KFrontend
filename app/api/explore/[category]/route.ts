import { NextRequest, NextResponse } from 'next/server'

export interface ExplorePoi {
  poi_id: string
  name_ko: string
  name_en: string
  primary_image_url: string | null
  display_region: string
  quality_score: number
  is_trending: boolean
  is_partner?: boolean
  partner_url?: string | null
  /** Chip-filter facets — hub-specific. */
  agency?: string
  district?: string
  region?: string
  /** ISO date (YYYY-MM-DD) for D-Day countdown on event/merch/festival items. */
  event_date?: string
  /** SC-36 (KD_04/KB_04) — one featured item renders as a wide card above the row. */
  is_featured?: boolean
  // Quick-add-to-plan needs coords — service.places_snapshot has them for real
  coords_lat: number
  coords_lng: number
}

export interface ExploreSection {
  id: string
  items: ExplorePoi[]
}

export interface ExploreHeroSlide {
  id: string
  badge: string
  title: string
  subtitle: string
  cta_label: string
  cta_href: string
  image_url: string | null
}

export interface ExplorePackage {
  id: string
  title: string
  partner_name: string
  partner_url: string
  cover_image_url: string | null
  is_partner: true
}

export interface ExploreData {
  category: string
  sections: ExploreSection[]
  hero?: ExploreHeroSlide[]
  packages?: ExplorePackage[]
}

// No data yet — real POI content comes from service.places_snapshot.
// Section ids per category kept in sync with app/[locale]/explore/_components/ExplorePage.tsx
// CATEGORIES[].sections so headers/labels render correctly once items exist.
type MockExplorePoi = Omit<ExplorePoi, 'coords_lat' | 'coords_lng'>
type MockExploreData = Omit<ExploreData, 'sections'> & {
  sections: { id: string; items: MockExplorePoi[] }[]
}

const SECTIONS_BY_CATEGORY: Record<string, string[]> = {
  'k-pop': ['concerts', 'tours', 'agencies', 'merchandise'],
  'k-drama': ['filming', 'tours', 'historical', 'ostCafes'],
  'k-beauty': ['skincare', 'makeup', 'spa', 'salon'],
  'k-culture': ['traditional', 'food', 'festivals', 'crafts'],
}

const MOCK: Record<string, MockExploreData> = Object.fromEntries(
  Object.entries(SECTIONS_BY_CATEGORY).map(([category, sectionIds]) => [
    category,
    {
      category,
      hero: [],
      sections: sectionIds.map((id) => ({ id, items: [] })),
      packages: [],
    },
  ])
)

/** Facet key per category — the single query param that hub's chips drive. */
const FACET_BY_CATEGORY: Record<string, keyof ExplorePoi | undefined> = {
  'k-pop': 'agency',
  'k-beauty': 'district',
  'k-culture': 'region',
  'k-drama': undefined,
}

export async function GET(
  req: NextRequest,
  { params }: { params: { category: string } }
) {
  const rawBase = MOCK[params.category]
  if (!rawBase) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // No items yet, so no coords enrichment needed (service.places_snapshot
  // carries coords_lat/coords_lng for real POIs).
  const base: ExploreData = {
    ...rawBase,
    sections: rawBase.sections.map(s => ({ ...s, items: [] as ExplorePoi[] })),
  }

  const facet = FACET_BY_CATEGORY[params.category]
  const filterValue = facet ? req.nextUrl.searchParams.get(facet) : null

  // Derive Trending Now from the UNFILTERED sections — the trending row (KP/KB/KC_02)
  // sits above the chip-scoped section and must not collapse under a filter.
  const seen = new Set<string>()
  const trendingItems: ExplorePoi[] = []
  for (const s of base.sections) {
    for (const it of s.items) {
      if (it.is_trending && !seen.has(it.poi_id)) {
        seen.add(it.poi_id)
        trendingItems.push(it)
      }
    }
  }
  const trendingSection: ExploreSection = { id: 'trending', items: trendingItems.slice(0, 8) }

  // Apply chip filter only to sections whose items carry the facet (the chip is
  // spec-scoped to those sections). Untagged sections pass through unchanged.
  let sections = base.sections
  if (facet && filterValue) {
    sections = base.sections.map((s) => {
      const anyTagged = s.items.some((it) => it[facet] !== undefined)
      if (!anyTagged) return s
      return { ...s, items: s.items.filter((it) => it[facet] === filterValue) }
    })
  }

  const data: ExploreData = {
    category: base.category,
    hero: base.hero,
    packages: base.packages,
    sections: [trendingSection, ...sections],
  }
  return NextResponse.json(data)
}
