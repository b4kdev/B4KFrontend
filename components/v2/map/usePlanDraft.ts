'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MapPoi } from '@/hooks/useMapPois'
import { clearDraftPlan, getDraftPlan, saveDraftPlan, type DraftPlan } from '@/lib/draft-plan'

// The plan in progress (PD-26, PD-28, PD-30): the same draft as the live map (localStorage
// b4k_draft_plan), so "Continue your plan" works on both. Limits from PD-30 (update): 8 days,
// 6 stops a day, 48 stops.

export const MAX_DAYS = 8
export const PER_DAY = 6
export const MAX_STOPS = 48
export const DURATIONS = [30, 60, 90, 120, 180, 240] as const

export function usePlanDraft() {
  const [plan, setPlan] = useState<DraftPlan>({ stops: [], durations: {}, days: {} })
  const [days, setDays] = useState(1)
  useEffect(() => {
    const d = getDraftPlan()
    if (d) {
      setPlan({ ...d, days: d.days ?? {} })
      setDays(Math.max(1, ...Object.values(d.days ?? {})))
    }
  }, [])
  const commit = useCallback((next: DraftPlan) => {
    setPlan(next)
    if (next.stops.length) saveDraftPlan(next)
    else clearDraftPlan()
  }, [])
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
  const setDuration = (id: string, min: number) => commit({ ...plan, durations: { ...plan.durations, [id]: min } })
  const addDay = () => setDays((d) => Math.min(MAX_DAYS, d + 1))
  const replace = (stops: MapPoi[], dayMap: Record<string, number>, name?: string, durations?: Record<string, number>) => {
    setDays(Math.max(1, ...Object.values(dayMap)))
    commit({ stops, durations: Object.fromEntries(stops.map((s) => [s.poi_id, durations?.[s.poi_id] ?? 60])), days: dayMap, name })
  }
  const discard = () => {
    clearDraftPlan()
    setPlan({ stops: [], durations: {}, days: {} })
    setDays(1)
  }
  return { plan, days, dayOf, countOn, add, remove, setDuration, addDay, replace, discard }
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
