'use client'

import { useMemo } from 'react'
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

// display_region in the DB is a Korean province name (서울/부산/제주/...), not the
// English region labels LeftPanel shows — `region` query param needs the Korean
// value or the BFF's exact-match filter returns zero rows every time. Gyeongju has
// no city-level row (province is 경북, which also covers other Gyeongbuk cities) —
// best available match, not exact.
const REGION_API_NAME: Record<string, string> = {
  Seoul:     '서울',
  Busan:     '부산',
  Jeju:      '제주',
  Incheon:   '인천',
  Gyeongju:  '경북',
  // LP_01 "more regions" — remaining first-level administrative divisions
  Daegu:     '대구',
  Gwangju:   '광주',
  Daejeon:   '대전',
  Ulsan:     '울산',
  Sejong:    '세종',
  Gyeonggi:  '경기',
  Gangwon:   '강원',
  Chungbuk:  '충북',
  Chungnam:  '충남',
  Jeonbuk:   '전북',
  Jeonnam:   '전남',
  Gyeongnam: '경남',
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
  if (region) params.set('region', REGION_API_NAME[region] ?? region)
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

  // keepPreviousData: true — bounds (and therefore the SWR key) change on
  // every pan/zoom idle event. Without this, SWR clears `data` to undefined
  // for every new key while the new bbox request is in flight, which zeroes
  // out `pois` below and wipes every marker off the map until the fetch
  // resolves — live-reproduced as markers vanishing on every pan/zoom.
  const { data, error, isLoading } = useSWR(
    ['/places', params.toString(), locale],
    () => apiFetch<RawPlace[]>(`/places?${params.toString()}`),
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  // list_places only takes one p_domain server-side — additional selected
  // filters (beyond the first) are applied client-side against `domains`.
  // Memoized on [data, activeFilters] — without this, MapView's ~20 other
  // useState slots (naming sheet, modals, etc.) each produced a fresh `rows`/
  // `pois` array reference on every unrelated re-render, forcing
  // NaverMapCanvas's O(n) marker/cluster-grouping effect to redo its full
  // pass for no reason (per-marker/cluster diffing already skipped the
  // actual DOM writes, but the grouping computation itself still re-ran).
  const rows = useMemo(() => {
    const extraFilters = activeFilters.slice(1)
    return (data ?? []).filter(row =>
      extraFilters.length === 0 || extraFilters.some(f => row.domains?.includes(f))
    )
  }, [data, activeFilters])

  const pois = useMemo(() => rows.map(row => mapPlace(row, locale)), [rows, locale])

  return { pois, isLoading, isError: !!error }
}
