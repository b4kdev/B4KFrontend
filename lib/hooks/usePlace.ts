'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { Place } from '@/types/supabase'

export function usePlace(id: string, locale: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true
  const key = enabled && id ? `/api/places/${encodeURIComponent(id)}?lang=${locale}` : null

  const { data, error, isLoading } = useSWR<Place>(key, fetcher, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
  })

  return {
    place: data ?? null,
    loading: enabled && !!id && isLoading,
    error: error?.message ?? null,
  }
}
