import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchPlaceDetail } from '@/lib/place-detail'
import { buildPlaceMetadata, buildPlaceJsonLd } from './place-seo'
import PlaceDetailClient from './PlaceDetailClient'

interface Props {
  params: { locale: string; poiId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const place = await fetchPlaceDetail(params.poiId, params.locale)
  if (!place) return {}
  return buildPlaceMetadata(place, params.locale)
}

// BLK-11 — canonical, SSR, indexable POI detail page. SSR shell (metadata +
// JSON-LD + notFound gate) stays server-rendered for Naver indexing; the body
// is the same map+panel surface as /map (PlaceDetailClient), so a POI has one
// canonical URL that's crawlable AND fully interactive (save/like inline,
// Add-to-Plan bridges into the /map builder).
export default async function PlacePage({ params }: Props) {
  const place = await fetchPlaceDetail(params.poiId, params.locale)
  if (!place) notFound()

  const jsonLd = buildPlaceJsonLd(place, params.locale)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PlaceDetailClient place={place} />
    </>
  )
}
