// service.places_snapshot — returned by /api/places and /api/places/[id]
export interface Place {
  place_id: string
  name_ko: string
  address_ko: string
  address_en: string
  translations: Record<string, { name?: string; address?: string }>
  extra_info: Record<string, unknown>
  coords_lat: number
  coords_lng: number
  display_domain: string
  display_region: string
  quality_score: number
  primary_image_url: string | null
  is_publishable: boolean
  updated_at: string
}

// /api/map/pins — name_ko only, no lang param
export interface PlacePin {
  place_id: string
  name_ko: string
  coords_lat: number
  coords_lng: number
  display_domain: string
}
