import type { MapPoi } from '@/hooks/useMapPois'

// The colour type of a place on the map, by the same rules as the map chips: their tag filters
// (Shopping: the interest) in chip order, the first match wins; anything else is "other". The
// matching chip (MapKind) also gives the pin its icon, the chip's own.
export type MapType = 'food' | 'cafe' | 'stay' | 'shopping' | 'heritage' | 'park' | 'other'
export type MapKind = 'restaurant' | 'cafe' | 'stay' | 'shopping' | 'palace' | 'temple' | 'museum' | 'park'

const STAYS = ['hotel', 'resort', 'pension', 'guesthouse', 'hanok-stay', 'motel']
const RULES: [MapKind, MapType, (tags: string[], interest: string | null | undefined) => boolean][] = [
  ['restaurant', 'food', (t) => t.includes('restaurant')],
  ['cafe', 'cafe', (t) => t.includes('cafe')],
  ['stay', 'stay', (t) => t.some((x) => STAYS.includes(x))],
  ['shopping', 'shopping', (_, i) => i === 'shopping'],
  ['palace', 'heritage', (t) => t.includes('palace')],
  ['temple', 'heritage', (t) => t.includes('temple')],
  ['museum', 'heritage', (t) => t.includes('museum')],
  ['park', 'park', (t) => t.includes('park')],
]

// A place read without its tags (a plan stop from another source) falls back to its interest.
const BY_INTEREST: Record<string, MapType> = { food: 'food', stay: 'stay', shopping: 'shopping', heritage: 'heritage', nature: 'park' }

type Tagged = Pick<MapPoi, 'interest_tags' | 'interest_category'>

/** The map chip a place falls under, or null (no tags, or none of the chips). */
export function mapKindOf(p: Tagged): MapKind | null {
  if (!p.interest_tags) return null
  return RULES.find(([, , match]) => match(p.interest_tags!, p.interest_category))?.[0] ?? null
}

export function mapTypeOf(p: Tagged): MapType {
  if (!p.interest_tags) return BY_INTEREST[p.interest_category ?? ''] ?? 'other'
  const kind = mapKindOf(p)
  return kind ? RULES.find(([k]) => k === kind)![1] : 'other'
}
