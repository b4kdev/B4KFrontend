// Every page is on the new design (components/v2, PD-53 update 2). middleware.ts rewrites
// /[locale]<path> to the v2 screen at /[locale]/v2<path> (the address stays the same; an unknown
// path gets the v2 Page not found) and redirects the old preview address /[locale]/v2<path> to
// /[locale]<path>. The pre-v2 screens and their styles are gone.

// Old addresses without a v2 screen of their own that now land on one (307, query kept).
export const V2_LIVE_ALIASES: Readonly<Record<string, string>> = {
  '/plan': '/map?plan=new', // Start a plan: the map with a new Plan cart pulled up
  '/profile/trips': '/profile',
  '/profile/saved': '/saved',
  '/profile/badges': '/badges',
  '/profile/settings': '/settings',
}

// Old entry points that only redirect (to /map and /saved): served by their own pages.
const V2_LIVE_EXCEPT = ['/plan/ai', '/plan/auto', '/plan/manual']

/** Request header middleware.ts sets on a rewritten request, for the v2 layout's metadata. */
export const V2_LIVE_HEADER = 'x-b4k-v2-live'

const norm = (path: string) => (path === '' ? '/' : path.replace(/\/+$/, '') || '/')

/** True when a path without the locale ('' or '/explore/k-pop') is served by a v2 screen. */
export function isV2Live(path: string): boolean {
  const p = norm(path)
  return !V2_LIVE_EXCEPT.includes(p) && !(p in V2_LIVE_ALIASES)
}

/** Where an aliased live path (see V2_LIVE_ALIASES) now lives, or null. */
export function v2LiveAlias(path: string): string | null {
  return V2_LIVE_ALIASES[norm(path)] ?? null
}

/**
 * The area segment of a v2 page's address, live or preview: '/en/explore/k-pop' and
 * '/en/v2/explore/k-pop' both give 'explore', '/en' and '/en/v2' give ''.
 */
export function v2Area(pathname: string): string {
  return pathname.split('/').filter(Boolean).slice(1).filter((s, i) => !(i === 0 && s === 'v2'))[0] ?? ''
}
