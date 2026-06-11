'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { Music, Tv, Sparkles, Globe, RefreshCw, AlertTriangle } from 'lucide-react'
import { useExplore } from '@/hooks/useExplore'
import ExplorePoiCard from './ExplorePoiCard'

export type ExploreCategory = 'k-pop' | 'k-drama' | 'k-beauty' | 'k-culture'

const CATEGORIES = [
  {
    id: 'k-pop'     as ExploreCategory,
    href: '/explore/k-pop',
    icon: Music,
    tKey: 'kpop',
    sections: ['concerts', 'tours', 'agencies', 'merchandise'],
  },
  {
    id: 'k-drama'   as ExploreCategory,
    href: '/explore/k-drama',
    icon: Tv,
    tKey: 'kdrama',
    sections: ['filming', 'tours', 'historical', 'ostCafes'],
  },
  {
    id: 'k-beauty'  as ExploreCategory,
    href: '/explore/k-beauty',
    icon: Sparkles,
    tKey: 'kbeauty',
    sections: ['skincare', 'makeup', 'spa', 'salon'],
  },
  {
    id: 'k-culture' as ExploreCategory,
    href: '/explore/k-culture',
    icon: Globe,
    tKey: 'kculture',
    sections: ['cuisine', 'markets', 'historic', 'experiences'],
  },
]

function CardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden animate-pulse" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
      <div className="w-full aspect-[4/3]" style={{ background: 'var(--bg-3)' }} />
      <div className="p-sp-3 space-y-sp-2">
        <div className="h-4 w-3/4 rounded bg-muted-3" />
        <div className="h-3 w-1/2 rounded bg-muted-3" />
      </div>
    </div>
  )
}

function SectionSkeleton() {
  return (
    <div className="mb-sp-8">
      <div className="h-4 w-28 rounded bg-muted-3 mb-sp-4 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-sp-3">
        {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  )
}

export default function ExplorePage({ category }: { category: ExploreCategory }) {
  const t = useTranslations('explore')
  const pathname = usePathname()
  const { data, isLoading, isError, mutate } = useExplore(category)

  const cat = CATEGORIES.find(c => c.id === category)!
  const CatIcon = cat.icon

  const isActivePath = (href: string) => {
    const segment = pathname.replace(/^\/[a-z-]+/, '')
    return segment === href || segment.startsWith(`${href}/`)
  }

  return (
    <div className="flex">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-[196px] shrink-0 sticky top-[52px] self-start h-[calc(100vh-52px)] overflow-y-auto py-sp-4 pr-sp-3"
        style={{ borderRight: 'var(--bdr)' }}
        aria-label={t('sidebar.ariaLabel')}
      >
        {CATEGORIES.map(c => {
          const Icon = c.icon
          const isActive = isActivePath(c.href)
          return (
            <div key={c.id} className="mb-[2px]">
              <Link
                href={c.href}
                className={[
                  'flex items-center gap-sp-2 px-sp-3 py-[7px] rounded-lg text-[12px] font-semibold transition-colors min-h-[36px]',
                  isActive ? 'bg-lav-dim text-lav' : 'text-muted hover:bg-muted-3 hover:text-fg',
                ].join(' ')}
              >
                <Icon size={14} strokeWidth={2} className="shrink-0" />
                {t(`${c.tKey}.title`)}
              </Link>
              {isActive && (
                <div className="ml-sp-4 mt-[2px] flex flex-col gap-[1px]">
                  {c.sections.map(sid => (
                    <a
                      key={sid}
                      href={`#section-${sid}`}
                      className="block px-sp-3 py-[5px] text-[11px] text-muted hover:text-fg transition-colors rounded"
                    >
                      {t(`sections.${sid}`)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 px-sp-4 lg:px-sp-6 pt-sp-5 pb-sp-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted mb-sp-4">
          <Link href="/" className="text-muted-2 hover:text-fg transition-colors">B4K</Link>
          <span>›</span>
          <Link href="/explore" className="text-muted-2 hover:text-fg transition-colors">{t('breadcrumb')}</Link>
          <span>›</span>
          <span className="text-fg">{t(`${cat.tKey}.title`)}</span>
        </div>

        {/* Page heading */}
        <div className="flex items-center gap-sp-3 mb-sp-5">
          <CatIcon size={22} strokeWidth={2} className="text-lav shrink-0" />
          <h1 className="font-display font-black text-fg text-[clamp(20px,2.5vw,28px)]">
            {t(`${cat.tKey}.title`)}
          </h1>
        </div>

        {/* Mobile pill strip */}
        <div
          className="lg:hidden flex gap-sp-2 overflow-x-auto pb-sp-3 mb-sp-5 -mx-sp-4 px-sp-4 sticky top-[52px] z-10 bg-bg pt-sp-2"
          role="tablist"
          aria-label={t('pills.ariaLabel')}
          style={{ scrollbarWidth: 'none' }}
        >
          {CATEGORIES.map(c => {
            const Icon = c.icon
            const isActive = isActivePath(c.href)
            return (
              <Link
                key={c.id}
                href={c.href}
                role="tab"
                aria-selected={isActive}
                className={[
                  'flex items-center gap-[6px] px-sp-4 py-[7px] rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors shrink-0 min-h-touch',
                  isActive ? 'bg-lav text-bg' : 'text-muted hover:text-fg',
                ].join(' ')}
                style={!isActive ? { background: 'var(--bg-3)', border: '1px solid var(--bdr)' } : {}}
              >
                <Icon size={13} strokeWidth={2} />
                {t(`${c.tKey}.title`)}
              </Link>
            )
          })}
        </div>

        {/* Loading */}
        {isLoading && (
          <div aria-busy="true" aria-label={t('loading')}>
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-lg"
            style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
            role="alert"
          >
            <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
            <p className="text-[15px] font-semibold text-fg mb-sp-2">{t('error.title')}</p>
            <button
              onClick={() => mutate()}
              className="flex items-center gap-sp-2 text-[13px] font-semibold text-lav hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
            >
              <RefreshCw size={14} strokeWidth={2} />
              {t('error.retry')}
            </button>
          </div>
        )}

        {/* Success */}
        {!isLoading && !isError && data && (
          <>
            {data.sections.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-lg"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
              >
                <CatIcon size={40} strokeWidth={2} className="text-muted-2 mb-sp-4" />
                <p className="text-[16px] font-semibold text-fg mb-sp-2">{t(`${cat.tKey}.empty.title`)}</p>
                <p className="text-[13px] text-muted max-w-[320px]">{t(`${cat.tKey}.empty.desc`)}</p>
              </div>
            ) : (
              data.sections.map(section => (
                <section
                  key={section.id}
                  id={`section-${section.id}`}
                  className="mb-sp-10 scroll-mt-[80px]"
                  aria-label={t(`sections.${section.id}`)}
                >
                  <h2 className="text-[12px] font-semibold tracking-[0.07em] uppercase text-muted mb-sp-4">
                    {t(`sections.${section.id}`)}
                  </h2>
                  {section.items.length === 0 ? (
                    <p className="text-[13px] text-muted py-sp-4">{t('sectionEmpty')}</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-sp-3">
                      {section.items.map(poi => (
                        <ExplorePoiCard key={poi.place_id} poi={poi} />
                      ))}
                    </div>
                  )}
                </section>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
