'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { Place } from '@/types/supabase'

export function useSearch(query: string, locale: string) {
  const trimmed = query.trim()
  const key = trimmed ? `/api/search?q=${encodeURIComponent(trimmed)}&lang=${locale}` : null

  const { data, error, isLoading } = useSWR<Place[]>(key, fetcher, {
    dedupingInterval: 5_000,
    revalidateOnFocus: false,
  })

  return {
    results: data ?? [],
    loading: !!trimmed && isLoading,
    error: error?.message ?? null,
  }
}
