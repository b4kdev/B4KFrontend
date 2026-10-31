import 'server-only'
import { bffFetch } from './bff'

// Public places and plans for the sitemaps (BFF GET /sitemap/places, /sitemap/plans): ids and
// the last change. Places go into files of PLACES_PER_FILE (each place has one URL per language).
export const PLACES_PER_FILE = 2000

export interface SitemapList {
  total: number
  items: { id: number; updated_at: string | null }[]
}

export const sitemapList = (kind: 'places' | 'plans', limit: number, offset = 0) =>
  bffFetch<SitemapList>(`/sitemap/${kind}?limit=${limit}&offset=${offset}`, { token: null, cache: undefined, next: { revalidate: 86400 } })

/** How many place sitemap files there are; 0 when the count cannot be read. */
export async function placeFileCount(): Promise<number> {
  const { total } = await sitemapList('places', 1).catch(() => ({ total: 0 }))
  return Math.ceil(total / PLACES_PER_FILE)
}
