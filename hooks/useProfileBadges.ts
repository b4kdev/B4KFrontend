import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { ProfileBadge } from '@/app/api/profile/badges/route'

export function useProfileBadges() {
  return useSWR<ProfileBadge[]>('/api/profile/badges', fetcher)
}
