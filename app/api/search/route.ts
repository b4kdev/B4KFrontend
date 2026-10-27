import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { bffFetch, bffErrorResponse } from '@/lib/bff'

export interface SearchPoi {
  poi_id: string
  name_ko: string
  name_en: string
  display_region: string
  display_domain: string
  save_count: number
  primary_image_url: string
}

export interface SearchPlan {
  id: string
  title: string
  author_name: string
  stop_count: number
  save_count: number
  cover_image_url: string
  is_partner: boolean
}

export interface SearchExplore {
  category: string
  label_key: string
  href: string
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

// BFF GET /itineraries/public item (api.list_public_itineraries)
interface BffPublicItinerary {
  itinerary_id: number
  title: string
  is_partner: boolean
  region: string | null
  total_days: number
  total_places: number
  like_count: number
  save_count: number
  cover_image_url: string | null
  author: { user_id: number; name: string | null; avatar_url: string | null } | null
  published_at: string | null
}

const EXPLORE_CATEGORIES: SearchExplore[] = [
  { category: 'k-pop',     label_key: 'kpop',    href: '/explore/k-pop' },
  { category: 'k-drama',   label_key: 'kdrama',  href: '/explore/k-drama' },
  { category: 'k-beauty',  label_key: 'kbeauty', href: '/explore/k-beauty' },
  { category: 'k-culture', label_key: 'kculture',href: '/explore/k-culture' },
]

// Map a query to an Explore hub chip facet so a tapped explore
// result lands on the hub with the relevant chip pre-selected.
// Source of truth for these value lists: CATEGORIES[].filter in
// app/[locale]/explore/_components/ExplorePage.tsx — keep in sync.
const EXPLORE_FACETS: Record<string, { param: string; values: string[] } | undefined> = {
  'k-pop':     { param: 'agency',   values: ['HYBE', 'SM', 'JYP', 'YG'] },
  'k-beauty':  { param: 'district', values: ['Apgujeong', 'Myeongdong', 'Hongdae', 'Gangnam'] },
  'k-culture': { param: 'region',   values: ['Seoul', 'Jeonju', 'Gyeongju', 'Andong'] },
  'k-drama':   undefined,
}

// The search themes as drawn, as BFF place filters: an interest category, or chips (any of them).
// Several themes: one call each, the places joined.
const THEMES: Record<string, string> = {
  kpop: 'tags=kpop',
  kdrama: 'tags=kdrama',
  kbeauty: 'interest=beauty',
  food: 'interest=food',
  nature: 'interest=nature',
  shopping: 'interest=shopping',
  history: 'interest=heritage',
  nightlife: 'tags=pub,wine-bar,performance,concert',
}

// Region and district names as the place data writes them (서울, 강남구): Hangul, at most 20 characters.
const AREA = /^[가-힣]{1,20}$/

// Build explore results with a facet query attached where the query implies one.
function buildExploreResults(q: string): SearchExplore[] {
  const needle = q.trim().toLowerCase()
  return EXPLORE_CATEGORIES.map(cat => {
    const facet = EXPLORE_FACETS[cat.category]
    if (!needle || !facet) return { ...cat }
    const match = facet.values.find(v => needle.includes(v.toLowerCase()))
    return match
      ? { ...cat, href: `${cat.href}?${facet.param}=${encodeURIComponent(match)}` }
      : { ...cat }
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') // 'places' | 'plans' | 'explore' | null = all
  const sort = searchParams.get('sort') ?? 'relevance'

  // Filters: region and district (names from /api/places/areas) and themes narrow the places. The
  // public plans have no such fields, so a set filter leaves them out rather than show them unfiltered.
  const areaLv1 = AREA.test(searchParams.get('area_lv1') ?? '') ? searchParams.get('area_lv1') : null
  const areaLv2 = AREA.test(searchParams.get('area_lv2') ?? '') ? searchParams.get('area_lv2') : null
  const tags = (searchParams.get('tags') ?? '').split(',').filter((t) => t in THEMES)

  const wantAll = !type || type === 'all'
  const wantPlaces = wantAll || type === 'places'
  const filtered = !!(areaLv1 || areaLv2 || tags.length)
  const wantPlans = (wantAll || type === 'plans') && !filtered
  const explore = (wantAll || type === 'explore') ? buildExploreResults(q) : []

  const needle = q.trim().toLowerCase()
  // next-intl locales (i18n/routing.ts) — translations JSONB keys must match this
  // exact casing (e.g. 'zh-CN' not 'zh_CN') or the lookup below silently misses.
  const locale = cookies().get('NEXT_LOCALE')?.value ?? 'en'

  try {
    const base = `/places?q=${encodeURIComponent(q.trim())}&limit=20`
      + (areaLv1 ? `&region=${encodeURIComponent(areaLv1)}` : '')
      + (areaLv2 ? `&district=${encodeURIComponent(areaLv2)}` : '')
    const placeCalls = tags.length ? tags.map((t) => `${base}&${THEMES[t]}`) : [base]
    const [rawPlaces, rawPlans] = await Promise.all([
      wantPlaces && needle
        ? Promise.all(placeCalls.map((path) => bffFetch<BffPlace[]>(path))).then((lists) => {
            const seen = new Set<number>()
            return lists.flat().filter((p) => !seen.has(p.poi_id) && !!seen.add(p.poi_id))
          })
        : Promise.resolve<BffPlace[]>([]),
      // The BFF has no plan text search — fetch the public list and match
      // titles here (covers the top 50 public itineraries only).
      wantPlans && needle
        ? bffFetch<BffPublicItinerary[]>('/itineraries/public?sort=popular&limit=50')
        : Promise.resolve<BffPublicItinerary[]>([]),
    ])

    let places: SearchPoi[] = (rawPlaces ?? []).map(p => ({
      poi_id: String(p.poi_id),
      name_ko: p.name_ko,
      // Display-name rule: translations[locale].name, falling back to English
      // then Korean — matches hooks/useMapPois.ts's mapPlace().
      name_en: p.translations?.[locale]?.name ?? (locale === 'ko' ? p.name_ko : p.translations?.en?.name) ?? p.name_ko,
      display_region: p.display_region ?? '',
      display_domain: p.domains?.[0] ?? '',
      save_count: p.save_count ?? 0,
      primary_image_url: p.primary_image_url ?? '',
    }))

    let plans: SearchPlan[] = (rawPlans ?? [])
      .filter(p => (p.title ?? '').toLowerCase().includes(needle))
      .map(p => ({
        id: String(p.itinerary_id),
        title: p.title,
        author_name: p.author?.name ?? '',
        stop_count: p.total_places ?? 0,
        save_count: p.save_count ?? 0,
        cover_image_url: p.cover_image_url ?? '',
        is_partner: !!p.is_partner,
      }))

    if (sort === 'popularity') {
      places = places.sort((a, b) => b.save_count - a.save_count)
      plans = plans.sort((a, b) => b.save_count - a.save_count)
    }

    return NextResponse.json({
      places,
      plans,
      explore,
      query: q,
      filters: { area_lv1: areaLv1, area_lv2: areaLv2, tags },
    })
  } catch (e) {
    return bffErrorResponse(e)
  }
}
