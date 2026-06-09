import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { SavedData } from '@/app/api/saved/route'

export function useSaved() {
  const { data, error, isLoading, mutate } = useSWR<SavedData>(
    '/api/saved', fetcher, { revalidateOnFocus: false }
  )
  return { data, isLoading, isError: !!error, mutate }
}
