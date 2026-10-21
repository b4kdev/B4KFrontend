'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { MapPoi } from '@/hooks/useMapPois'
import { clearDraftPlan, getDraftPlan, saveDraftPlan, type DraftPlan } from '@/lib/draft-plan'
import type { ItineraryDetail } from '@/lib/itinerary'

// The plan in progress (PD-26, PD-28, PD-30), stored as on the live map (UF-1): guests in
// localStorage (b4k_draft_plan), signed-in users in their account draft (/api/plans/draft,
// autosaved 800 ms after each change, loaded back on the next visit), so "Continue your plan"
// works on both and across devices. A published plan open for editing is not autosaved (it has
// its own Save changes). Limits from PD-30 (update): 8 days, 6 stops a day, 48 stops.

export const MAX_DAYS = 8
export const PER_DAY = 6
export const MAX_STOPS = 48
export const DURATIONS = [30, 60, 90, 120, 180, 240] as const

const AUTOSAVE_MS = 800

/** Fired by Quick plan / Plan from Saved after saveCourseHandoff, for a map that is already open. */
export const COURSE_HANDOFF_EVENT = 'b4k:course-handoff'

/** A saved plan as builder state (stops in order, day and duration per stop). */
export function itineraryToDraft(it: ItineraryDetail): { stops: MapPoi[]; days: Record<string, number>; durations: Record<string, number> } {
  const sorted = [...it.stops].sort((a, b) => a.stop_order - b.stop_order)
  const stops = sorted.map((s) => ({ poi_id: String(s.poi.poi_id), name_ko: s.poi.name_ko, name_en: s.poi.name_en, name_preferred: s.poi.name_preferred ?? undefined, coords_lat: s.poi.coords_lat, coords_lng: s.poi.coords_lng, display_region: null, primary_image_url: s.poi.primary_image_url ?? undefined })) as MapPoi[]
  return {
    stops,
    days: Object.fromEntries(sorted.map((s) => [String(s.poi.poi_id), s.day ?? 1])),
    durations: Object.fromEntries(sorted.map((s) => [String(s.poi.poi_id), s.duration_min])),
  }
}

async function deleteAccountDraft() {
  const res = await fetch('/api/plans/draft')
  const d = res.ok ? ((await res.json()) as { id: string } | null) : null
  if (d?.id) await fetch(`/api/plans/${d.id}`, { method: 'DELETE' })
}

export function usePlanDraft() {
  const { user, loading } = useAuth()
  const signedIn = !!user
  const [plan, setPlan] = useState<DraftPlan>({ stops: [], durations: {}, days: {} })
  const [days, setDays] = useState(1)
  // Changed here before the account draft came back: keep the change (as the live map does for
  // a Quick plan hand-off).
  const touched = useRef(false)
  const editing = useRef(false)
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; body: string } | null>(null)

  const show = useCallback((d: DraftPlan) => {
    setPlan({ ...d, days: d.days ?? {} })
    setDays(Math.max(1, ...Object.values(d.days ?? {})))
  }, [])
  useEffect(() => {
    const d = getDraftPlan()
    if (d) show(d)
  }, [show])
  // Signed in: the account draft. A device draft still in localStorage is left to the post-login
  // migration (V2DraftMigration), which moves it into the account or asks which one to keep.
  useEffect(() => {
    if (loading || !signedIn || touched.current || getDraftPlan()?.stops.length) return
    let gone = false
    fetch('/api/plans/draft')
      .then((r) => (r.ok ? (r.json() as Promise<{ id: string } | null>) : null))
      .then((d) => (d?.id ? fetch(`/api/plans/${d.id}`).then((r) => (r.ok ? (r.json() as Promise<ItineraryDetail>) : null)) : null))
      .then((it) => {
        if (!it || gone || touched.current) return
        const { stops, days: dayMap, durations } = itineraryToDraft(it)
        show({ stops, days: dayMap, durations, name: it.title || undefined })
      })
      .catch(() => {})
    return () => {
      gone = true
    }
  }, [loading, signedIn, show])

  const flush = useCallback(() => {
    const p = pending.current
    if (!p) return
    clearTimeout(p.timer)
    pending.current = null
    fetch('/api/plans/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: p.body, keepalive: true }).catch(() => {})
  }, [])
  // Leaving the page within the autosave delay still saves the last change.
  useEffect(() => flush, [flush])

  const commit = useCallback((next: DraftPlan) => {
    touched.current = true
    setPlan(next)
    if (!signedIn) {
      if (next.stops.length) saveDraftPlan(next)
      else clearDraftPlan()
      return
    }
    if (editing.current) return
    if (pending.current) clearTimeout(pending.current.timer)
    pending.current = null
    if (!next.stops.length) {
      deleteAccountDraft().catch(() => {})
      return
    }
    const body = JSON.stringify(next)
    pending.current = { body, timer: setTimeout(flush, AUTOSAVE_MS) }
  }, [signedIn, flush])
  const dayOf = (id: string) => plan.days?.[id] ?? 1
  const countOn = (day: number) => plan.stops.filter((s) => dayOf(s.poi_id) === day).length

  /** Adds to the given day, or the first day with room. Returns the day it went to, or null when full. */
  const add = (poi: MapPoi, preferDay?: number): number | null => {
    if (plan.stops.some((s) => s.poi_id === poi.poi_id)) return dayOf(poi.poi_id)
    if (plan.stops.length >= MAX_STOPS) return null
    let day = preferDay ?? days
    while (day <= MAX_DAYS && countOn(day) >= PER_DAY) day++
    if (day > MAX_DAYS) return null
    if (day > days) setDays(day)
    commit({ ...plan, stops: [...plan.stops, poi], durations: { ...plan.durations, [poi.poi_id]: plan.durations[poi.poi_id] ?? 60 }, days: { ...plan.days, [poi.poi_id]: day } })
    return day
  }
  const remove = (id: string) => {
    const { [id]: _d, ...durations } = plan.durations
    const { [id]: _y, ...rest } = plan.days ?? {}
    commit({ ...plan, stops: plan.stops.filter((s) => s.poi_id !== id), durations, days: rest })
  }
  /** Moves stop `id` to the slot of `toId` on the same day; other days' stops keep their slots. */
  const move = (id: string, toId: string) => {
    const day = dayOf(id)
    if (id === toId || dayOf(toId) !== day) return
    const ids = plan.stops.filter((s) => dayOf(s.poi_id) === day).map((s) => s.poi_id)
    const to = ids.indexOf(toId)
    ids.splice(ids.indexOf(id), 1)
    ids.splice(to, 0, id)
    const byId = new Map(plan.stops.map((s) => [s.poi_id, s]))
    let i = 0
    commit({ ...plan, stops: plan.stops.map((s) => (dayOf(s.poi_id) === day ? byId.get(ids[i++])! : s)) })
  }
  const setDuration = (id: string, min: number) => commit({ ...plan, durations: { ...plan.durations, [id]: min } })
  const addDay = () => setDays((d) => Math.min(MAX_DAYS, d + 1))
  /** Deletes day `n` with its stops; later days move up one. The first day of a one-day plan stays. */
  const removeDay = (n: number) => {
    if (days <= 1) return
    const stops = plan.stops.filter((s) => dayOf(s.poi_id) !== n)
    const dayMap = Object.fromEntries(stops.map((s) => [s.poi_id, dayOf(s.poi_id) > n ? dayOf(s.poi_id) - 1 : dayOf(s.poi_id)]))
    const durations = Object.fromEntries(stops.map((s) => [s.poi_id, plan.durations[s.poi_id] ?? 60]))
    setDays((d) => Math.max(1, d - 1))
    commit({ ...plan, stops, days: dayMap, durations })
  }
  /** Replaces the plan; `editing` marks a published plan open for editing (not autosaved). */
  const replace = (stops: MapPoi[], dayMap: Record<string, number>, name?: string, durations?: Record<string, number>, opts?: { editing?: boolean }) => {
    editing.current = !!opts?.editing
    setDays(Math.max(1, ...Object.values(dayMap)))
    commit({ stops, durations: Object.fromEntries(stops.map((s) => [s.poi_id, durations?.[s.poi_id] ?? 60])), days: dayMap, name })
  }
  const discard = () => {
    touched.current = true
    if (pending.current) clearTimeout(pending.current.timer)
    pending.current = null
    clearDraftPlan()
    if (signedIn && !editing.current) deleteAccountDraft().catch(() => {})
    editing.current = false
    setPlan({ stops: [], durations: {}, days: {} })
    setDays(1)
  }
  return { plan, days, dayOf, countOn, add, remove, move, setDuration, addDay, removeDay, replace, discard }
}

export function formatMinutes(min: number, f: (key: string, v: Record<string, number>) => string) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h && m ? f('itinerary.duration.hoursMinutes', { h, m }) : h ? f('itinerary.duration.hours', { h }) : f('itinerary.duration.minutes', { m })
}

/** Straight-line estimate between two stops (as live until the plan is saved, PD-26). */
export function legMinutes(a: MapPoi, b: MapPoi) {
  const R = 6371e3
  const toR = (x: number) => (x * Math.PI) / 180
  const dLat = toR(b.coords_lat - a.coords_lat)
  const dLng = toR(b.coords_lng - a.coords_lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.coords_lat)) * Math.cos(toR(b.coords_lat)) * Math.sin(dLng / 2) ** 2
  const meters = 2 * R * Math.asin(Math.sqrt(h))
  return Math.max(5, Math.round(meters / 1.3 / 60 / 5) * 5 + 5)
}
