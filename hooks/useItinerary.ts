import { useMemo } from 'react'
import useSWR from 'swr'
import { fetcher, type FetchError } from '@/lib/fetcher'
import type { ItineraryDetail, ItineraryLeg, ItineraryStop } from '@/lib/itinerary'
import type { PlanMeta } from '@/app/api/plans/[id]/meta/route'

export type { ItineraryDetail, ItineraryLeg }

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown) => (typeof v === 'string' ? v : null)
const list = <T,>(v: unknown, keep: (x: unknown) => boolean = isObject): T[] => (Array.isArray(v) ? (v.filter(keep) as T[]) : [])

// The plan answer as the screen reads it. An answer without a stop list is not a plan: the screen
// shows its error state instead of throwing. Optional parts that are missing or of the wrong kind
// (title, author, viewer, legs, related plans) fall back to empty, so a partial plan still shows.
export function toItinerary(data: unknown): ItineraryDetail | null {
  if (!isObject(data) || !Array.isArray(data.stops)) return null
  const author = isObject(data.author) ? data.author : {}
  const viewer = isObject(data.viewer) ? data.viewer : {}
  return {
    ...(data as unknown as ItineraryDetail),
    title: text(data.title) ?? '',
    total_duration_min: typeof data.total_duration_min === 'number' ? data.total_duration_min : 0,
    author: { id: text(author.id) ?? '', name_preferred: text(author.name_preferred), name_en: text(author.name_en), name_ko: text(author.name_ko), avatar_url: text(author.avatar_url) },
    stops: list<ItineraryStop>(data.stops, (s) => isObject(s) && isObject(s.poi) && typeof s.stop_order === 'number'),
    legs: list<ItineraryLeg>(data.legs).map((l) => ({ ...l, path: Array.isArray(l.path) ? l.path : [] })),
    related: list(data.related),
    viewer: { is_liked: viewer.is_liked === true, is_saved: viewer.is_saved === true },
  }
}

export function useItinerary(id: string) {
  const { data, error, isLoading, mutate } = useSWR<ItineraryDetail>(
    `/api/plans/${id}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const itinerary  = useMemo(() => (data === undefined ? null : toItinerary(data)), [data])
  const status     = (error as FetchError | undefined)?.status
  const isPrivate  = status === 403
  const isNotFound = status === 404
  const isError    = (!!error && !isPrivate && !isNotFound) || (data !== undefined && !itinerary)

  return { itinerary, isLoading, isError, isPrivate, isNotFound, mutate }
}

// ownership is never read off the main itinerary payload
// (that response is identical for every viewer). Separate authenticated call.
export function useItineraryMeta(id: string | null) {
  const { data, isLoading } = useSWR<PlanMeta>(
    id ? `/api/plans/${id}/meta` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return { isOwner: data?.isOwner ?? false, isLoading }
}
