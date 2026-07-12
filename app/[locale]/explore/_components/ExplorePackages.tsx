'use client'

import { useTranslations } from 'next-intl'
import { ExternalLink, Package } from 'lucide-react'
import type { ExplorePackage } from '@/app/api/explore/[category]/route'

export default function ExplorePackages({ packages }: { packages: ExplorePackage[] }) {
  const t = useTranslations('explore')

  // Validate partner_url (open-redirect guard) and cap at 3.
  const valid = packages.filter((p) => /^https?:\/\//.test(p.partner_url)).slice(0, 3)
  if (valid.length === 0) return null

  return (
    <section className="mb-sp-10" aria-label={t('packages.title')}>
      <h2 className="text-f-sm font-semibold tracking-[0.07em] uppercase text-muted mb-sp-4">
        {t('packages.title')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-sp-3">
        {valid.map((pkg) => (
          <a
            key={pkg.id}
            href={pkg.partner_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col overflow-hidden hover:opacity-90 transition-opacity"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
            aria-label={t('packages.ariaLabel', { title: pkg.title, partner: pkg.partner_name })}
          >
            <div className="relative bg-bg-3 flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
              <Package size={28} strokeWidth={2} className="text-muted-2" aria-hidden="true" />
              {pkg.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pkg.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
              )}
              <span
                className="absolute top-sp-2 left-sp-2 text-f-xxs font-bold tracking-[0.08em] uppercase text-bg bg-lav px-[6px] py-[3px]"
                aria-label={t('packages.sponsored')}
              >
                {t('packages.sponsored')}
              </span>
            </div>
            <div className="p-sp-3 flex flex-col gap-[3px]">
              <p className="text-f-md font-semibold text-fg line-clamp-1">{pkg.title}</p>
              <p className="text-f-xs text-muted">{pkg.partner_name}</p>
              <p className="flex items-center gap-[3px] text-f-xs text-lav mt-[2px]">
                {t('packages.viewCta')}
                <ExternalLink size={10} strokeWidth={2} aria-hidden="true" />
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
