import useSWR from 'swr'
import { fetcher, type FetchError } from '@/lib/fetcher'
import type { ItineraryDetail, ItineraryLeg } from '@/app/api/plans/[id]/route'
import type { PlanMeta } from '@/app/api/plans/[id]/meta/route'

export type { ItineraryDetail, ItineraryLeg }

export function useItinerary(id: string) {
  const { data, error, isLoading, mutate } = useSWR<ItineraryDetail>(
    `/api/plans/${id}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const status     = (error as FetchError | undefined)?.status
  const isPrivate  = status === 403
  const isNotFound = status === 404
  const isError    = !!error && !isPrivate && !isNotFound
  const itinerary  = data ?? null

  return { itinerary, isLoading, isError, isPrivate, isNotFound, mutate }
}

// SC-35 (S-DEGJDE) — ownership is never read off the main itinerary payload
// (that response is identical for every viewer). Separate authenticated call.
export function useItineraryMeta(id: string | null) {
  const { data, isLoading } = useSWR<PlanMeta>(
    id ? `/api/plans/${id}/meta` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return { isOwner: data?.isOwner ?? false, isLoading }
}
