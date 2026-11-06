import 'server-only'
import type { RidePage, RidesSnapshot } from './explore-rides-types'

// Explore rides for one category page, from the static snapshot (lib/explore-rides/<locale>.json,
// scripts/build-explore-rides.py). Read on the server, so a page sends only its own Collections and
// no BFF call happens at page view. A locale without a file gets the English snapshot.
const load = (locale: string): Promise<RidesSnapshot> =>
  import(`./explore-rides/${locale}.json`).then((m) => m.default as RidesSnapshot).catch(() => import('./explore-rides/en.json').then((m) => m.default as RidesSnapshot))

export async function getRidePage(category: string, locale: string): Promise<RidePage | null> {
  const snap = await load(locale)
  const page = snap.pages[category]
  if (!page) return null
  const slugs = new Set<string>([page.hero.slug])
  for (const r of page.rides) {
    if ('options' in r) r.options.forEach((o) => { slugs.add(o.slug); o.also?.forEach((s) => slugs.add(s)) })
    if ('groups' in r) r.groups.forEach((g) => g.slugs.forEach((s) => slugs.add(s)))
    if ('slugs' in r) r.slugs.forEach((s) => slugs.add(s))
    if ('slug' in r) slugs.add(r.slug)
    if ('side' in r) r.side.forEach((s) => slugs.add(s))
  }
  const cols: RidePage['cols'] = {}
  for (const s of slugs) if (snap.cols[s]) cols[s] = snap.cols[s]
  return { ...page, cols }
}
