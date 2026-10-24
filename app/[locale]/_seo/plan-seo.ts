import { bffFetch } from '@/lib/bff'
import { isNumericId, mapBffToDetail, type BffItinerary, type ItineraryDetail } from '@/lib/itinerary'
import { localizedUrl } from '@/lib/site-url'

/** The published plan for the page's structured data, or null (unknown id, private, or a failed read). */
export async function fetchPublicPlan(id: string): Promise<ItineraryDetail | null> {
  if (!isNumericId(id)) return null
  try {
    const detail = mapBffToDetail(await bffFetch<BffItinerary>(`/itineraries/public/${id}`, { token: null }))
    return detail.is_published ? detail : null
  } catch {
    return null
  }
}

const placeName = (p: ItineraryDetail['stops'][number]['poi'], locale: string) => p.name_preferred ?? (locale === 'ko' ? p.name_ko : p.name_en) ?? p.name_ko

/** TouristTrip for a published plan: its stops in order, each a TouristAttraction with its position. */
export function buildPlanJsonLd(plan: ItineraryDetail, locale: string) {
  const author = plan.author.name_preferred ?? plan.author.name_en ?? plan.author.name_ko
  const image = plan.stops.find((s) => s.poi.primary_image_url)?.poi.primary_image_url
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: plan.title,
    url: localizedUrl(locale, `/plan/${plan.id}`),
    inLanguage: locale,
    ...(image ? { image } : {}),
    ...(author ? { author: { '@type': 'Person', name: author } } : {}),
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: plan.stops.length,
      itemListElement: plan.stops.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'TouristAttraction',
          name: placeName(s.poi, locale),
          url: localizedUrl(locale, `/place/${s.poi.poi_id}`),
          geo: { '@type': 'GeoCoordinates', latitude: s.poi.coords_lat, longitude: s.poi.coords_lng },
        },
      })),
    },
  }
}
