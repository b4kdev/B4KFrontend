import type { MapPoi } from '@/hooks/useMapPois'

export interface DraftPlan {
  stops:     MapPoi[]
  durations: Record<string, number>
  /** poi_id → 일차 탭(1–7). 없으면(이전 버전 초안) 전부 1일차. */
  days?:     Record<string, number>
  name?:     string
}

const KEY = 'b4k_draft_plan'

export function saveDraftPlan(plan: DraftPlan): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(plan))
}

export function getDraftPlan(): DraftPlan | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as DraftPlan } catch { return null }
}

export function clearDraftPlan(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}
