import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { NotificationsData } from '@/app/api/notifications/route'

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<NotificationsData>(
    '/api/notifications', fetcher, { revalidateOnFocus: false }
  )
  return { data, isLoading, isError: !!error, mutate }
}
