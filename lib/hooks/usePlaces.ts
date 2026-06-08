'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { Place } from '@/types/supabase'

export function usePlaces(locale: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true
  const key = enabled ? `/api/places?lang=${locale}` : null

  const { data, error, isLoading } = useSWR<Place[]>(key, fetcher, {
    dedupingInterval: 30_000,
    revalidateOnFocus: false,
  })

  return {
    places: data ?? [],
    loading: enabled && isLoading,
    error: error?.message ?? null,
  }
}
