// Areas of the new design (components/v2) that serve the live routes (PD-53 update 2, Option A).
// For a listed path, middleware.ts rewrites /[locale]<path> to the v2 screen at
// /[locale]/v2<path> (the address stays the same) and redirects the old preview address
// /[locale]/v2<path> to /[locale]<path>. The live screens stay in the code base: removing a line
// here switches that area back.
//
// '/' is Home and matches only itself; any other entry matches itself and everything below it.
export const V2_LIVE_PATHS: readonly string[] = [
  '/', // A2 Home
  '/explore', // A2 Explore: categories, see all, collections, special pages
  '/map', // A1 Map, plan in progress, Quick plan hand-off
  '/plan', // A1 Published plan (/plan/[id]); /plan itself and its old entry points: V2_LIVE_ALIASES
  '/place', // A1 Place page (/place/[poiId]): the map with the place selected
  '/saved', // A3 Saved, Plan from saved
  '/profile', // A3 Profile (own, visitor); the old own-profile tabs: V2_LIVE_ALIASES
  '/badges', // A3
  '/leaderboard', // A3
  '/notifications', // A3
  '/settings', // A3, A5 Language and theme
  '/login', // A4 Sign in
  '/auth/reset-password', // A4 (/auth/callback stays: it has no screen)
  '/consent', // A4 Consent step
  '/search', // A4
  '/legal', // A4 Terms, Privacy, Cookies
  '/help', // A4
]

// Live addresses without a v2 screen of their own that now land on one (307, query kept).
// The /plan/ai, /plan/auto and /plan/manual pages stay: they only redirect to /map and /saved.
export const V2_LIVE_ALIASES: Readonly<Record<string, string>> = {
  '/plan': '/profile', // the empty "My plans" page; own plans are on the profile
  '/profile/trips': '/profile',
  '/profile/saved': '/saved',
  '/profile/badges': '/badges',
  '/profile/settings': '/settings',
}

const V2_LIVE_EXCEPT = ['/plan/ai', '/plan/auto', '/plan/manual']

/** Request header middleware.ts sets on a rewritten request, for the v2 layout's metadata. */
export const V2_LIVE_HEADER = 'x-b4k-v2-live'

const norm = (path: string) => (path === '' ? '/' : path.replace(/\/+$/, '') || '/')

/** True when a path without the locale ('' or '/explore/k-pop') is served by a v2 screen. */
export function isV2Live(path: string): boolean {
  const p = norm(path)
  if (V2_LIVE_EXCEPT.includes(p) || p in V2_LIVE_ALIASES) return false
  return V2_LIVE_PATHS.some((e) => (e === '/' ? p === '/' : p === e || p.startsWith(`${e}/`)))
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
