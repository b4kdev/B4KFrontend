export type Domain =
  | "ktourism"
  | "kfood"
  | "kbeauty"
  | "kshopping"
  | "klodging"
  | "kleisure"

export interface Place {
  place_id: number
  name_ko: string
  address_ko: string | null
  address_en: string | null
  display_domain: Domain | null
  domains: Domain[] | null
  display_region: string | null
  coords_lat: number | null
  coords_lng: number | null
  primary_image_url: string | null
  quality_score: number | null
  translations: {
    en?: { name?: string; description?: string }
    ja?: { name?: string; description?: string }
    [lang: string]: { name?: string; description?: string } | undefined
  }
  extra_info: Record<string, unknown>
  is_publishable: boolean
}
