// Where a place was found before it went into a plan: stored on each plan stop so partners and
// the team can see which screens lead to plans. The shell remembers the last screen; the map
// reads it for a place opened from another screen (/map?poi=…).

export type PlaceSource = 'explore' | 'home' | 'map' | 'search' | 'collection' | 'guide' | 'quick_plan' | 'saved' | 'shared_plan'
export type PlanFlow = 'manual' | 'quick_plan' | 'from_saved'

export const PLACE_SOURCES: readonly PlaceSource[] = ['explore', 'home', 'map', 'search', 'collection', 'guide', 'quick_plan', 'saved', 'shared_plan']
export const PLAN_FLOWS: readonly PlanFlow[] = ['manual', 'quick_plan', 'from_saved']

// The last screen the shell saw. The map reads it while it mounts, before the shell has moved on
// to the map's own address, so it is the screen the person came from (empty after a page load).
let last = ''

/** Called by the shell on every route change. */
export function rememberPath(path: string) {
  last = path
}

/** The source for a place opened from the screen before the map; 'map' when there is none. */
export function previousScreenSource(): PlaceSource {
  // Without the language prefix and the preview segment: /en/v2/explore/… → /explore/…
  const path = last.replace(/^\/[a-z]{2}(-[A-Z]{2})?(?=\/|$)/, '').replace(/^\/v2(?=\/|$)/, '') || (last ? '/' : '')
  if (path.startsWith('/explore/collections/')) return 'collection'
  if (path.includes('/guides')) return 'guide'
  if (path.startsWith('/explore')) return 'explore'
  if (path.startsWith('/search')) return 'search'
  if (path.startsWith('/saved')) return 'saved'
  if (path.startsWith('/plan/')) return 'shared_plan'
  if (path === '/') return 'home'
  return 'map'
}
