import useSWR from 'swr'
import { useLocale } from 'next-intl'
import { fetcher } from '@/lib/fetcher'
import type { ExploreData } from '@/app/api/explore/[category]/route'

export function useExplore(category: string) {
  const locale = useLocale()
  const { data, error, isLoading, mutate } = useSWR<ExploreData>(
    [`/api/explore/${category}`, locale],
    ([url]) => fetcher<ExploreData>(url),
    { revalidateOnFocus: false }
  )
  return { data, isLoading, isError: !!error, mutate }
}
