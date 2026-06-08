import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { ProfileData } from '@/app/api/profile/route'

export function useProfile() {
  return useSWR<ProfileData>('/api/profile', fetcher)
}
