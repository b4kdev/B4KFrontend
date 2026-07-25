// GA4 event taxonomy — B4K-MVP-Sprint-Plan-2026-07-25.md §3. 10 locked events, snake_case.
// No-ops without window.gtag (script not yet loaded, or SSR) — GA4 Consent Mode v2 in
// Analytics.tsx already handles the privacy gate at the transport level, track() doesn't
// need its own consent check (see DEC-16).

// Supabase provider id, passed through as-is (email/google/apple/azure) — not narrowed to
// the taxonomy doc's literal names since Apple/Microsoft OAuth is still broken (BLK-18).
type PlanMethod = 'manual' | 'ai'
type ExploreDomain = 'kpop' | 'kdrama' | 'kbeauty' | 'kculture'

type AnalyticsEventMap = {
  sign_in: { method: string; is_new_user: boolean }
  poi_view: { poi_id: string; domain: string }
  poi_save: { poi_id: string }
  plan_create: { method: PlanMethod }
  plan_save: { plan_id: string; stop_count: number; method: PlanMethod }
  ai_open: { entry_point: string }
  ai_generate: { is_guest: boolean }
  content_hub_view: { domain: ExploreDomain }
  plan_share: { plan_id: string }
  lang_switch: { from: string; to: string }
}

type BaseParams = { locale: string; screen_id: string }

export function track<E extends keyof AnalyticsEventMap>(
  event: E,
  params: AnalyticsEventMap[E] & BaseParams
): void {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', event, params)
}
