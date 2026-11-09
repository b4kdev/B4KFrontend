// Photo credits for the rides' own place images (public/images/explore/places). Korea Tourism
// Organization photos are free to use under KOGL as long as they name their source wherever they
// show. The images are small inside the rides, so the credit is one line per ride or Home block
// that holds such a photo. Keep this list in step with Content's image register.
import type { Ride, RideCollection, RidePage } from './explore-rides-types'

const KTO_PLACE_IDS = ['111039', '112991', '118194', '122547', '125235', '137986', '148620', '149204']
const KTO = new Set(KTO_PLACE_IDS.map((id) => `/images/explore/places/place-${id}.webp`))

export const isKtoPhoto = (src?: string | null) => !!src && KTO.has(src)

/** A Collection shows a Korea Tourism Organization photo (its cover or one of its places). */
export const colHasKto = (c?: RideCollection) => !!c && (isKtoPhoto(c.hero) || c.places.some((p) => isKtoPhoto(p.img)))

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
