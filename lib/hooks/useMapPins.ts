'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { PlacePin } from '@/types/supabase'

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

function boundsKey(bounds: MapBounds | null): string | null {
  if (!bounds) return null
  return `/api/map/pins?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}`
}

export function useMapPins(bounds: MapBounds | null) {
  const { data, error, isLoading } = useSWR<PlacePin[]>(boundsKey(bounds), fetcher, {
    dedupingInterval: 10_000,
    revalidateOnFocus: false,
  })

  return {
    pins: data ?? [],
    loading: !!bounds && isLoading,
    error: error?.message ?? null,
  }
}
