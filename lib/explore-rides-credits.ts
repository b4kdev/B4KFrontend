// Photo credits for the rides' own place images (public/images/explore/places). Korea Tourism
// Organization photos are free to use under KOGL as long as they name their source wherever they
// show. The images are small inside the rides, so the credit is one line per ride or Home block
// that holds such a photo. Keep this list in step with Content's image register.
import type { Ride, RideCollection, RidePage } from './explore-rides-types'

const KTO_PLACE_IDS = ['111039', '112991', '118194', '122547', '125235', '137986', '148620', '149204']
const KTO = new Set(KTO_PLACE_IDS.map((id) => `/images/explore/places/place-${id}.webp`))

export const isKtoPhoto = (src?: string | null) => !!src && KTO.has(src)

// AI-made pictures among the same images: B4K's rule is that an AI picture of a real place carries an
// 'AI illustration' line until a licensed photo replaces it. These are every own place image except
// the Korea Tourism Organization photos above; take a name off the list when its image is replaced.
const AI_IMAGES = [
  'city-busan',
  'city-chuncheon',
  'city-daejeon',
  'city-incheon',
  'city-jeju',
  'city-jeonju',
  'city-sokcho',
  'city-suwon',
  'place-102648',
  'place-104158',
  'place-108363',
  'place-111497',
  'place-111954',
  'place-114002',
  'place-116347',
  'place-117720',
  'place-118011',
  'place-123348',
  'place-125139',
  'place-126693',
  'place-127236',
  'place-128567',
  'place-129653',
  'place-135079',
  'place-138013',
  'place-139015',
  'place-139806',
  'place-141009',
  'place-141019',
  'place-144233',
  'place-146004',
  'place-151301',
  'place-152160',
  'place-152319',
  'place-152350',
  'place-152644',
  'place-152761',
  'place-152775',
  'place-152812',
  'place-153339',
  'place-153409',
  'place-153412',
  'place-153416',
  'place-153417',
  'place-153430',
  'place-153431',
  'place-153432',
  'place-153442',
  'place-153443',
  'place-153444',
  'place-153446',
  'place-153447',
  'place-153448',
  'place-153458',
  'place-153466',
  'place-153471',
  'place-153474',
  'place-153478',
  'place-153484',
  'place-153485',
  'place-153488',
  'place-153489',
  'place-153731',
  'place-153736',
  'place-153737',
  'place-153740',
  'place-153741',
  'place-153743',
  'place-153759',
  'place-153765',
  'place-153766',
  'place-153768',
  'place-153769',
  'place-153774',
  'place-153775',
  'place-153805',
  'place-153810',
  'place-153811',
  'place-153816',
  'place-153880',
  'place-153881',
  'place-153884',
  'place-153885',
  'place-153886',
  'place-153892',
  'place-153893',
  'place-153894',
  'place-153904',
  'place-153905',
  'place-153963',
  'place-153964',
  'place-153988',
  'place-153989',
  'place-153992',
]
const AI = new Set(AI_IMAGES.map((name) => `/images/explore/places/${name}.webp`))

// The 'AI illustration' line is switched off for now (B4K's call); set to true to show it again.
const SHOW_AI_LINE = false

export const isAiPhoto = (src?: string | null) => SHOW_AI_LINE && !!src && AI.has(src)

/** A Collection shows a Korea Tourism Organization photo (its cover or one of its places). */
export const colHasKto = (c?: RideCollection) => !!c && (isKtoPhoto(c.hero) || c.places.some((p) => isKtoPhoto(p.img)))

/** A Collection shows an AI-made picture (its cover or one of its places). */
export const colHasAi = (c?: RideCollection) => !!c && (isAiPhoto(c.hero) || c.places.some((p) => isAiPhoto(p.img)))

/** Every Collection a ride can show, whatever the visitor picks inside it. */
function rideSlugs(ride: Ride): string[] {
  if ('options' in ride) return ride.options.flatMap((o) => [o.slug, ...(o.also ?? [])])
  if ('groups' in ride) return ride.groups.flatMap((g) => g.slugs)
  if ('slugs' in ride) return ride.slugs
  return [ride.slug]
}

/** A ride needs the credit line when any photo it can show is a Korea Tourism Organization photo,
 * so the line does not come and go as the visitor picks. */
export function rideHasKto(ride: Ride, cols: RidePage['cols']) {
  if ('options' in ride && ride.options.some((o) => isKtoPhoto(o.img))) return true
  if ('groups' in ride && ride.groups.some((g) => isKtoPhoto(g.img))) return true
  return rideSlugs(ride).some((slug) => colHasKto(cols[slug] as RideCollection | undefined))
}

/** A ride carries the AI illustration line when any picture it can show is AI-made, so the line
 * does not come and go as the visitor picks. */
export function rideHasAi(ride: Ride, cols: RidePage['cols']) {
  if ('options' in ride && ride.options.some((o) => isAiPhoto(o.img))) return true
  if ('groups' in ride && ride.groups.some((g) => isAiPhoto(g.img))) return true
  return rideSlugs(ride).some((slug) => colHasAi(cols[slug] as RideCollection | undefined))
}
