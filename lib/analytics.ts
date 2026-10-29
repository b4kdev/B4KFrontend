// GA4 launch events, snake_case. No-ops without window.gtag (SSR, script not yet loaded, or no
// Accept yet: Analytics.tsx loads gtag only after Accept), so track() needs no consent check of its own.
// Fields carry no ids, emails, names, typed text or exact dates: counts, categories and slugs only.

// An edit saves an existing plan (plan_save only), so it is not a plan_create flow.
type PlanFlow = 'quick_plan' | 'from_saved' | 'manual'

// method: the Supabase provider id as-is (email, google, ...).
type AnalyticsEventMap = {
  sign_up: { method: string }
  sign_in: { method: string; is_new_user: boolean }
  search: { result_count: number; category?: string }
  poi_view: { category?: string; area?: string; source?: PlaceSource }
  poi_save: { action: 'save' | 'unsave'; category?: string }
  plan_create: { flow: PlanFlow; days: number; stops: number }
  plan_save: { days: number; stops: number; is_public: boolean }
  share_click: { target: 'native' | 'link'; content_type: 'place' | 'plan' }
  lang_switch: { from: string; to: string }
  outbound_click: { domain: string; content_type: 'place' | 'package' }
  // An Explore card opened: its kind and its place in the row or grid (1 = first).
  explore_card_open: { card_type: 'theme' | 'collection' | 'guide' | 'package'; position: number }
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

// Where a place was opened from: the page before it, or the map itself.
export type PlaceSource = 'explore' | 'home' | 'map' | 'search' | 'collection' | 'guide' | 'quick_plan' | 'saved' | 'shared_plan'

type BaseParams = { locale: string; screen_id: string }

export function track<E extends keyof AnalyticsEventMap>(
  event: E,
  params: AnalyticsEventMap[E] & BaseParams
): void {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', event, params)
}

// Page addresses sent to analytics and error tools keep only campaign tags (utm_*): a search
// text, an id or a token in the query never leaves the browser.
export function withoutQuery(url: string): string {
  try {
    const u = new URL(url, 'https://x.invalid')
    const keep = new URLSearchParams()
    u.searchParams.forEach((v, k) => { if (k.startsWith('utm_')) keep.append(k, v) })
    u.search = keep.toString()
    u.hash = ''
    return url.startsWith('/') ? u.pathname + u.search : u.toString()
  } catch {
    return url.split(/[?#]/)[0]
  }
}

// The outside site a link points to, for outbound_click (host only, never the path).
export function linkDomain(href: string): string | null {
  try {
    const u = new URL(href, window.location.href)
    return u.origin === window.location.origin ? null : u.hostname
  } catch {
    return null
  }
}

// The in-app page before the current one: client-side navigation leaves document.referrer as it was,
// so the shell notes each path as it changes.
let currentPath: string | null = null
let previousPath: string | null = null
export function notePath(path: string | null) {
  if (!path || path === currentPath) return
  previousPath = currentPath
  currentPath = path
}

// The place source for the page a visitor came from (locale prefix ignored); none for other pages
// or an entry from outside.
export function placeSourceFrom(path: string | null = previousPath): PlaceSource | undefined {
  if (!path) return undefined
  const p = path.replace(/^\/(en|ko|ja|zh-TW|pt-BR)(?=\/|$)/, '') || '/'
  if (p === '/' || p.startsWith('/explore/trending') || p.startsWith('/explore/popular-plans')) return 'home'
  if (p.startsWith('/explore/collections/')) return 'collection'
  if (p.startsWith('/explore/guides')) return 'guide'
  if (p.startsWith('/explore')) return 'explore'
  if (p.startsWith('/search')) return 'search'
  if (p.startsWith('/saved')) return 'saved'
  if (p.startsWith('/plan/auto') || p.startsWith('/plan/ai')) return 'quick_plan'
  if (p.startsWith('/plan/')) return 'shared_plan'
  if (p.startsWith('/map') || p.startsWith('/place/')) return 'map'
  return undefined
}

// A shared link tagged with where it came from (utm_* stays in analytics page views).
export function shareUrl(url: string, contentType: 'place' | 'plan'): string {
  try {
    const u = new URL(url)
    u.searchParams.set('utm_source', 'share')
    u.searchParams.set('utm_medium', contentType)
    return u.toString()
  } catch {
    return url
  }
}
