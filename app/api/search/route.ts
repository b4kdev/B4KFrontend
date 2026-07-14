import { NextResponse } from 'next/server'

export interface SearchPoi {
  place_id: string
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

const MOCK_POIS: SearchPoi[] = [
  { place_id: 'p1', name_ko: '경복궁', name_en: 'Gyeongbokgung Palace', display_region: 'Seoul · Jongno', display_domain: 'k-culture', save_count: 1240, primary_image_url: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=400' },
  { place_id: 'p2', name_ko: '하이브 사옥', name_en: 'HYBE HQ', display_region: 'Seoul · Yongsan', display_domain: 'k-pop', save_count: 892, primary_image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400' },
  { place_id: 'p3', name_ko: '홍대 걷고 싶은 거리', name_en: 'Hongdae Walking Street', display_region: 'Seoul · Mapo', display_domain: 'k-pop', save_count: 756, primary_image_url: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400' },
]

const MOCK_PLANS: SearchPlan[] = [
  { id: 'plan1', title: 'K-Pop Pilgrimage — 1 Day Seoul', author_name: 'b4k_editor', stop_count: 8, save_count: 412, cover_image_url: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400', is_partner: false },
  { id: 'plan2', title: 'K-Drama Filming Spots', author_name: 'drama_fan', stop_count: 6, save_count: 278, cover_image_url: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400', is_partner: true },
]

const EXPLORE_CATEGORIES: SearchExplore[] = [
  { category: 'k-pop',     label_key: 'kpop',    href: '/explore/k-pop' },
  { category: 'k-drama',   label_key: 'kdrama',  href: '/explore/k-drama' },
  { category: 'k-beauty',  label_key: 'kbeauty', href: '/explore/k-beauty' },
  { category: 'k-culture', label_key: 'kculture',href: '/explore/k-culture' },
]

// UF-9 (G9.5): map a query to an Explore hub chip facet so a tapped explore
// result lands on the hub with the relevant chip pre-selected.
// Source of truth for these value lists: CATEGORIES[].filter in
// app/[locale]/explore/_components/ExplorePage.tsx — keep in sync.
const EXPLORE_FACETS: Record<string, { param: string; values: string[] } | undefined> = {
  'k-pop':     { param: 'agency',   values: ['HYBE', 'SM', 'JYP', 'YG'] },
  'k-beauty':  { param: 'district', values: ['Apgujeong', 'Myeongdong', 'Hongdae', 'Gangnam'] },
  'k-culture': { param: 'region',   values: ['Seoul', 'Jeonju', 'Gyeongju', 'Andong'] },
  'k-drama':   undefined,
}

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

  // M14 area + tag filters — accepted + echoed; rough/no filtering in MVP mock.
  const areaLv1 = searchParams.get('area_lv1') ?? null
  const areaLv2 = searchParams.get('area_lv2') ?? null
  const tags = searchParams.get('tags')
    ? searchParams.get('tags')!.split(',').filter(Boolean)
    : []

  const wantAll = !type || type === 'all'
  let places = (wantAll || type === 'places') ? [...MOCK_POIS] : []
  let plans = (wantAll || type === 'plans') ? [...MOCK_PLANS] : []
  const explore = (wantAll || type === 'explore') ? buildExploreResults(q) : []

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
}
