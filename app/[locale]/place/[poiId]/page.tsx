import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { MapPin, ImageOff } from 'lucide-react'
import FieldImage from '@/components/ui/FieldImage'
import { fetchPlaceDetail } from '@/lib/place-detail'
import { buildPlaceMetadata, buildPlaceJsonLd } from './place-seo'

interface Props {
  params: { locale: string; poiId: string }
}

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const place = await fetchPlaceDetail(params.poiId, params.locale)
  if (!place) return {}
  return buildPlaceMetadata(place, params.locale)
}

// BLK-11 — canonical, SSR, indexable POI detail page. Read-only: save/like/
// add-to-plan stay on the interactive map (POIBottomSheet / LeftPanel), this
// page's job is being a real, crawlable, shareable URL for a place — the
// "View on map" CTA is the bridge back to those actions.
export default async function PlacePage({ params }: Props) {
  const place = await fetchPlaceDetail(params.poiId, params.locale)
  if (!place) notFound()

  const t = await getTranslations({ locale: params.locale, namespace: 'place' })
  const jsonLd = buildPlaceJsonLd(place, params.locale)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="max-w-[720px] mx-auto px-sp-4 py-sp-8 flex flex-col gap-sp-6">
        {place.primary_image_url ? (
          <FieldImage
            src={place.primary_image_url}
            alt={place.name}
            domain={place.display_domain ?? undefined}
            aspectRatio="16/9"
            priority
            /* main 이 max-w-[720px] + px-sp-4(16px×2) → 콘텐츠 폭 688px 상한.
               720px 미만 뷰포트에서는 전폭이므로 브레이크포인트는 752px(=720+32). */
            sizes="(max-width: 752px) 100vw, 688px"
          />
        ) : (
          <div
            className="bg-bg-3 flex flex-col items-center justify-center gap-sp-2"
            style={{ aspectRatio: '16/9' }}
          >
            <ImageOff size={32} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
            <span className="text-f-xs text-muted">{t('imagePending')}</span>
          </div>
        )}

        <div className="flex flex-col gap-sp-3">
          <h1 className="text-fg font-display text-f-2xl leading-tight text-balance">
            {place.name}
          </h1>

          <div className="flex flex-wrap items-center gap-sp-2">
            {place.display_domain && (
              <span className="px-sp-3 py-1 rounded-full bg-lav-dim text-lav text-f-sm font-medium">
                {place.display_domain}
              </span>
            )}
            {place.display_region && (
              <span className="text-muted text-f-sm">{place.display_region}</span>
            )}
          </div>

          {place.save_count > 0 && (
            <p className="text-muted text-f-sm tabular-nums">
              {formatCount(place.save_count)} {t('saves')}
            </p>
          )}

          {place.description && (
            <p className="text-fg text-f-base leading-relaxed max-w-[65ch]">
              {place.description}
            </p>
          )}

          {place.address && (
            <p className="text-muted text-f-sm leading-relaxed whitespace-pre-line">
              {place.address}
            </p>
          )}
        </div>

        <Link
          href={`/map?poi=${place.poi_id}`}
          className="inline-flex items-center justify-center gap-sp-2 min-h-touch w-fit px-sp-6 rounded-none font-body font-semibold text-f-base bg-fg text-bg hover:bg-royal-600 hover:text-fg transition-[background,color] duration-[80ms]"
        >
          <MapPin size={20} strokeWidth={2} aria-hidden="true" />
          {t('viewOnMap')}
        </Link>
      </main>
    </>
  )
}
