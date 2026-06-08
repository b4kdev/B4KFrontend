import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { ItineraryDetail } from '@/app/api/itinerary/[id]/route'

export type { ItineraryDetail }

export function useItinerary(id: string) {
  const { data, error, isLoading, mutate } = useSWR<ItineraryDetail | { error: string }>(
    `/api/itinerary/${id}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const errData = data as { error?: string } | undefined
  const isPrivate  = errData?.error === 'private'
  const isNotFound = errData?.error === 'not_found'
  const itinerary  = !isPrivate && !isNotFound && data ? data as ItineraryDetail : null

  return { itinerary, isLoading, isError: !!error, isPrivate, isNotFound, mutate }
}
