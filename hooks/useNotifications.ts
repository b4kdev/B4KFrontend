import useSWRInfinite from 'swr/infinite'
import { fetcher } from '@/lib/fetcher'
import type { NotificationsData } from '@/app/api/notifications/route'

// SPEC-12: 20/page. useSWRInfinite keeps each page's response cached separately
// so a "load more" click only fetches the next page, not the whole list again.
const PAGE_SIZE = 20

export function useNotifications() {
  const { data, error, isLoading, isValidating, mutate, size, setSize } = useSWRInfinite<NotificationsData>(
    (pageIndex, previousPageData) => {
      if (previousPageData && previousPageData.notifications.length < PAGE_SIZE) return null
      return `/api/notifications?limit=${PAGE_SIZE}&offset=${pageIndex * PAGE_SIZE}`
    },
    fetcher,
    { revalidateOnFocus: false, revalidateFirstPage: false },
  )

  const notifications = data ? data.flatMap(page => page.notifications) : []
  const unread_count = data?.[0]?.unread_count ?? 0
  const hasMore = !!data && data[data.length - 1]?.notifications.length === PAGE_SIZE
  const isLoadingMore = isValidating && size > 1

  return {
    data: data ? { notifications, unread_count } : undefined,
    isLoading,
    isError: !!error,
    mutate,
    hasMore,
    isLoadingMore,
    loadMore: () => setSize(size + 1),
  }
}
