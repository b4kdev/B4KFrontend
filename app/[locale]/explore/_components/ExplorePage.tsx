'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import useSWR from 'swr'
import { Link, usePathname } from '@/i18n/navigation'
import { Music, Tv, Sparkles, Globe, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import type { ExploreData } from '@/app/api/explore/[category]/route'
import ExplorePoiCard from './ExplorePoiCard'
import ExploreFeaturedCard from './ExploreFeaturedCard'
import ExploreHero from './ExploreHero'
import ExploreChipFilter, { ChipFilterConfig } from './ExploreChipFilter'
import ExplorePackages from './ExplorePackages'
import ExploreAiCta from './ExploreAiCta'

export type ExploreCategory = 'k-pop' | 'k-drama' | 'k-beauty' | 'k-culture'

// SC-36 (KD_04 Tours / KB_04 Makeup) — the only two sections spec'd for a
// featured wide card above the row.
const FEATURED_SECTIONS = new Set(['tours', 'makeup'])

interface CategoryConfig {
  id: ExploreCategory
  href: string
  icon: typeof Music
  tKey: string
  /** Section order (trending is prepended server-side). */
  sections: string[]
  filter?: ChipFilterConfig
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'k-pop',
    href: '/explore/k-pop',
    icon: Music,
    tKey: 'kpop',
    sections: ['trending', 'concerts', 'tours', 'agencies', 'merchandise'],
    filter: { param: 'agency', values: ['HYBE', 'SM', 'JYP', 'YG'] },
  },
  {
    id: 'k-drama',
    href: '/explore/k-drama',
    icon: Tv,
    tKey: 'kdrama',
    sections: ['trending', 'filming', 'tours', 'historical', 'ostCafes'],
    // K-Drama has no chip filter (SPEC-05).
  },
  {
    id: 'k-beauty',
    href: '/explore/k-beauty',
    icon: Sparkles,
    tKey: 'kbeauty',
    sections: ['trending', 'skincare', 'makeup', 'spa', 'salon'],
    filter: { param: 'district', values: ['Apgujeong', 'Myeongdong', 'Hongdae', 'Gangnam'] },
  },
  {
    id: 'k-culture',
    href: '/explore/k-culture',
    icon: Globe,
    tKey: 'kculture',
    sections: ['trending', 'traditional', 'food', 'festivals', 'crafts'],
    filter: { param: 'region', values: ['Seoul', 'Jeonju', 'Gyeongju', 'Andong'] },
  },
]

function RowSkeleton() {
  return (
    <div className="mb-sp-10">
      <div className="h-4 w-28 rounded bg-muted-3 mb-sp-4 animate-pulse" />
      <div className="flex gap-sp-3 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="w-[clamp(220px,72vw,260px)] shrink-0 overflow-hidden animate-pulse"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <div className="w-full aspect-[4/3]" style={{ background: 'var(--bg-3)' }} />
            <div className="p-sp-3 space-y-sp-2">
              <div className="h-4 w-3/4 rounded bg-muted-3" />
              <div className="h-3 w-1/2 rounded bg-muted-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeroSkeleton() {
  return <div className="h-[240px] lg:h-[400px] mb-sp-8 animate-pulse" style={{ background: 'var(--bg-2)' }} aria-hidden="true" />
}

export default function ExplorePage({ category }: { category: ExploreCategory }) {
  const t = useTranslations('explore')
  const pathname = usePathname()

  const cat = CATEGORIES.find(c => c.id === category)!
  const CatIcon = cat.icon

  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  // Fetch directly (not via useExplore) so the chip filter can pass a query param.
  const query = cat.filter && activeFilter ? `?${cat.filter.param}=${encodeURIComponent(activeFilter)}` : ''
  const { data, isLoading, error, mutate } = useSWR<ExploreData>(
    `/api/explore/${category}${query}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  )
  const isError = !!error

  const isActivePath = (href: string) => {
    // usePathname from @/i18n/navigation is already locale-stripped
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div className="flex">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-sidebar shrink-0 sticky top-[56px] self-start h-[calc(100vh-56px)] overflow-y-auto py-sp-4 px-sp-3 bg-bg-2"
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
                  'flex items-center gap-sp-2 px-sp-3 py-[7px] rounded-none text-f-sm font-semibold transition-colors min-h-[36px]',
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
                      className="block px-sp-3 py-[5px] text-f-xs text-muted hover:text-fg transition-colors rounded-none"
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
        <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-4">
          <Link href="/" className="text-muted-2 hover:text-fg transition-colors">B4K</Link>
          <span>›</span>
          <Link href="/explore" className="text-muted-2 hover:text-fg transition-colors">{t('breadcrumb')}</Link>
          <span>›</span>
          <span className="text-fg">{t(`${cat.tKey}.title`)}</span>
        </div>

        {/* Page heading */}
        <div className="flex items-center gap-sp-3 mb-sp-5">
          <CatIcon size={22} strokeWidth={2} className="text-lav shrink-0" />
          <h1 className="font-display text-fg text-f-display-tile">
            {t(`${cat.tKey}.title`)}
          </h1>
        </div>

        {/* Mobile pill strip (sub-nav) */}
        <div
          className="lg:hidden flex gap-sp-2 overflow-x-auto pb-sp-3 mb-sp-5 -mx-sp-4 px-sp-4 sticky top-[50px] z-10 bg-bg pt-sp-2"
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
                  'flex items-center gap-[6px] px-sp-4 py-[7px] rounded-full text-f-sm font-semibold whitespace-nowrap transition-colors shrink-0 min-h-touch',
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
        {isLoading && !data && (
          <div aria-busy="true" aria-label={t('loading')}>
            <HeroSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        )}

        {/* Error */}
        {isError && !data && (
          <div
            className="flex flex-col items-center justify-center text-center py-sp-16 px-sp-6 rounded-none"
            style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
            role="alert"
          >
            <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
            <p className="text-f-lg font-semibold text-fg mb-sp-2">{t('error.title')}</p>
            <button
              onClick={() => mutate()}
              className="flex items-center gap-sp-2 text-f-md font-semibold text-lav hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
            >
              <RefreshCw size={14} strokeWidth={2} />
              {t('error.retry')}
            </button>
          </div>
        )}

        {/* Success */}
        {!isError && data && (
          <>
            {/* H2 Hero */}
            {data.hero && data.hero.length > 0 && <ExploreHero slides={data.hero} />}

            {/* H4 Chip filter (per-hub; K-Drama has none) */}
            {cat.filter && (
              <ExploreChipFilter
                config={cat.filter}
                active={activeFilter}
                onChange={setActiveFilter}
              />
            )}

            {/* H3 Horizontal-scroll section rows */}
            {data.sections.every(s => s.items.length === 0) ? (
              <div
                className="flex flex-col items-center justify-center text-center py-sp-16 px-sp-6 rounded-none"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
              >
                <CatIcon size={40} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-4" />
                <p className="text-f-xl font-semibold text-fg mb-sp-2">{t(`${cat.tKey}.empty.title`)}</p>
                <p className="text-f-md text-muted max-w-[320px] mb-sp-4">{t(`${cat.tKey}.empty.desc`)}</p>
                <Link
                  href="/map"
                  className="cta-primary"
                >
                  {t('aiCta.button')}
                </Link>
              </div>
            ) : (
              data.sections
                .filter(s => s.items.length > 0)
                .map(section => {
                  // Featured wide-card treatment is scoped to KD_04/KB_04 (SC-36) —
                  // 'trending' re-includes the same items by dedup and must stay
                  // a plain row, so the featured flag can't leak in there too.
                  const featured = FEATURED_SECTIONS.has(section.id)
                    ? section.items.find(poi => poi.is_featured)
                    : undefined
                  const rest = featured
                    ? section.items.filter(poi => poi.poi_id !== featured.poi_id)
                    : section.items

                  return (
                    <section
                      key={section.id}
                      id={`section-${section.id}`}
                      className="mb-sp-10 scroll-mt-[80px]"
                      aria-label={t(`sections.${section.id}`)}
                    >
                      <div className="flex items-end justify-between mb-sp-4">
                        <h2 className="text-f-sm font-semibold tracking-[0.07em] uppercase text-muted">
                          {t(`sections.${section.id}`)}
                        </h2>
                        <Link
                          href={`/search?q=${category}`}
                          className="flex items-center gap-1 text-f-sm text-lav hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 ml-sp-4"
                          aria-label={t('viewAllAria', { section: t(`sections.${section.id}`) })}
                        >
                          {t('viewAll')}
                          <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                        </Link>
                      </div>
                      {featured && <ExploreFeaturedCard poi={featured} domain={category.toUpperCase()} />}
                      {rest.length > 0 && (
                        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-sp-4 lg:-mx-sp-6 px-sp-4 lg:px-sp-6">
                          <div className="flex gap-sp-3 pb-[4px]" style={{ width: 'max-content' }}>
                            {rest.map(poi => (
                              <ExplorePoiCard key={poi.poi_id} poi={poi} />
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  )
                })
            )}

            {/* H5 B4K Best Packages */}
            {data.packages && data.packages.length > 0 && <ExplorePackages packages={data.packages} />}

            {/* H6 Per-hub AI Planner CTA */}
            <ExploreAiCta category={category} />
          </>
        )}
      </div>
    </div>
  )
}
