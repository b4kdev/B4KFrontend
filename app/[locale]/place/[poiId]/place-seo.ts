import type { Metadata } from 'next'
import { localizedUrl } from '@/lib/site-url'
import { fitDescription, fitTitle, pageMeta, regionName, seoText } from '@/lib/seo'
import { CATEGORIES } from '@/components/v2/categories'
import type { PlaceDetail } from '@/lib/place-detail'

// "{name} — {kind} in {area} | B4K", then without the area, then the name only (the first that fits
// 60 characters). Other languages than Korean show the Korean name too: "{name} ({nameKo})". The
// kind is the place's Explore category until places have a type. Description: the place's own
// sentence, else "{name}, {kind} in {area}. …".
export async function buildPlaceMetadata(place: PlaceDetail, locale: string): Promise<Metadata> {
  const { t } = await seoText(locale)
  const label = CATEGORIES.find((c) => c.slug === place.display_domain)?.label
  const kind = label ? t(label) : null
  const area = regionName(place.display_region, locale)
  const name = locale !== 'ko' && place.name_ko && place.name_ko !== place.name ? t('CD1831', { name: place.name, nameKo: place.name_ko }) : place.name
  const title = fitTitle(
    kind && area ? t('CD1829', { name, kind, area }) : null,
    kind ? t('CD1830', { name, kind }) : null,
    t('CD1832', { page: name }),
    kind && area ? t('CD1829', { name: place.name, kind, area }) : null,
    kind ? t('CD1830', { name: place.name, kind }) : null,
    t('CD1832', { page: place.name }),
  )
  const description = fitDescription(place.description || (kind && area ? t('CD0864', { name: place.name, kind, area }) : null))
  return pageMeta({ locale, path: `/place/${place.poi_id}`, title, description, image: place.primary_image_url })
}

// Breadcrumb for a place page: Home, the place's Explore category (when it has one), the place.
export async function buildPlaceBreadcrumbJsonLd(place: PlaceDetail, locale: string) {
  const { t } = await seoText(locale)
  const label = CATEGORIES.find((c) => c.slug === place.display_domain)?.label
  const category = label ? t(label) : null
  const items = [
    { name: t('CD0807'), url: localizedUrl(locale) },
    ...(category ? [{ name: category, url: localizedUrl(locale, `/explore/${place.display_domain}`) }] : []),
    { name: place.name, url: localizedUrl(locale, `/place/${place.poi_id}`) },
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  }
}

// TouristAttraction, fields limited strictly to what /places/:id
// actually returns. No openingHours/telephone/priceRange — not in the schema,
// don't fabricate them.
export function buildPlaceJsonLd(place: PlaceDetail, locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: place.name,
    ...(place.description ? { description: place.description } : {}),
    ...(place.primary_image_url ? { image: place.primary_image_url } : {}),
    url: localizedUrl(locale, `/place/${place.poi_id}`),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: place.coords_lat,
      longitude: place.coords_lng,
    },
    ...(place.address ? {
      address: {
        '@type': 'PostalAddress',
        streetAddress: place.address,
        addressCountry: 'KR',
      },
    } : {}),
  }
}
