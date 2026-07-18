import useSWR from 'swr'
import { useAuth } from '@/contexts/AuthContext'
import { fetcher } from '@/lib/fetcher'
import type { ProfileTrip } from '@/app/api/profile/trips/route'

// /api/profile/trips 401s when signed out (matches its sibling routes'
// hard auth guard) — gate the fetch on `user` so signed-out visitors see the
// empty state instead of a scary "couldn't load" error.
export function useProfileTrips() {
  const { user } = useAuth()
  return useSWR<ProfileTrip[]>(user ? '/api/profile/trips' : null, fetcher)
}
