'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Mic2, Tv2, Sparkles, Landmark } from 'lucide-react'

const HUBS = [
  { key: 'kPop',    href: '/explore/k-pop',     Icon: Mic2      },
  { key: 'kDrama',  href: '/explore/k-drama',   Icon: Tv2       },
  { key: 'kBeauty', href: '/explore/k-beauty',  Icon: Sparkles  },
  { key: 'kCulture',href: '/explore/k-culture', Icon: Landmark  },
] as const

export default function ExploreHub() {
  const t = useTranslations('home.exploreHub')

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('ariaLabel')}>
      <h2 className="text-f-xl font-semibold text-fg mb-sp-4">{t('title')}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-sp-3">
        {HUBS.map(({ key, href, Icon }) => (
          <Link
            key={key}
            href={href}
            className="flex flex-col items-center justify-center gap-sp-2 py-sp-6 hover:opacity-90 transition-opacity"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
            aria-label={t(`${key}.label`)}
          >
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--lav-dim)' }}
              aria-hidden="true"
            >
              <Icon size={20} strokeWidth={2} className="text-lav" />
            </span>
            <span className="text-f-md font-semibold text-fg">{t(`${key}.label`)}</span>
            <span className="text-f-xs text-muted text-center px-sp-2">{t(`${key}.sub`)}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
