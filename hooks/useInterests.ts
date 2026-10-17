import { useMemo } from 'react'
import useSWR from 'swr'
import { apiFetch } from '@/lib/api'
import { visibleCategories, type InterestsResponse } from '@/lib/quickplan'

// GET /interests — 비로그인 가능, 택소노미는 배포 때만 바뀌므로 (BFF 도 max-age=300) 재검증 최소화.
// `enabled=false` 면 모달이 닫혀 있는 동안 호출하지 않는다.
export function useInterests(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? '/interests' : null,
    (path: string) => apiFetch<InterestsResponse>(path),
    { revalidateOnFocus: false, dedupingInterval: 5 * 60 * 1000 },
  )
  const categories = useMemo(() => visibleCategories(data?.categories ?? []), [data])
  return { categories, isLoading, isError: !!error, retry: () => mutate() }
}
