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

function mapPlace(row: RawPlace, locale: string): MapPoi {
  const t   = row.translations ?? {}
  const cur = t[locale] ?? {}
  const en  = t['en'] ?? {}
  return {
    poi_id:             String(row.poi_id),
    name_ko:            row.name_ko,
    name_en:            en.name,
    name_preferred:     cur.name ?? en.name,
    coords_lat:         row.coords_lat,
    coords_lng:         row.coords_lng,
    display_domain:     row.domains?.[0] ?? null,
    display_region:     row.display_region,
    save_count:         row.save_count,
    like_count:         row.like_count,
    primary_image_url:  row.primary_image_url ?? undefined,
  }
}

export function useMapPois(region: string | null, activeFilters: string[]) {
  const locale = useLocale()

  const params = new URLSearchParams()
  if (region) params.set('region', region)
  if (activeFilters.length > 0) params.set('domain', activeFilters[0])
  params.set('limit', '100')

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
