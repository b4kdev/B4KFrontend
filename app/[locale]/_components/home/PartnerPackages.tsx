'use client'

import { useTranslations } from 'next-intl'
import useSWR from 'swr'
import { ExternalLink, Package } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import SectionHead from './SectionHead'
import HScrollRow from './HScrollRow'
import type { HomePartnerPackage } from '@/app/api/home/partner-packages/route'

function CardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden animate-pulse"
      style={{ width: 'clamp(220px, 60vw, 260px)', background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      aria-hidden="true"
    >
      <div className="bg-muted-3" style={{ aspectRatio: '4/3' }} />
      <div className="p-sp-3 space-y-sp-2">
        <div className="h-[13px] w-3/4 bg-muted-3" />
        <div className="h-[11px] w-1/2 bg-muted-3" />
      </div>
    </div>
  )
}

export default function PartnerPackages() {
  const t = useTranslations('home.partnerPackages')
  const { data, isLoading } = useSWR<HomePartnerPackage[]>('/api/home/partner-packages', fetcher)

  if (!isLoading && (!data || data.length === 0)) return null

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('title')}>
      <SectionHead title={t('title')} />
      {isLoading && (
        <HScrollRow>
          {[0,1,2].map(i => <CardSkeleton key={i} />)}
        </HScrollRow>
      )}
      {!isLoading && data && (
        <HScrollRow>
          {data.filter(pkg => /^https?:\/\//.test(pkg.partner_url)).map(pkg => (
            <a
              key={pkg.id}
              href={pkg.partner_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col overflow-hidden hover:opacity-90 transition-opacity"
              style={{ width: 'clamp(220px, 60vw, 260px)', background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
              aria-label={t('card.ariaLabel', { title: pkg.title, partner: pkg.partner_name })}
            >
              <div className="relative bg-bg-3 flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
                <Package size={28} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
                {pkg.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pkg.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
                )}
                <span
                  className="absolute top-sp-2 left-sp-2 text-f-xxs font-bold tracking-[0.1em] uppercase text-bg bg-lav px-[6px] py-[3px]"
                  aria-label={t('sponsored')}
                >
                  {t('sponsored')}
                </span>
              </div>
              <div className="p-sp-3 flex flex-col gap-[3px]">
                <p className="text-f-md font-semibold text-fg line-clamp-1">{pkg.title}</p>
                <p className="text-f-xs text-muted">{pkg.partner_name}</p>
                <p className="flex items-center gap-[3px] text-f-xs text-lav mt-[2px]">
                  {t('viewCta')}
                  <ExternalLink size={10} strokeWidth={2} aria-hidden="true" />
                </p>
              </div>
            </a>
          ))}
        </HScrollRow>
      )}
    </section>
  )
}
