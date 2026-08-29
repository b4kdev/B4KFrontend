'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { TrendingUp, MapPin, ExternalLink } from 'lucide-react'
import { getDisplayName } from '@/lib/display-name'
import FieldImage from '@/components/ui/FieldImage'
import { track } from '@/lib/analytics'
import type { ExplorePoi } from '@/app/api/explore/[category]/route'

// SC-36 (KD_04/KB_04, S-OIRFKM/S-ZVKQUS) — 1 featured wide card above the
// section's horizontal scroll row. Same fields as ExplorePoiCard, wide layout.
export default function ExploreFeaturedCard({ poi, domain }: { poi: ExplorePoi; domain?: string }) {
  const t = useTranslations('explore')
  const locale = useLocale()
  const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
  const isPartner = !!(poi.is_partner && poi.partner_url && /^https?:\/\//.test(poi.partner_url))
  // verified:false rows don't have a real DB id — linking to /place/{poi_id}
  // would 404 now that the page does a real BFF lookup. Same gate
  // MasonryGrid.tsx/ExplorePoiCard.tsx use for the same content.
  const linkable = poi.verified !== false

  const cardBody = (
    <>
      <div className="relative sm:w-[42%] shrink-0">
        {poi.primary_image_url ? (
          <FieldImage
            src={poi.primary_image_url}
            alt={name}
            domain={domain}
            aspectRatio="16/9"
            /* 데스크톱(lg~)은 좌측 사이드바 --sidebar(420px) + 본문 좌우 패딩
               sp-6(24px×2) 을 뺀 폭. 그 미만에서는 사이드바가 hidden 이라 전폭.
               ※ 이 카드는 데스크톱에서 ~1450px 까지 커지는데 TourAPI 원본이 940px 가
                 한계라 업스케일은 불가피하다(소스 제약, sizes 로는 못 고침). */
            sizes="(max-width: 1024px) 100vw, calc(100vw - 468px)"
          />
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-sp-2"
            style={{ background: 'var(--bg-3)', aspectRatio: '16/9' }}
          >
            <MapPin size={28} strokeWidth={2} className="text-fg opacity-[0.15]" />
            <span className="text-f-xs text-muted">{t('card.imagePending')}</span>
          </div>
        )}
        {isPartner && (
          <span
            className="absolute top-sp-2 left-sp-2 text-f-xxs font-semibold px-sp-2 py-[3px] rounded-full leading-none"
            style={{ background: 'var(--backdrop-50)', color: 'var(--fg)', border: '1px solid var(--bdr)' }}
          >
            {t('card.sponsored')}
          </span>
        )}
      </div>
      <div className="p-sp-4 flex flex-col gap-sp-2 justify-center flex-1">
        <span className="text-f-xxs font-bold tracking-[0.1em] uppercase text-fg">
          {t('card.featured')}
        </span>
        <div className="flex items-start justify-between gap-sp-2">
          <span className="text-f-xl font-semibold text-fg leading-tight line-clamp-2 min-w-0">{name}</span>
          {isPartner && <ExternalLink size={14} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />}
        </div>
        <div className="flex items-center gap-sp-3">
          <span className="text-f-sm text-muted truncate">{poi.display_region}</span>
          {poi.is_trending && (
            <span
              className="flex items-center gap-[3px] text-f-xxs font-semibold text-fg px-[6px] py-[2px] rounded-full leading-none"
              style={{ background: 'var(--bg-3)' }}
            >
              <TrendingUp size={9} strokeWidth={2} aria-hidden="true" />
              {t('card.trending')}
            </span>
          )}
        </div>
      </div>
    </>
  )

  const className = 'flex flex-col sm:flex-row overflow-hidden mb-sp-4 transition-opacity hover:opacity-90'
  const style = { background: 'var(--bg-2)', border: '1px solid var(--bdr)' }

  if (!linkable) {
    return (
      <div className={className} style={style} aria-label={t('card.ariaLabel', { name })}>
        {cardBody}
      </div>
    )
  }

  return (
    <Link
      href={isPartner ? (poi.partner_url ?? `/place/${poi.poi_id}`) : `/place/${poi.poi_id}`}
      target={isPartner ? '_blank' : undefined}
      rel={isPartner ? 'noopener noreferrer' : undefined}
      onClick={isPartner ? () => track('outbound_click', { poi_id: poi.poi_id, type: 'poi', locale, screen_id: 'explore' }) : undefined}
      className={className}
      style={style}
      aria-label={t('card.ariaLabel', { name })}
    >
      {cardBody}
    </Link>
  )
}
