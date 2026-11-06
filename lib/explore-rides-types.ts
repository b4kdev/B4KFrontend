// Explore rides: the shape of the static snapshot (lib/explore-rides/<locale>.json, built by
// scripts/build-explore-rides.py from a read of the live Collections). A ride is one section of a
// category page that groups live Collections by what a visitor comes for (a dish, a show, an
// artist, a season, a town); the pick happens inside the ride. Every title, place and photo comes
// from a live Collection; the ride's own words come from the `gap.rides` messages by key.

/** A place inside a Collection. `region` is the place's display region as stored (Korean, 서울);
 * show it through regionName(). `name` is the locale name, `ko` the Korean name. */
export type RidePlace = {
  id: string
  name: string
  ko: string
  img: string | null
  region: string
}

/** A Collection as the rides show it. `head` and `sub` are the title split at its dash (the
 * subtitle may be empty). `regions` are the places' display regions, most common first. `count`
 * is the full number of places; `places` holds at most the first nine. */
export type RideCollection = {
  slug: string
  type: string
  ordered: boolean
  head: string
  sub: string
  hero: string | null
  count: number
  regions: string[]
  places: RidePlace[]
}

/** A choice's label: a ride label key (gap.rides.opt.<key>), a literal name taken from the data
 * (a show or a town as titled), or a display region to show through regionName(). */
export type RideLabel = { key: string } | { text: string } | { region: string }

/** One choice inside a picker ride: its label and the Collection it opens; `also` = more
 * Collections for the same choice, shown as rows under it. */
export type RideOption = { label: RideLabel; slug: string; also?: string[] }

/** A city or region tile: its label, its photo, how many Collections it has, and up to three of them. */
export type RideGroup = { label: RideLabel; img: string | null; count: number; slugs: string[] }

/** The renderer each ride uses; ids are stable (row-<id> anchors, the index and the phone chips). */
export type Ride =
  | { id: string; kind: 'tiles'; options: RideOption[] }
  | { id: string; kind: 'switch'; options: RideOption[] }
  | { id: string; kind: 'towns'; options: RideOption[] }
  | { id: string; kind: 'scene'; options: RideOption[] }
  | { id: string; kind: 'cities'; groups: RideGroup[] }
  | { id: string; kind: 'posters'; slugs: string[] }
  | { id: string; kind: 'checklist'; slug: string; side: string[] }
  | { id: string; kind: 'panel'; slug: string }
  | { id: string; kind: 'pair'; slugs: string[] }
  | { id: string; kind: 'fine'; slug: string }

export type RideKind = Ride['kind']

/** The category hero's lead Collection; `skip` = place indexes left out of its three photos. */
export type RideHero = { slug: string; skip?: number[] }

/** One category page: its hero, its rides in order, and every Collection they use, by slug. */
export type RidePage = {
  category: string
  hero: RideHero
  rides: Ride[]
  cols: Record<string, RideCollection>
}

/** The snapshot file for one locale. */
export type RidesSnapshot = {
  read: string
  locale: string
  pages: Record<string, Omit<RidePage, 'cols'>>
  cols: Record<string, RideCollection>
}
