// lib/place-detail.ts — server-side POI detail fetch for the canonical POI
// page (BLK-11, app/[locale]/place/[poiId]). Mirrors hooks/usePlaceDetail.ts's
// mapping but calls the BFF directly server-side (bffFetch) instead of the
// client-only apiFetch, since this route must be SSR per shared/legal-seo.md
// ("POI detail pages must be SSR (not client-rendered) for Naver indexing").
import { bffFetch, BffError } from './bff'
import { getDisplayName } from './display-name'

// api.get_place (BFF: GET /places/:id) — same shape hooks/usePlaceDetail.ts consumes.
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
}

export interface PlaceDetail {
  poi_id:            string
  name:              string
  name_ko:           string
  name_en?:          string
  description?:      string
  address?:          string
  coords_lat:        number
  coords_lng:        number
  display_domain:    string | null
  display_region:    string | null
  primary_image_url?: string
  save_count:        number
  like_count:        number
}

/** null when the poi_id doesn't resolve (404) — callers should notFound(). */
export async function fetchPlaceDetail(poiId: string, locale: string): Promise<PlaceDetail | null> {
  let row: RawPlaceDetail
  try {
    // Fully public read, no per-viewer fields in this shape — force anonymous
    // (token: null) rather than let bffFetch look up the cookie session, which
    // would risk a token-refresh cookie write during Server Component render.
    row = await bffFetch<RawPlaceDetail>(`/places/${poiId}`, { token: null })
  } catch (e) {
    if (e instanceof BffError && e.status === 404) return null
    throw e
  }

  const t   = row.translations ?? {}
  const cur = t[locale] ?? {}
  const en  = t['en'] ?? {}

  let address = row.address_ko ?? ''
  if (locale !== 'ko' && row.address_en) {
    address = `${row.address_ko ?? ''}\n${row.address_en}`.trim()
  }

  const name_en = en.name
  const name_preferred = cur.name ?? (locale === 'ko' ? row.name_ko : en.name)

  return {
    poi_id:             String(row.poi_id),
    name:               getDisplayName({ name_preferred, name_en, name_ko: row.name_ko, id: row.poi_id }),
    name_ko:            row.name_ko,
    name_en,
    description:        cur.description ?? en.description,
    address:            address || undefined,
    coords_lat:         row.coords_lat,
    coords_lng:         row.coords_lng,
    display_domain:     row.display_domain ?? row.domains?.[0] ?? null,
    display_region:     row.display_region,
    primary_image_url:  row.primary_image_url ?? undefined,
    save_count:         row.save_count,
    like_count:         row.like_count,
  }
}
