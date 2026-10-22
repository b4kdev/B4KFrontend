import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { MapScreen } from '@/components/v2/screens/A1Map'
import { fetchPlaceDetail } from '@/lib/place-detail'
import { buildPlaceJsonLd, buildPlaceMetadata } from '@/app/[locale]/place/[poiId]/place-seo'
import { JsonLd } from '@/components/v2/JsonLd'

export async function generateMetadata({ params }: { params: { locale: string; poiId: string } }): Promise<Metadata> {
  const place = await fetchPlaceDetail(params.poiId, params.locale)
  if (!place) return {}
  return buildPlaceMetadata(place, params.locale)
}

// Place page (BLK-11) in the new design: the live SSR shell (metadata, JSON-LD, 404 for an unknown
// place) over the map with the place selected.
export default async function Page({ params }: { params: { locale: string; poiId: string } }) {
  const place = await fetchPlaceDetail(params.poiId, params.locale)
  if (!place) notFound()
  return (
    <>
      <JsonLd data={buildPlaceJsonLd(place, params.locale)} />
      <Suspense><MapScreen poiId={params.poiId} /></Suspense>
    </>
  )
}
