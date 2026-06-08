import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { ProfileTrip } from '@/app/api/profile/trips/route'

export function useProfileTrips() {
  return useSWR<ProfileTrip[]>('/api/profile/trips', fetcher)
}
