import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { ItineraryDetail, ItineraryLeg } from '@/app/api/plans/[id]/route'
import type { PlanMeta } from '@/app/api/plans/[id]/meta/route'

export type { ItineraryDetail, ItineraryLeg }

export function useItinerary(id: string) {
  const { data, error, isLoading, mutate } = useSWR<ItineraryDetail | { error: string }>(
    `/api/plans/${id}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const errData = data as { error?: string } | undefined
  const isPrivate  = errData?.error === 'private'
  const isNotFound = errData?.error === 'not_found'
  const itinerary  = !isPrivate && !isNotFound && data ? data as ItineraryDetail : null

  return { itinerary, isLoading, isError: !!error, isPrivate, isNotFound, mutate }
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
