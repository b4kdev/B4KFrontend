import useSWR from 'swr'
import type { HomeData } from '@/app/api/home/route'

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('fetch failed')
    return r.json()
  })

export function useHome() {
  const { data, error, isLoading, mutate } = useSWR<HomeData>('/api/home', fetcher)
  return {
    topPlans:    data?.topPlans    ?? [],
    seasonalPois: data?.seasonalPois ?? [],
    isLoading,
    isError: !!error,
    mutate,
  }
}
