'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import { Link, usePathname } from '@/i18n/navigation'
import { Music, Tv, Sparkles, Globe, Utensils, RefreshCw, AlertTriangle, Compass } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { track } from '@/lib/analytics'
import type { ExploreData } from '@/app/api/explore/[category]/route'

const HUB_DOMAIN: Record<ExploreCategory, 'kpop' | 'kdrama' | 'kbeauty' | 'kfood' | 'kculture'> = {
  'k-pop': 'kpop', 'k-drama': 'kdrama', 'k-beauty': 'kbeauty', 'k-food': 'kfood', 'k-culture': 'kculture',
}
import ExploreSectionRow from './ExploreSectionRow'
import KpopArtistNav from './KpopArtistNav'
import ExploreHero from './ExploreHero'
import ExploreChipFilter, { ChipFilterConfig } from './ExploreChipFilter'
import ExplorePackages from './ExplorePackages'
import ExploreCollectionsGrid from './ExploreCollectionsGrid'

export type ExploreCategory = 'k-pop' | 'k-drama' | 'k-beauty' | 'k-food' | 'k-culture'

// SC-36 (KD_04 Tours / KB_04 Makeup) originally spec'd only these two.
// Widened same-session: with tours/makeup as the only featured slots, 3 of 4
// category pages (k-culture, and half of k-pop/k-drama/k-beauty) rendered as
// flat uniform card rows with zero visual break — one featured section per
// category now, each with a real is_featured POI already in the seed data.
// 'agencies' (k-pop) dropped — CT_KP_EXT (DEC-60) renames that row 'agencyHq'
// and deliberately doesn't give it the featured treatment (see KpopArtistNav).
// K-Beauty's 'makeup'/'spa' renamed 'shopping'/'derma' (DEC-61) — their featured
// items (Makeup House Myeongdong, Abijou Clinic) carried over under the new ids.
// K-Culture's 'food' (Gwangjang Market) renamed 'heritage' (DEC-61 restructure).
const FEATURED_SECTIONS = new Set(['tours', 'shopping', 'heritage', 'ostCafes', 'derma'])

interface CategoryConfig {
  id: ExploreCategory
  href: string
  icon: typeof Music
  tKey: string
  /** Section order (trending is prepended server-side). */
  sections: string[]
  /**
   * One row per simultaneous chip filter (content-plan doc: K-Drama/K-Food/K-Culture
   * each need a mid-tier chip + a region chip at once). Rendered in array order,
   * combined as AND in the fetch query — see the `fetchParams` loop below.
   */
  filters?: ChipFilterConfig[]
  /**
   * Per-row "View all" override — a handful of rows deep-link to a dedicated detail
   * page (DEC-61's masonry pages) instead of the generic `/search?q=` results. Keyed
   * by section id *within this category* (section ids like 'tours' repeat across
   * categories with different meaning, so this can't be a single global map).
   */
  detailHrefs?: Partial<Record<string, string>>
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'k-pop',
    href: '/explore/k-pop',
    icon: Music,
    tKey: 'kpop',
    // CT_KP_EXT (DEC-60): no `filters` here — the agency chip lives inside
    // KpopArtistNav now (global, client-side filtering against artist/agency
    // tags), not a query-param refetch. This list only drives the desktop
    // sidebar's #section-{id} anchors; birthdayCafe excluded (conditional row).
    sections: ['trending', 'concerts', 'tours', 'agencyHq', 'merchandise', 'memberFootsteps'],
  },
  {
    id: 'k-drama',
    href: '/explore/k-drama',
    icon: Tv,
    tKey: 'kdrama',
    sections: ['trending', 'filming', 'tours', 'historical', 'ostCafes'],
    filters: [
      { param: 'broadcaster', values: ['tvN', 'MBC', 'SBS', 'KBS', 'JTBC', 'Netflix'] },
      { param: 'region', values: ['Jeju', 'Ulsan', 'Jeonbuk', 'Jongno'] },
    ],
    detailHrefs: { filming: '/explore/k-drama/tangerines/filming-spots' },
  },
  {
    id: 'k-beauty',
    href: '/explore/k-beauty',
    icon: Sparkles,
    tKey: 'kbeauty',
    sections: ['trending', 'skincare', 'makeup', 'spa', 'salon'],
    // DEC-61 — matches the content plan's exact 6 districts (was 4, missing
    // Seongsu/Jongno/Jamsil, had Apgujeong which the deck doesn't chip on).
    filters: [{ param: 'district', values: ['Gangnam', 'Myeongdong', 'Seongsu', 'Hongdae', 'Jongno', 'Jamsil'] }],
    detailHrefs: { brandFlagship: '/explore/k-beauty/perfume-flagships' },
  },
  {
    id: 'k-food',
    href: '/explore/k-food',
    icon: Utensils,
    tKey: 'kfood',
    sections: ['trending', 'noodles', 'soups', 'hanjeongsik'],
    filters: [
      { param: 'badge', values: ['MICHELIN', 'REDRIBBON', 'B4KPICK', 'WOOSOLLANG', 'MULTI'] },
      { param: 'region', values: ['Seoul', 'GyeongnamUlsan', 'Busan', 'GangwonChungbuk', 'GyeonggiIncheon'] },
    ],
  },
  {
    id: 'k-culture',
    href: '/explore/k-culture',
    icon: Globe,
    tKey: 'kculture',
    sections: ['trending', 'traditional', 'food', 'festivals', 'crafts'],
    filters: [
      { param: 'badge', values: ['UNESCO', 'NATIONAL_HERITAGE'] },
      { param: 'region', values: ['Jeju', 'Seoul', 'Gangwon', 'Gyeongbuk', 'Busan'] },
    ],
    detailHrefs: { heritage: '/explore/k-culture/gyeongbuk/heritage' },
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
  const locale = useLocale()
  const pathname = usePathname()
  const pageSearchParams = useSearchParams()

  const cat = CATEGORIES.find(c => c.id === category)!
  const CatIcon = cat.icon

  // Keyed by filter param (e.g. 'broadcaster'/'region') so multiple simultaneous
  // chip rows (K-Drama/K-Food/K-Culture) each track their own active value.
  const [activeFilters, setActiveFilters] = useState<Record<string, string | null>>({})

  useEffect(() => {
    track('content_hub_view', { domain: HUB_DOMAIN[category], locale, screen_id: `CT_${category}` })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  // Fetch directly (not via useExplore) so the chip filter can pass a query param.
  // `locale` is part of the SWR key (not just the URL) so switching language via
  // the in-app switcher busts the cache — the API route resolves display names
  // from a NEXT_LOCALE cookie server-side, and an unchanged key would keep
  // serving the previous locale's cached response indefinitely.
  const fetchParams = new URLSearchParams()
  for (const f of cat.filters ?? []) {
    const value = activeFilters[f.param]
    if (value) fetchParams.set(f.param, value)
  }
  // CT_KP_EXT (DEC-60) dev-only preview passthrough — forwards the page's own
  // ?includeUnverified=1 to the API route so placeholder (verified:false) rows
  // can be checked against complete-looking content before BLK-35/BLK-36 land.
  // route.ts itself no-ops this outside development, so this is a plain
  // passthrough with no separate gate needed here.
  const includeUnverified = pageSearchParams.get('includeUnverified')
  if (includeUnverified) fetchParams.set('includeUnverified', includeUnverified)
  const query = fetchParams.toString() ? `?${fetchParams.toString()}` : ''
  const { data, isLoading, error, mutate } = useSWR<ExploreData>(
    [`/api/explore/${category}${query}`, locale],
    ([url]) => fetcher<ExploreData>(url),
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
                  isActive ? 'bg-muted-3 text-fg' : 'text-muted hover:bg-muted-3 hover:text-fg',
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
          <CatIcon size={22} strokeWidth={2} className="text-fg shrink-0" />
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
                  isActive ? 'bg-fg text-bg' : 'text-muted hover:text-fg',
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
              className="flex items-center gap-sp-2 text-f-md font-semibold text-muted hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
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

            {/* Section Entry (Figma) — real entity_type='collection' cards, filterable
                by primary_type. Added 2026-08-30 alongside the existing POI rows below
                (different content: curated multi-place collections vs individual
                places) rather than replacing them. */}
            <ExploreCollectionsGrid category={category} />

            {/* CT_KP_EXT (DEC-60) — k-pop only: global agency filter + artist tile
                grid + 6(-7) rows, entirely separate from the generic per-hub body
                below. The other 4 sections (k-drama/k-beauty/k-food/k-culture) all
                go through the generic body — DEC-61 confirms K-Pop is the only
                section whose mid-tier needs a bespoke tile-grid component. */}
            {category === 'k-pop' ? (
              <KpopArtistNav data={data} />
            ) : (
              <>
                {/* H4 Chip filter row(s) — one per simultaneous facet (see CategoryConfig.filters) */}
                {(cat.filters ?? []).map(f => (
                  <ExploreChipFilter
                    key={f.param}
                    config={f}
                    active={activeFilters[f.param] ?? null}
                    onChange={(value) => setActiveFilters(prev => ({ ...prev, [f.param]: value }))}
                  />
                ))}

                {/* H3 Horizontal-scroll section rows */}
                {data.sections.every(s => s.items.length === 0) ? (
                  <div
                    className="flex flex-col items-center justify-center text-center py-sp-16 px-sp-6 rounded-none"
                    style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
                  >
                    <Compass size={40} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-4" />
                    <p className="text-f-xl font-semibold text-fg mb-sp-2">{t(`${cat.tKey}.empty.title`)}</p>
                    <p className="text-f-md text-muted max-w-[320px] mb-sp-4">{t(`${cat.tKey}.empty.desc`)}</p>
                    <Link
                      href="/map"
                      className="cta-primary"
                    >
                      {t('empty.cta')}
                    </Link>
                  </div>
                ) : (
                  data.sections
                    .filter(s => s.items.length > 0)
                    .map(section => (
                      <ExploreSectionRow
                        key={section.id}
                        id={section.id}
                        items={section.items}
                        category={category}
                        hubDomain={HUB_DOMAIN[category]}
                        viewAllHref={cat.detailHrefs?.[section.id] ?? `/search?q=${category}`}
                        allowFeatured={FEATURED_SECTIONS.has(section.id)}
                      />
                    ))
                )}
              </>
            )}

            {/* H5 B4K Best Packages */}
            {data.packages && data.packages.length > 0 && <ExplorePackages packages={data.packages} />}

            {/* H6 Per-hub AI Planner CTA — hidden, not ready for launch */}
          </>
        )}
      </div>
    </div>
  )
}
