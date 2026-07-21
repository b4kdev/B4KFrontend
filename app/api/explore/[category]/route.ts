import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { bffFetch, bffErrorResponse } from '@/lib/bff'

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

// BFF GET /places item (api.list_places)
interface BffPlace {
  poi_id: number
  name_ko: string
  primary_image_url: string | null
  like_count: number
  save_count: number
  coords_lat: number
  coords_lng: number
  display_region: string | null
  domains: string[] | null
  translations: Record<string, { name?: string; description?: string }> | null
}

// Section ids per category kept in sync with app/[locale]/explore/_components/ExplorePage.tsx
// CATEGORIES[].sections so headers/labels render correctly once items exist.
// Category slugs coincide with BFF domain values (k-pop | k-drama | k-beauty | k-culture).
const SECTIONS_BY_CATEGORY: Record<string, string[]> = {
  'k-pop': ['concerts', 'tours', 'agencies', 'merchandise'],
  'k-drama': ['filming', 'tours', 'historical', 'ostCafes'],
  'k-beauty': ['skincare', 'makeup', 'spa', 'salon'],
  'k-culture': ['traditional', 'food', 'festivals', 'crafts'],
}

/** Facet key per category — the single query param that hub's chips drive. */
const FACET_BY_CATEGORY: Record<string, keyof ExplorePoi | undefined> = {
  'k-pop': 'agency',
  'k-beauty': 'district',
  'k-culture': 'region',
  'k-drama': undefined,
}

// next-intl locales (i18n/routing.ts) — translations JSONB keys must match this
// exact casing (e.g. 'zh-CN' not 'zh_CN') or the lookup below silently misses.
function mapPlace(p: BffPlace, locale: string): ExplorePoi {
  return {
    poi_id: String(p.poi_id),
    name_ko: p.name_ko,
    // Display-name rule: translations[locale].name, falling back to English
    // then Korean — matches hooks/useMapPois.ts's mapPlace().
    name_en: p.translations?.[locale]?.name ?? (locale === 'ko' ? p.name_ko : p.translations?.en?.name) ?? p.name_ko,
    primary_image_url: p.primary_image_url,
    display_region: p.display_region ?? '',
    quality_score: 0, // not exposed by BFF list_places
    is_trending: false, // no backing flag — the trending row is like-ordered instead
    coords_lat: p.coords_lat,
    coords_lng: p.coords_lng,
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { category: string } }
) {
  const sectionIds = SECTIONS_BY_CATEGORY[params.category]
  if (!sectionIds) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const locale = cookies().get('NEXT_LOCALE')?.value ?? 'en'

  let items: ExplorePoi[]
  try {
    // BFF domain values match the category slugs 1:1.
    const places = await bffFetch<BffPlace[]>(
      `/places?domain=${encodeURIComponent(params.category)}&limit=40`
    )
    items = (places ?? []).map(p => mapPlace(p, locale))
  } catch (e) {
    return bffErrorResponse(e)
  }

  // Thematic sections stay empty for now — the BFF has no per-section facet
  // (concerts/tours/skincare/…) on places yet. Real POIs surface in the
  // like-ordered Trending Now row below. Hero/packages have no backend either.
  const base: ExploreData = {
    category: params.category,
    hero: [],
    sections: sectionIds.map(id => ({ id, items: [] as ExplorePoi[] })),
    packages: [],
  }

  const facet = FACET_BY_CATEGORY[params.category]
  const filterValue = facet ? req.nextUrl.searchParams.get(facet) : null

  // Trending Now (KP/KB/KC_02) is built from the UNFILTERED data — the trending
  // row sits above the chip-scoped sections and must not collapse under a
  // filter. Items flagged is_trending in sections take priority; otherwise the
  // BFF like-count ordering (list_places sorts like_count DESC) stands in.
  const seen = new Set<string>()
  const flagged: ExplorePoi[] = []
  for (const s of base.sections) {
    for (const it of s.items) {
      if (it.is_trending && !seen.has(it.poi_id)) {
        seen.add(it.poi_id)
        flagged.push(it)
      }
    }
  }
  const trendingSection: ExploreSection = {
    id: 'trending',
    items: (flagged.length > 0 ? flagged : items).slice(0, 8),
  }

  // Apply chip filter only to sections whose items carry the facet (the chip is
  // spec-scoped to those sections). Untagged sections pass through unchanged.
  // Note: BFF places don't carry agency/district/region facets yet, so this is
  // a pass-through until that data exists (BFF region= expects Korean
  // display_region values — the English chip values wouldn't match).
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
