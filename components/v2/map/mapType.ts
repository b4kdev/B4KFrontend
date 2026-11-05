import type { MapPoi } from '@/hooks/useMapPois'

// The colour type of a place on the map, by the same rules as the map chips: their tag filters
// (Shopping: the interest) in chip order, the first match wins; anything else is "other".
export type MapType = 'food' | 'cafe' | 'stay' | 'shopping' | 'heritage' | 'park' | 'other'

const RULES: [MapType, (tags: string[], interest: string | null | undefined) => boolean][] = [
  ['food', (t) => t.includes('restaurant')],
  ['cafe', (t) => t.includes('cafe')],
  ['stay', (t) => t.some((x) => ['hotel', 'resort', 'pension', 'guesthouse', 'hanok-stay', 'motel'].includes(x))],
  ['shopping', (_, i) => i === 'shopping'],
  ['heritage', (t) => t.some((x) => ['palace', 'temple', 'museum'].includes(x))],
  ['park', (t) => t.includes('park')],
]

// A place read without its tags (a plan stop from another source) falls back to its interest.
const BY_INTEREST: Record<string, MapType> = { food: 'food', stay: 'stay', shopping: 'shopping', heritage: 'heritage', nature: 'park' }

export function mapTypeOf(p: Pick<MapPoi, 'interest_tags' | 'interest_category'>): MapType {
  if (!p.interest_tags) return BY_INTEREST[p.interest_category ?? ''] ?? 'other'
  return RULES.find(([, match]) => match(p.interest_tags!, p.interest_category))?.[0] ?? 'other'
}
