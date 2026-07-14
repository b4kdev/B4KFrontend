import 'server-only'
import { db } from "./supabase"
import type { Domain, Place } from "../types/place"

export async function getHotPlaces(limit = 10) {
  const { data, error } = await db
    .from("places_snapshot")
    .select("poi_id, name_ko, address_ko, address_en, display_domain, domains, display_region, primary_image_url, extra_info, quality_score")
    .eq("is_publishable", true)
    .order("quality_score", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getPlacesByDomain(domain: Domain, page = 1, limit = 20) {
  const from = (page - 1) * limit
  const { data, error, count } = await db
    .from("places_snapshot")
    .select(
      "poi_id, name_ko, address_ko, address_en, display_domain, domains, display_region, primary_image_url, quality_score, extra_info",
      { count: "exact" }
    )
    .eq("is_publishable", true)
    .contains("domains", [domain])
    .order("quality_score", { ascending: false })
    .range(from, from + limit - 1)

  if (error) throw error
  return { data: data ?? [], total: count ?? 0 }
}

export async function searchPlaces(keyword: string) {
  if (!keyword.trim()) return []
  const { data, error } = await db
    .from("places_snapshot")
    .select("poi_id, name_ko, address_ko, address_en, display_domain, domains, primary_image_url")
    .eq("is_publishable", true)
    .or(`name_ko.ilike.%${keyword}%,address_ko.ilike.%${keyword}%`)
    .limit(30)

  if (error) throw error
  return data ?? []
}

export async function getPlace(placeId: number): Promise<Place | null> {
  const { data, error } = await db
    .from("places_snapshot")
    .select("*")
    .eq("poi_id", placeId)
    .eq("is_publishable", true)
    .single()

  if (error?.code === "PGRST116") return null
  if (error) throw error
  return data as Place
}

export async function getPlacePins(
  bounds: { north: number; south: number; east: number; west: number },
  domain?: Domain
) {
  let query = db
    .from("places_snapshot")
    .select("poi_id, name_ko, address_ko, address_en, coords_lat, coords_lng, display_domain")
    .eq("is_publishable", true)
    .not("coords_lat", "is", null)
    .gte("coords_lat", bounds.south)
    .lte("coords_lat", bounds.north)
    .gte("coords_lng", bounds.west)
    .lte("coords_lng", bounds.east)
    .limit(300)

  if (domain) query = query.eq("display_domain", domain)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
