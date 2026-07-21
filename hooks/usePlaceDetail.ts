'use client'

import useSWR from 'swr'
import { useLocale } from 'next-intl'
import { apiFetch } from '@/lib/api'
import type { MapPoi } from './useMapPois'

// api.get_place (BFF: GET /places/:id) — richer fields than the list, fetched
// once a POI is actually selected. Merge onto the list-shape MapPoi so the
// panel shows list data immediately and fills in address/description once this resolves.
interface RawPlaceDetail {
  poi_id:            number
  name_ko:           string
  address_ko:        string | null
  address_en:        string | null
  coords_lat:        number
  coords_lng:        number
  display_domain:    string | null
  domains:           string[] | null
  display_region:    string | null
  primary_image_url: string | null
  like_count:        number
  save_count:        number
  translations:      Record<string, { name?: string; description?: string }>
  context:           unknown
}

function mapDetail(row: RawPlaceDetail, locale: string): Partial<MapPoi> {
  const t   = row.translations ?? {}
  const cur = t[locale] ?? {}
  const en  = t['en'] ?? {}

  let address = row.address_ko ?? ''
  if (locale !== 'ko' && row.address_en) {
    address = `${row.address_ko ?? ''}\n${row.address_en}`.trim()
  }

  return {
    name_en:            en.name,
    // translations rarely has an explicit 'ko' key (Korean lives in name_ko) —
    // without this, ko-locale users would see English for untranslated POIs.
    name_preferred:     cur.name ?? (locale === 'ko' ? row.name_ko : en.name),
    description:        cur.description ?? en.description,
    address,
    display_domain:     row.display_domain ?? row.domains?.[0] ?? null,
    primary_image_url:  row.primary_image_url ?? undefined,
    save_count:         row.save_count,
    like_count:         row.like_count,
  }
}

export function usePlaceDetail(poiId: string | null) {
  const locale = useLocale()

  const { data, isLoading } = useSWR(
    poiId ? ['/places', poiId, locale] : null,
    () => apiFetch<RawPlaceDetail>(`/places/${poiId}`),
    { revalidateOnFocus: false }
  )

  return {
    detail: data ? mapDetail(data, locale) : null,
    isLoading,
  }
}
