import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { BadgesData } from '@/app/api/badges/route'

export function useBadges() {
  const { data, error, isLoading, mutate } = useSWR<BadgesData>(
    '/api/badges', fetcher, { revalidateOnFocus: false }
  )
  return { data, isLoading, isError: !!error, mutate }
}
