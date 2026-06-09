import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { ExploreData } from '@/app/api/explore/[category]/route'

export function useExplore(category: string) {
  const { data, error, isLoading, mutate } = useSWR<ExploreData>(
    `/api/explore/${category}`,
    fetcher,
    { revalidateOnFocus: false }
  )
  return { data, isLoading, isError: !!error, mutate }
}
