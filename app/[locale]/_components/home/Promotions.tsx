'use client'

import { useTranslations } from 'next-intl'
import useSWR from 'swr'
import { ExternalLink, Tag } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import SectionHead from './SectionHead'
import HScrollRow from './HScrollRow'
import type { HomePromotion } from '@/app/api/home/promotions/route'

function isExternal(url: string) {
  return /^https?:\/\//.test(url)
}

export default function Promotions() {
  const t = useTranslations('home.promotions')
  const { data, isLoading } = useSWR<HomePromotion[]>('/api/home/promotions', fetcher)

  if (!isLoading && (!data || data.length === 0)) return null

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('title')}>
      <SectionHead title={t('title')} />
      {isLoading && (
        <HScrollRow>
          {[0,1].map(i => (
            <div key={i} className="animate-pulse" style={{ width: 'clamp(280px, 80vw, 360px)', height: 80, background: 'var(--bg-2)', border: '1px solid var(--bdr)' }} aria-hidden="true" />
          ))}
        </HScrollRow>
      )}
      {!isLoading && data && (
        <HScrollRow>
          {data.map(promo => {
            const ext = isExternal(promo.cta_url)
            const Tag2 = ext ? 'a' : 'button'
            const extraProps = ext
              ? { href: promo.cta_url, target: '_blank', rel: 'noopener noreferrer' }
              : {}
            return (
              <div
                key={promo.id}
                className="flex items-center gap-sp-4 p-sp-4"
                style={{ width: 'clamp(280px, 80vw, 360px)', background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--lav-dim)' }}
                  aria-hidden="true"
                >
                  <Tag size={18} strokeWidth={2} className="text-lav" />
                </div>
                <p className="flex-1 text-f-sm text-fg leading-snug">{promo.headline}</p>
                <Tag2
                  {...(extraProps as Record<string, string>)}
                  className="shrink-0 text-f-xs font-semibold text-lav hover:opacity-80 transition-opacity flex items-center gap-1 min-h-touch px-sp-2"
                  aria-label={`${promo.cta_label}: ${promo.headline}`}
                >
                  {promo.cta_label}
                  {ext && <ExternalLink size={10} strokeWidth={2} aria-hidden="true" />}
                </Tag2>
              </div>
            )
          })}
        </HScrollRow>
      )}
    </section>
  )
}
