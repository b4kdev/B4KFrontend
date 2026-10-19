// Areas of the new design (components/v2) that serve the live routes, one area at a time
// (PD-53 update 2, Option A). For a listed path, middleware.ts rewrites /[locale]<path> to the v2
// screen at /[locale]/v2<path> (the address stays the same) and redirects the old preview address
// /[locale]/v2<path> to /[locale]<path>. The live screens stay in the code base: removing a line
// here switches that area back.
//
// '/' is Home and matches only itself; any other entry matches itself and everything below it.
export const V2_LIVE_PATHS: readonly string[] = [
  '/', // A2 Home
  '/explore', // A2 Explore: categories, see all, collections, special pages
]

/** Request header middleware.ts sets on a rewritten request, for the v2 layout's metadata. */
export const V2_LIVE_HEADER = 'x-b4k-v2-live'

/** True when a path without the locale ('' or '/explore/k-pop') is served by a v2 screen. */
export function isV2Live(path: string): boolean {
  const p = path === '' ? '/' : path.replace(/\/+$/, '') || '/'
  return V2_LIVE_PATHS.some((e) => (e === '/' ? p === '/' : p === e || p.startsWith(`${e}/`)))
}

/**
 * The area segment of a v2 page's address, live or preview: '/en/explore/k-pop' and
 * '/en/v2/explore/k-pop' both give 'explore', '/en' and '/en/v2' give ''.
 */
export function v2Area(pathname: string): string {
  return pathname.split('/').filter(Boolean).slice(1).filter((s, i) => !(i === 0 && s === 'v2'))[0] ?? ''
}
