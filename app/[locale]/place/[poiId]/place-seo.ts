import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { hreflangAlternates, localizedUrl } from '@/lib/site-url'
import { routing } from '@/i18n/routing'
import type { PlaceDetail } from '@/lib/place-detail'

// display_domain slug -> explore.<key> namespace, reusing the same translated
// category names Explore already ships in all 7 locales instead of adding
// duplicate strings.
const DOMAIN_TO_EXPLORE_KEY: Record<string, string> = {
  'k-pop':     'kpop',
  'k-drama':   'kdrama',
  'k-beauty':  'kbeauty',
  'k-culture': 'kculture',
}

const MAX_TITLE_LEN = 60
const MAX_DESC_LEN  = 140

// Spec (shared/legal-seo.md, S-DHKYQN): "{POI name} — {category} in {region} | B4K",
// truncation rule (H-B 2026-07-08): if >60 chars, drop "in {region}" first, then {category}.
function buildTitle(name: string, category: string | null, region: string | null): string {
  const full = category && region ? `${name} — ${category} in ${region} | B4K`
             : category            ? `${name} — ${category} | B4K`
             :                        `${name} | B4K`
  if (full.length <= MAX_TITLE_LEN) return full

  const withoutRegion = category ? `${name} — ${category} | B4K` : `${name} | B4K`
  if (withoutRegion.length <= MAX_TITLE_LEN) return withoutRegion

  return `${name} | B4K`
}

function truncateDesc(desc: string): string {
  if (desc.length <= MAX_DESC_LEN) return desc
  return desc.slice(0, MAX_DESC_LEN - 1).trimEnd() + '…'
}

export async function buildPlaceMetadata(place: PlaceDetail, locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'place' })
  const categoryKey = place.display_domain ? DOMAIN_TO_EXPLORE_KEY[place.display_domain] : null
  const category = categoryKey ? await getTranslations({ locale, namespace: 'explore' }).then(te => te(`${categoryKey}.title`)) : null

  const title = buildTitle(place.name, category, place.display_region)
  const description = truncateDesc(place.description ?? t('fallbackDescription', { name: place.name }))
  const path = `/place/${place.poi_id}`
  const url = localizedUrl(locale, path)
  const otherLocales = routing.locales.filter(l => l !== locale)

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: hreflangAlternates(path),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'B4K',
      locale,
      alternateLocale: otherLocales,
      type: 'website',
      ...(place.primary_image_url ? { images: [{ url: place.primary_image_url, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// S-QRKYQH — TouristAttraction, fields limited strictly to what /places/:id
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
