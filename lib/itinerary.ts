// lib/itinerary.ts — itinerary types + BFF↔frontend mapping shared by
// app/api/plans/** routes and itinerary-detail UI. Kept out of app/api/plans/[id]/route.ts
// because Next.js route.ts files may only export HTTP handlers + route config —
// any other export breaks `next build`'s generated route types.

import { bffFetch } from './bff'

export interface ItineraryStop {
  stop_order: number
  day: number | null
  duration_min: number
  transport_mode: 'car' | 'public' | 'walk' | null
  notes: string | null
  poi: {
    poi_id: string
    name_preferred: string | null
    name_en: string
    name_ko: string
    primary_image_url: string | null
    display_domain: string
    coords_lat: number
    coords_lng: number
  }
}

export interface ItineraryLeg {
  from_stop_order: number
  to_stop_order: number
  estimated_duration_s: number
  distance_m: number
  transport_mode: 'car' | 'public' | 'walk'
  // Real road path from routing.route_leg (pgRouting) when available — ordered
  // [lat, lng] points to draw on the map instead of a straight connector.
  // Absent/empty when the backend fell back to a straight-line approximation.
  path: Array<{ lat: number; lng: number }>
}

export interface ItineraryRelated {
  id: string
  title: string
  like_count: number
  save_count: number
  stop_count: number
  thumbnail_url: string | null
}

export interface ItineraryDetail {
  id: string
  title: string
  is_partner: boolean
  is_published: boolean
  share_url: string | null
  like_count: number
  save_count: number
  total_duration_min: number
  distance_m: number | null
  author: {
    id: string
    name_preferred: string | null
    name_en: string | null
    name_ko: string | null
    avatar_url: string | null
  }
  stops: ItineraryStop[]
  legs: ItineraryLeg[]
  related: ItineraryRelated[]
  viewer: {
    is_liked: boolean
    is_saved: boolean
  }
}

// ─── BFF (Supabase Edge Function) response shapes — see B4KBackend/API_FRONTEND.md ───

// GeoJSON LineString — coordinates are [lng, lat] pairs per the GeoJSON spec.
export interface GeoJsonLineString {
  type: 'LineString'
  coordinates: Array<[number, number]>
}

export interface BffLegToNext {
  to_poi_id: number
  distance_m: number
  duration_sec: number
  geometry?: GeoJsonLineString | null
  method?: string | null   // 'pgr' | 'approx' | 'approx_nosnap' | 'approx_nopath'
}

export interface BffPlace {
  poi_id: number
  visit_order: number
  travel_mode?: string | null            // walking | transit | driving
  duration_min?: number | null
  note?: string | null
  name_ko?: string | null
  address_ko?: string | null
  coords_lat?: number | null
  coords_lng?: number | null
  primary_image_url?: string | null
  display_region?: string | null
  translations?: Record<string, { name?: string; description?: string }> | null
  leg_to_next?: BffLegToNext | null
}

export interface BffDay {
  day_number: number
  travel_date?: string | null
  places: BffPlace[]
}

export interface BffItinerary {
  itinerary_id: number
  title: string
  status?: string                        // draft | confirmed (owner GET only)
  is_public?: boolean
  is_partner?: boolean
  start_date?: string | null
  region?: string | null
  like_count?: number
  save_count?: number
  total_days?: number
  total_places?: number
  created_at?: string
  updated_at?: string
  author?: { user_id: number; name: string | null; avatar_url: string | null } | null
  viewer?: { is_owner: boolean; is_liked: boolean; is_saved: boolean }
  days: BffDay[] | null
}

const DEFAULT_DURATION_MIN = 60

// travel_mode mapping — frontend contract is walk|public|car, DB only stores
// walking|transit|driving (API_FRONTEND.md migration-011 note).
export function toFrontMode(mode: string | null | undefined): 'car' | 'public' | 'walk' {
  if (mode === 'driving') return 'car'
  if (mode === 'transit') return 'public'
  return 'walk'
}

export function toBffMode(mode: string): 'driving' | 'transit' | 'walking' {
  if (mode === 'car') return 'driving'
  if (mode === 'public') return 'transit'
  return 'walking'
}

export const isNumericId = (id: string) => /^\d+$/.test(id)

// list_my_itineraries item (GET /me/itineraries?status=draft) — the account's
// single working draft, if any. Shared by app/api/plans/draft (autosave) and
// app/api/plans (Save Plan confirm, BLK-08) so both check the same row before
// deciding create-vs-reuse.
export interface DbDraftSummary {
  itinerary_id: number
  title: string
  total_places: number
  created_at?: string
  updated_at?: string
}

export async function fetchDbDraft(token: string): Promise<DbDraftSummary | null> {
  const items = await bffFetch<DbDraftSummary[]>(
    '/me/itineraries?status=draft&limit=1',
    { token },
  )
  return items?.[0] ?? null
}

/** Flatten BFF days into a single ordered stop list with a global stop_order
 *  (1-based, day order then visit order) — the frontend contract has no
 *  day-scoped ordering, only the flat stop_order. */
export function flattenBffDays(days: BffDay[] | null): Array<{ place: BffPlace; day: number; order: number }> {
  const flat: Array<{ place: BffPlace; day: number; order: number }> = []
  const sortedDays = [...(days ?? [])].sort((a, b) => a.day_number - b.day_number)
  let order = 0
  for (const day of sortedDays) {
    const places = [...(day.places ?? [])].sort((a, b) => a.visit_order - b.visit_order)
    for (const place of places) {
      order += 1
      flat.push({ place, day: day.day_number, order })
    }
  }
  return flat
}

/** Convert fetched BFF days back into the PUT /itineraries/:id body (full replace). */
export function daysToPutPayload(days: BffDay[] | null) {
  return (days ?? []).map(d => ({
    day_number: d.day_number,
    places: (d.places ?? []).map(p => ({
      poi_id:       p.poi_id,
      visit_order:  p.visit_order,
      travel_mode:  p.travel_mode ?? 'walking',
      note:         p.note ?? null,
      duration_min: p.duration_min ?? null,
    })),
  }))
}

/** Map a BFF itinerary (get_itinerary / get_public_itinerary shape) to the
 *  frontend ItineraryDetail contract. */
export function mapBffToDetail(bff: BffItinerary): ItineraryDetail {
  const flat = flattenBffDays(bff.days)

  const stops: ItineraryStop[] = flat.map(({ place, day, order }) => ({
    stop_order:     order,
    day,
    duration_min:   place.duration_min ?? DEFAULT_DURATION_MIN,
    transport_mode: toFrontMode(place.travel_mode),
    notes:          place.note ?? null,
    poi: {
      poi_id:            String(place.poi_id),
      name_preferred:    null,
      name_en:           place.translations?.en?.name ?? place.name_ko ?? '',
      name_ko:           place.name_ko ?? '',
      primary_image_url: place.primary_image_url ?? null,
      display_domain:    '',
      coords_lat:        place.coords_lat ?? 0,
      coords_lng:        place.coords_lng ?? 0,
    },
  }))

  // Legs come from leg_to_next (routing.route_leg — real road path when the
  // POIs fall inside the loaded road network, straight-line approximation
  // otherwise) between consecutive stops of the same day. transport_mode of
  // the leg = travel_mode of the FROM stop.
  const legs: ItineraryLeg[] = []
  for (let i = 0; i < flat.length - 1; i++) {
    const from = flat[i]
    const next = flat[i + 1]
    const leg = from.place.leg_to_next
    if (!leg || from.day !== next.day) continue
    const coords = leg.geometry?.coordinates ?? []
    legs.push({
      from_stop_order:      from.order,
      to_stop_order:        next.order,
      estimated_duration_s: leg.duration_sec,
      distance_m:           leg.distance_m,
      transport_mode:       toFrontMode(from.place.travel_mode),
      // GeoJSON coordinates are [lng, lat] — flip to {lat, lng} for map SDKs.
      path:                 coords.map(([lng, lat]) => ({ lat, lng })),
    })
  }

  const legMinutes  = legs.reduce((sum, l) => sum + Math.round(l.estimated_duration_s / 60), 0)
  const stayMinutes = stops.reduce((sum, s) => sum + s.duration_min, 0)
  const distance    = legs.reduce((sum, l) => sum + l.distance_m, 0)

  return {
    id:                 String(bff.itinerary_id),
    title:              bff.title,
    is_partner:         bff.is_partner ?? false,
    is_published:       bff.is_public ?? false,
    share_url:          null,
    like_count:         bff.like_count ?? 0,
    save_count:         bff.save_count ?? 0,
    total_duration_min: stayMinutes + legMinutes,
    distance_m:         legs.length > 0 ? distance : null,
    author: {
      id:             bff.author ? String(bff.author.user_id) : '',
      name_preferred: bff.author?.name ?? null,
      name_en:        bff.author?.name ?? null,
      name_ko:        null,
      avatar_url:     bff.author?.avatar_url ?? null,
    },
    stops,
    legs,
    related: [],   // no BFF source yet — honest empty list (contract keeps the field)
    viewer: {
      is_liked: bff.viewer?.is_liked ?? false,
      is_saved: bff.viewer?.is_saved ?? false,
    },
  }
}
