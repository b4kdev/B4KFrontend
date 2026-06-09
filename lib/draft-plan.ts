import type { MapPoi } from '@/hooks/useMapPois'

export interface DraftPlan {
  stops: MapPoi[]
  durations: Record<string, number>
  transport: 'car' | 'public'
  name?: string
}

const KEY = 'b4k_draft_plan'

export function saveDraftPlan(plan: DraftPlan): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(KEY, JSON.stringify(plan))
}

export function getDraftPlan(): DraftPlan | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as DraftPlan } catch { return null }
}

export function clearDraftPlan(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(KEY)
}
