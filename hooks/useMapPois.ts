'use client'

import useSWR from 'swr'
import { useLocale } from 'next-intl'
import { apiFetch } from '@/lib/api'

// Card-shape POI — what api.list_places (BFF: GET /places) returns, mapped to
// the current locale. Detail-only fields (description/address/website_url) are
// added later by usePlaceDetail() once a POI is selected — see hooks/usePlaceDetail.ts.
export interface MapPoi {
  poi_id:            string
  name_ko:           string
  name_en?:          string
  name_preferred?:   string
  coords_lat:        number
  coords_lng:        number
  display_domain?:   string | null
  display_region?:   string | null
  display_region_detail?: string
  is_trending?:      boolean   // no backing data yet — always undefined, degrades gracefully
  is_partner?:       boolean   // POIs have no sponsorship concept in the schema — always undefined
  quality_score?:    number
  save_count?:       number
  like_count?:       number
  is_open?:          boolean   // no opening-hours data collected yet — always undefined
  hours_open?:       string
  hours_close?:      string
  description?:      string
  address?:          string
  website_url?:      string
  primary_image_url?: string
}

interface RawPlace {
  poi_id:            number
  name_ko:           string
  primary_image_url: string | null
  like_count:        number
  save_count:        number
  coords_lat:        number
  coords_lng:        number
  display_region:    string | null
  domains:           string[] | null
  translations:      Record<string, { name?: string; description?: string }>
}

export interface MapBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

function mapPlace(row: RawPlace, locale: string): MapPoi {
  const t   = row.translations ?? {}
  const cur = t[locale] ?? {}
  const en  = t['en'] ?? {}
  return {
    poi_id:             String(row.poi_id),
    name_ko:            row.name_ko,
    name_en:            en.name,
    // translations rarely has an explicit 'ko' key (Korean lives in name_ko) —
    // without this, ko-locale users would see English for untranslated POIs.
    name_preferred:     cur.name ?? (locale === 'ko' ? row.name_ko : en.name),
    coords_lat:         row.coords_lat,
    coords_lng:         row.coords_lng,
    display_domain:     row.domains?.[0] ?? null,
    display_region:     row.display_region,
    save_count:         row.save_count,
    like_count:         row.like_count,
    primary_image_url:  row.primary_image_url ?? undefined,
  }
}

// bounds=null → 지도가 아직 idle을 한 번도 안 쐈을 때(초기 로드)의 폴백,
// 기존과 동일하게 bbox 없이 전국 top-100. bounds가 잡히면 화면 안 장소를
// 받아오고, 줌아웃(넓은 bbox)일수록 클러스터로 뭉쳐질 걸 알기에 적게 요청.
export function useMapPois(
  region: string | null,
  activeFilters: string[],
  bounds: MapBounds | null,
  zoom: number,
) {
  const locale = useLocale()

  const params = new URLSearchParams()
  if (region) params.set('region', region)
  if (activeFilters.length > 0) params.set('domain', activeFilters[0])
  if (bounds) {
    params.set('bounds', `${bounds.minLat},${bounds.maxLat},${bounds.minLng},${bounds.maxLng}`)
    // Clustering stays active through zoom 15 (NaverMapCanvas.CLUSTER_ZOOM_THRESHOLD) —
    // that range needs a fuller sample for accurate cluster counts. Past it
    // (individual pins, street-level bbox) the viewport itself is small, so
    // fewer rows are both sufficient and cheaper.
    params.set('limit', zoom <= 8 ? '150' : zoom <= 15 ? '300' : '150')
  } else {
    params.set('limit', '100')
  }

  const { data, error, isLoading } = useSWR(
    ['/places', params.toString(), locale],
    () => apiFetch<RawPlace[]>(`/places?${params.toString()}`),
    { revalidateOnFocus: false }
  )

  // list_places only takes one p_domain server-side — additional selected
  // filters (beyond the first) are applied client-side against `domains`.
  const extraFilters = activeFilters.slice(1)
  const rows = (data ?? []).filter(row =>
    extraFilters.length === 0 || extraFilters.some(f => row.domains?.includes(f))
  )

  return {
    pois: rows.map(row => mapPlace(row, locale)),
    isLoading,
    isError: !!error,
  }
}
