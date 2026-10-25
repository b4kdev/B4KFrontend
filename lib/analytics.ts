// GA4 event taxonomy — B4K-MVP-Sprint-Plan-2026-07-25.md §3. 10 locked events, snake_case.
// No-ops without window.gtag (SSR, script not yet loaded, or no Accept yet: Analytics.tsx
// loads gtag only after Accept), so track() needs no consent check of its own.

// Supabase provider id, passed through as-is (email/google/apple/azure) — not narrowed to
// the taxonomy doc's literal names since Apple/Microsoft OAuth is still broken.
type PlanMethod = 'manual' | 'ai'
type ExploreDomain = 'kpop' | 'kdrama' | 'kbeauty' | 'kfood' | 'kculture'

type AnalyticsEventMap = {
  sign_in: { method: string; is_new_user: boolean }
  poi_view: { poi_id: string; domain: string; region?: string }
  poi_save: { poi_id: string; region?: string }
  plan_create: { method: PlanMethod }
  plan_save: { plan_id: string; stop_count: number; method: PlanMethod }
  ai_open: { entry_point: string }
  ai_generate: { is_guest: boolean }
  content_hub_view: { domain: ExploreDomain }
  plan_share: { plan_id: string }
  lang_switch: { from: string; to: string }
  // KPI-MEASUREMENT-IMPLEMENTATION-PLAN-2026-07-27.md — closes V2/V3/S2/L1/G1/G3 data gaps.
  search: { query_raw: string; ui_language: string; result_count: number }
  outbound_click: { poi_id: string; type: 'poi' | 'package' }
  share_click: { section: string; method: string }
  // Quick plan answers, once per Make my plan: no exact dates and no ids.
  quick_plan_submit: {
    destination: string
    trip_days: number
    days_until_trip?: number
    trip_month?: string
    who_with?: string
    interests: string
    interest_count: number
    is_guest: boolean
  }
}

type BaseParams = { locale: string; screen_id: string }

export function track<E extends keyof AnalyticsEventMap>(
  event: E,
  params: AnalyticsEventMap[E] & BaseParams
): void {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', event, params)
}
