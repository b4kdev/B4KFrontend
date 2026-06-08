import useSWR from 'swr'
import type { MapPoi } from '@/app/api/map/pois/route'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useMapPois(region: string | null, activeFilters: string[]) {
  const params = new URLSearchParams()
  if (region) params.set('region', region)
  if (activeFilters.length > 0) params.set('categories', activeFilters.join(','))

  const { data, error, isLoading } = useSWR(
    `/api/map/pois?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    pois: (data?.pois ?? []) as MapPoi[],
    isLoading,
    isError: !!error,
  }
}

export type { MapPoi }
