'use client'

import { useEffect, useState } from 'react'
import type { MapPoi } from '@/hooks/useMapPois'

// Leg times while a plan is built come from the backend's route engine (the same one that times a
// saved plan's legs). The browser calls it directly, so each visitor counts against the engine's
// per-IP limit on their own; a server-side relay would make every visitor share one address.
// Draft legs have no transport mode yet; a saved plan's legs start as walking, so the draft asks
// for walking too and shows what the saved plan will show. Until an answer comes, or when the call
// fails, the walking estimate stays (legMinutes).

const ROUTE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/osrm` : null
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const MODE = 'walking'

// Minutes per stop pair, kept for the visit: the engine caches pairs too, so a pair is asked once.
const known = new Map<string, number>()
const asked = new Set<string>()
const pairKey = (a: string, b: string) => `${a}>${b}`
const numeric = (id: string) => /^\d+$/.test(id)

type RouteAnswer = { legs?: { from_place_id: number; to_place_id: number; duration_sec: number }[] }

async function ask(ids: string[]): Promise<boolean> {
  if (!ROUTE_URL) return false
  const res = await fetch(ROUTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ place_ids: ids.map(Number), mode: MODE }),
  })
  if (!res.ok) return false
  const data = (await res.json()) as RouteAnswer
  for (const l of data.legs ?? []) known.set(pairKey(String(l.from_place_id), String(l.to_place_id)), Math.max(1, Math.round(l.duration_sec / 60)))
  return true
}

/**
 * Routed minutes for each leg of the draft (consecutive stops on the same day), keyed by
 * "fromId>toId"; a leg without an answer yet is missing, so the caller shows the estimate.
 * Only the days with a new pair are asked, a short moment after the plan stops changing.
 */
export function useRoutedLegs(order: MapPoi[], dayOf: (id: string) => number) {
  const [, setVersion] = useState(0)
  const days = new Map<number, string[]>()
  for (const p of order) {
    const d = dayOf(p.poi_id)
    days.set(d, [...(days.get(d) ?? []), p.poi_id])
  }
  const runs = Array.from(days.values()).filter((ids) => ids.length >= 2 && ids.every(numeric))
  const signature = runs.map((ids) => ids.join(',')).join('|')

  useEffect(() => {
    const todo = runs.filter((ids) => ids.slice(1).some((id, i) => !known.has(pairKey(ids[i], id)) && !asked.has(pairKey(ids[i], id))))
    if (!todo.length) return
    let live = true
    const timer = setTimeout(() => {
      for (const ids of todo) {
        const pairs = ids.slice(1).map((id, i) => pairKey(ids[i], id))
        pairs.forEach((k) => asked.add(k))
        ask(ids)
          .then((ok) => {
            // A failed call may be tried again on the next change; the estimate shows meanwhile.
            if (!ok) pairs.forEach((k) => asked.delete(k))
            if (live) setVersion((v) => v + 1)
          })
          .catch(() => pairs.forEach((k) => asked.delete(k)))
      }
    }, 400)
    return () => {
      live = false
      clearTimeout(timer)
    }
    // runs is rebuilt every render; its signature says when the stops changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  return (a: string, b: string) => known.get(pairKey(a, b))
}
