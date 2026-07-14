'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import { Search, SlidersHorizontal, X, ChevronRight } from 'lucide-react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { getDisplayName } from '@/lib/display-name'
import type { SearchPoi, SearchPlan, SearchExplore } from '@/app/api/search/route'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchResponse {
  places: SearchPoi[]
  plans: SearchPlan[]
  explore: SearchExplore[]
  query: string
}

type FilterType = 'all' | 'places' | 'plans' | 'explore'
type SortType = 'relevance' | 'popularity'

// ─── M14 filter data (mock tree + flat tag list) ───────────────────────────────

// Area: two-level hierarchy. lv1 region → lv2 district ids. i18n keys are separate.
const AREA_TREE: Record<string, string[]> = {
  seoul: ['gangnam', 'hongdae', 'myeongdong'],
  busan: ['haeundae', 'seomyeon'],
  jeju: ['jejuCity', 'seogwipo'],
}
const AREA_REGIONS = Object.keys(AREA_TREE)

const TAG_LIST = [
  'kpop', 'kdrama', 'kbeauty', 'food', 'nature', 'shopping', 'history', 'nightlife',
] as const

// ─── Chip ──────────────────────────────────────────────────────────────────────

function Chip({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className="px-sp-3 py-sp-2 rounded-full text-f-sm font-semibold min-h-touch flex items-center transition-colors"
      style={{
        background: active ? 'var(--lav)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--lav)',
        border: active ? '1px solid var(--lav)' : '1px solid var(--lav-border)',
      }}
    >
      {children}
    </button>
  )
}

// ─── Filter controls (shared by desktop panel + mobile sheet) ───────────────────

interface FilterState {
  type: FilterType
  setType: (t: FilterType) => void
  sort: SortType
  setSort: (s: SortType) => void
  areaLv1: string | null
  areaLv2: string | null
  setArea: (lv1: string | null, lv2: string | null) => void
  tags: string[]
  toggleTag: (tag: string) => void
}

function FilterControls({ state }: { state: FilterState }) {
  const t = useTranslations('search.filters')
  // SC-13 (S-EIUBHC) — 3 toggles only; 'all' stays a valid internal state
  // (no chip selected = show everything) but isn't its own clickable pill.
  const sections: FilterType[] = ['places', 'plans', 'explore']
  const districts = state.areaLv1 ? AREA_TREE[state.areaLv1] ?? [] : []

  return (
    <>
      {/* Sections */}
      <div className="mb-sp-6">
        <p className="text-f-xs text-muted uppercase tracking-[0.08em] mb-sp-2">{t('sections')}</p>
        <div className="flex flex-wrap gap-sp-2">
          {sections.map(s => (
            <Chip key={s} active={state.type === s} onClick={() => state.setType(s)}>
              {t(`section_${s}` as const)}
            </Chip>
          ))}
        </div>
      </div>

      {/* Area — level 1 */}
      <div className="mb-sp-6">
        <p className="text-f-xs text-muted uppercase tracking-[0.08em] mb-sp-2">{t('area.lv1Label')}</p>
        <div className="flex flex-wrap gap-sp-2">
          {AREA_REGIONS.map(region => {
            const label = t(`region.${region}` as const)
            const active = state.areaLv1 === region
            return (
              <Chip
                key={region}
                active={active}
                ariaLabel={t('area.chipAriaLabel', { name: label })}
                // Toggle region; clear lv2 when region changes/clears.
                onClick={() => state.setArea(active ? null : region, null)}
              >
                {label}
              </Chip>
            )
          })}
        </div>

        {/* Area — level 2 (appears after lv1 select) */}
        {state.areaLv1 && districts.length > 0 && (
          <div className="mt-sp-3">
            <p className="text-f-xs text-muted uppercase tracking-[0.08em] mb-sp-2">{t('area.lv2Label')}</p>
            <div className="flex flex-wrap gap-sp-2">
              {districts.map(district => {
                const label = t(`district.${district}` as const)
                const active = state.areaLv2 === district
                return (
                  <Chip
                    key={district}
                    active={active}
                    ariaLabel={t('area.chipAriaLabel', { name: label })}
                    onClick={() => state.setArea(state.areaLv1, active ? null : district)}
                  >
                    {label}
                  </Chip>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Theme / tags */}
      <div className="mb-sp-6">
        <p className="text-f-xs text-muted uppercase tracking-[0.08em] mb-sp-2">{t('tags.label')}</p>
        <div className="flex flex-wrap gap-sp-2">
          {TAG_LIST.map(tag => (
            <Chip
              key={tag}
              active={state.tags.includes(tag)}
              onClick={() => state.toggleTag(tag)}
            >
              {t(`tag.${tag}` as const)}
            </Chip>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-f-xs text-muted uppercase tracking-[0.08em] mb-sp-2">{t('sort.label')}</p>
        <div className="flex flex-wrap gap-sp-2">
          {(['relevance', 'popularity'] as SortType[]).map(s => (
            <Chip key={s} active={state.sort === s} onClick={() => state.setSort(s)}>
              {t(`sort.${s}` as const)}
            </Chip>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Desktop Filter Panel ─────────────────────────────────────────────────────

function SearchFilterPanel({ state }: { state: FilterState }) {
  const t = useTranslations('search.filters')

  return (
    <aside
      className="hidden lg:block w-[220px] shrink-0 pr-sp-6"
      style={{ borderRight: 'var(--bdr)' }}
    >
      <p className="text-f-sm font-semibold text-fg mb-sp-4">{t('title')}</p>
      <FilterControls state={state} />
    </aside>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="flex gap-sp-3 p-sp-4 rounded-none animate-pulse"
      style={{ borderBottom: 'var(--bdr)' }}
    >
      <div className="w-[72px] h-[72px] rounded-none shrink-0" style={{ background: 'var(--muted-3)' }} />
      <div className="flex-1 flex flex-col gap-sp-2 justify-center">
        <div className="h-3 w-2/3 rounded-none" style={{ background: 'var(--muted-3)' }} />
        <div className="h-3 w-1/3 rounded-none" style={{ background: 'var(--muted-3)' }} />
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div role="status" aria-label="Searching…">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  const t = useTranslations('search')
  const categories = ['kpop', 'kdrama', 'kbeauty', 'kculture'] as const
  // DEC-26: chips → /search?q=<category>, not Explore hubs
  const queries: Record<string, string> = {
    kpop: 'k-pop',
    kdrama: 'k-drama',
    kbeauty: 'k-beauty',
    kculture: 'k-culture',
  }

  return (
    <div className="flex flex-col items-center text-center py-sp-16 px-sp-6">
      <Search size={40} strokeWidth={2} className="text-muted mb-sp-4" aria-hidden="true" />
      <p className="text-f-lg font-semibold text-fg mb-sp-2">
        {t('noResults', { query })}
      </p>
      <p className="text-f-base text-muted mb-sp-8">{t('noResultsSubtitle')}</p>

      <div className="flex flex-wrap gap-sp-2 justify-center mb-sp-6">
        {categories.map(cat => (
          <Link
            key={cat}
            href={`/search?q=${queries[cat]}`}
            className="px-sp-4 py-sp-2 rounded-full text-f-sm font-semibold text-lav min-h-touch flex items-center"
            style={{ border: '1px solid var(--lav-border)' }}
          >
            {t(`categories.${cat}`)}
          </Link>
        ))}
      </div>

      <Link
        href="/map"
        className="px-sp-6 py-sp-3 rounded-full text-f-sm font-semibold text-fg min-h-touch flex items-center"
        style={{ background: 'var(--muted-3)' }}
      >
        {t('mapCta')}
      </Link>
    </div>
  )
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('search')
  return (
    <div className="flex flex-col items-center text-center py-sp-16 px-sp-6" role="alert">
      <p className="text-f-base text-muted mb-sp-4">{t('error')}</p>
      <button
        onClick={onRetry}
        className="px-sp-6 py-sp-3 rounded-full text-f-sm font-semibold text-lav min-h-touch"
        style={{ border: '1px solid var(--lav-border)' }}
      >
        {t('retry')}
      </button>
    </div>
  )
}

// ─── See-all expand link ────────────────────────────────────────────────────────

const SEE_ALL_LIMIT = 4

function SeeAllLink({
  labelKey,
  count,
  expanded,
  onToggle,
}: {
  labelKey: 'seeAllPlaces' | 'seeAllPlans' | 'seeAllExplore'
  count: number
  expanded: boolean
  onToggle: () => void
}) {
  const t = useTranslations('search')
  if (count <= SEE_ALL_LIMIT) return null
  return (
    <div className="px-sp-4 py-sp-3">
      <button
        type="button"
        onClick={onToggle}
        className="text-f-sm font-semibold text-lav min-h-touch flex items-center gap-sp-1"
      >
        {expanded ? t('showLess') : t(labelKey, { count })}
        {!expanded && <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />}
      </button>
    </div>
  )
}

// ─── Result Sections ──────────────────────────────────────────────────────────

function PoiSection({
  places,
  expanded,
  onToggle,
}: {
  places: SearchPoi[]
  expanded: boolean
  onToggle: () => void
}) {
  const t = useTranslations('search')
  const router = useRouter()
  const shown = expanded ? places : places.slice(0, SEE_ALL_LIMIT)

  return (
    <section>
      <h2 className="text-f-xs font-semibold uppercase tracking-[0.08em] text-muted px-sp-4 py-sp-2">
        {t('results.poi')}
      </h2>
      <ul>
        {shown.map(poi => {
          const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
          return (
            <li key={poi.poi_id}>
              <button
                className="w-full flex items-center gap-sp-3 px-sp-4 py-sp-3 text-left hover:bg-muted-3 transition-colors min-h-touch"
                style={{ borderBottom: 'var(--bdr)' }}
                onClick={() => router.push(`/map?poi=${poi.poi_id}`)}
                aria-label={t('poiAriaLabel', { name, region: poi.display_region })}
              >
                <div
                  className="w-[56px] h-[56px] shrink-0 rounded-none overflow-hidden"
                  style={{ background: 'var(--muted-3)' }}
                >
                  {poi.primary_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={poi.primary_image_url}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-f-base text-fg truncate font-semibold">{name}</p>
                  <p className="text-f-sm text-muted truncate">{poi.display_region}</p>
                  <p className="text-f-xs text-muted">{t('saves', { count: poi.save_count })}</p>
                </div>
                <ChevronRight size={16} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
      <SeeAllLink labelKey="seeAllPlaces" count={places.length} expanded={expanded} onToggle={onToggle} />
    </section>
  )
}

function PlanSection({
  plans,
  expanded,
  onToggle,
}: {
  plans: SearchPlan[]
  expanded: boolean
  onToggle: () => void
}) {
  const t = useTranslations('search')
  const router = useRouter()
  const shown = expanded ? plans : plans.slice(0, SEE_ALL_LIMIT)

  return (
    <section>
      <h2 className="text-f-xs font-semibold uppercase tracking-[0.08em] text-muted px-sp-4 py-sp-2">
        {t('results.plans')}
      </h2>
      <ul>
        {shown.map(plan => (
          <li key={plan.id}>
            <button
              className="w-full flex items-center gap-sp-3 px-sp-4 py-sp-3 text-left hover:bg-muted-3 transition-colors min-h-touch"
              style={{ borderBottom: 'var(--bdr)' }}
              onClick={() => router.push(`/plan/${plan.id}`)}
              aria-label={t('planAriaLabel', { title: plan.title, author: plan.author_name })}
            >
              <div
                className="w-[56px] h-[56px] shrink-0 rounded-none overflow-hidden"
                style={{ background: 'var(--muted-3)' }}
              >
                {plan.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={plan.cover_image_url}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-sp-2">
                  <p className="text-f-base text-fg truncate font-semibold">{plan.title}</p>
                  {plan.is_partner && (
                    <span className="text-f-xs text-muted shrink-0">{t('sponsored')}</span>
                  )}
                </div>
                <p className="text-f-sm text-muted truncate">{plan.author_name}</p>
                <p className="text-f-xs text-muted">{t('stops', { count: plan.stop_count })}</p>
              </div>
              <ChevronRight size={16} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <SeeAllLink labelKey="seeAllPlans" count={plans.length} expanded={expanded} onToggle={onToggle} />
    </section>
  )
}

function ExploreSection({
  explore,
  expanded,
  onToggle,
}: {
  explore: SearchExplore[]
  expanded: boolean
  onToggle: () => void
}) {
  const t = useTranslations('search')
  const shown = expanded ? explore : explore.slice(0, SEE_ALL_LIMIT)

  return (
    <section>
      <h2 className="text-f-xs font-semibold uppercase tracking-[0.08em] text-muted px-sp-4 py-sp-2">
        {t('results.explore')}
      </h2>
      <div className="flex flex-wrap gap-sp-2 px-sp-4 py-sp-3">
        {shown.map(item => (
          <Link
            key={item.category}
            href={item.href as `/explore/${string}`}
            className="px-sp-4 py-sp-2 rounded-full text-f-sm font-semibold text-lav min-h-touch flex items-center"
            style={{ border: '1px solid var(--lav-border)' }}
            aria-label={t('exploreAriaLabel', { category: t(`categories.${item.label_key}` as `categories.${string}`) })}
          >
            {t(`categories.${item.label_key}` as `categories.${string}`)}
          </Link>
        ))}
      </div>
      <SeeAllLink labelKey="seeAllExplore" count={explore.length} expanded={expanded} onToggle={onToggle} />
    </section>
  )
}

// ─── Mobile Filter Sheet ──────────────────────────────────────────────────────

function MobileFilterSheet({
  open,
  onClose,
  state,
}: {
  open: boolean
  onClose: () => void
  state: FilterState
}) {
  const t = useTranslations('search.filters')

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
    >
      <button
        className="absolute inset-0 w-full h-full"
        style={{ background: 'var(--backdrop-50)' }}
        onClick={onClose}
        aria-label="Close filters"
        tabIndex={-1}
      />
      <div
        className="absolute bottom-0 left-0 right-0 p-sp-6 rounded-none max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--bg-2)', borderTop: 'var(--bdr)' }}
      >
        <div className="flex items-center justify-between mb-sp-4">
          <p className="text-f-base font-semibold text-fg">{t('title')}</p>
          <button
            onClick={onClose}
            className="text-muted min-h-touch min-w-touch flex items-center justify-center"
            aria-label="Close filters"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <FilterControls state={state} />

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-sp-6 py-sp-3 rounded-full text-f-sm font-semibold min-h-touch flex items-center justify-center"
          style={{ background: 'var(--lav)', color: 'var(--bg)' }}
        >
          {t('apply')}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const t = useTranslations('search')
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialQ = searchParams.get('q') ?? ''
  const [inputVal, setInputVal] = useState(initialQ)
  const [type, setType] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('relevance')
  const [areaLv1, setAreaLv1] = useState<string | null>(null)
  const [areaLv2, setAreaLv2] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [expanded, setExpanded] = useState({ places: false, plans: false, explore: false })
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Hydrate filter state from URL params (mount + browser back/forward).
  useEffect(() => {
    setInputVal(searchParams.get('q') ?? '')
    const urlType = searchParams.get('type')
    setType(urlType === 'places' || urlType === 'plans' || urlType === 'explore' ? urlType : 'all')
    setSort(searchParams.get('sort') === 'popularity' ? 'popularity' : 'relevance')
    const lv1 = searchParams.get('area_lv1')
    const lv2 = searchParams.get('area_lv2')
    setAreaLv1(lv1 && AREA_TREE[lv1] ? lv1 : null)
    setAreaLv2(lv1 && lv2 && AREA_TREE[lv1]?.includes(lv2) ? lv2 : null)
    const tagParam = searchParams.get('tags')
    setTags(tagParam ? tagParam.split(',').filter(t => (TAG_LIST as readonly string[]).includes(t)) : [])
    setExpanded({ places: false, plans: false, explore: false })
  }, [searchParams])

  // Write filter changes back to URL (replace — don't inflate history).
  const syncFilters = useCallback(
    (next: {
      type?: FilterType
      sort?: SortType
      areaLv1?: string | null
      areaLv2?: string | null
      tags?: string[]
    }) => {
      const q = inputVal.trim()
      if (!q) return
      const p = new URLSearchParams()
      p.set('q', q)
      const nType = next.type ?? type
      const nSort = next.sort ?? sort
      const nLv1 = next.areaLv1 !== undefined ? next.areaLv1 : areaLv1
      const nLv2 = next.areaLv2 !== undefined ? next.areaLv2 : areaLv2
      const nTags = next.tags ?? tags
      if (nType !== 'all') p.set('type', nType)
      if (nSort !== 'relevance') p.set('sort', nSort)
      if (nLv1) p.set('area_lv1', nLv1)
      if (nLv2) p.set('area_lv2', nLv2)
      if (nTags.length) p.set('tags', nTags.join(','))
      router.replace(`/search?${p.toString()}`)
    },
    [inputVal, type, sort, areaLv1, areaLv2, tags, router],
  )

  const filterState: FilterState = {
    type,
    setType: t => { setType(t); syncFilters({ type: t }) },
    sort,
    setSort: s => { setSort(s); syncFilters({ sort: s }) },
    areaLv1,
    areaLv2,
    setArea: (lv1, lv2) => {
      setAreaLv1(lv1)
      setAreaLv2(lv2)
      syncFilters({ areaLv1: lv1, areaLv2: lv2 })
    },
    tags,
    toggleTag: tag => {
      const nTags = tags.includes(tag) ? tags.filter(x => x !== tag) : [...tags, tag]
      setTags(nTags)
      syncFilters({ tags: nTags })
    },
  }

  // Build SWR key — null when no query to avoid fetching.
  const q = inputVal.trim()
  const swrKey = q
    ? (() => {
        const p = new URLSearchParams()
        p.set('q', q)
        if (type !== 'all') p.set('type', type)
        p.set('sort', sort)
        if (areaLv1) p.set('area_lv1', areaLv1)
        if (areaLv2) p.set('area_lv2', areaLv2)
        if (tags.length) p.set('tags', tags.join(','))
        return `/api/search?${p.toString()}`
      })()
    : null

  const { data, error, isLoading, mutate } = useSWR<SearchResponse>(swrKey, fetcher)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim()) return
    // Preserve active filters when re-submitting a query.
    syncFilters({})
  }, [inputVal, syncFilters])

  const hasResults = data && (
    data.places.length > 0 || data.plans.length > 0 || data.explore.length > 0
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-sp-4 py-sp-3 flex items-center gap-sp-3"
        style={{ background: 'var(--bg-2)', borderBottom: 'var(--bdr)' }}
      >
        <form onSubmit={handleSubmit} className="flex-1 relative" role="search">
          <span className="absolute left-sp-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true">
            <Search size={16} strokeWidth={2} />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder={t('placeholder')}
            aria-label={t('placeholder')}
            className="w-full h-10 rounded-full pl-10 pr-sp-4 text-f-base text-fg placeholder:text-muted outline-none bg-bg-3 min-h-touch"
            style={{ border: '1px solid var(--bdr)' }}
          />
          {inputVal && (
            <button
              type="button"
              className="absolute right-sp-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
              onClick={() => { setInputVal(''); inputRef.current?.focus() }}
              aria-label="Clear search"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </form>

        {/* Mobile filter button */}
        <button
          className="lg:hidden min-h-touch min-w-touch flex items-center justify-center text-muted hover:text-fg rounded-full"
          onClick={() => setFilterSheetOpen(true)}
          aria-label={t('mobileFilter')}
        >
          <SlidersHorizontal size={20} strokeWidth={2} />
        </button>
      </header>

      {/* Body */}
      <div className="max-w-[1280px] mx-auto flex gap-sp-8 px-sp-4 lg:px-sp-8 py-sp-6">
        {/* Desktop sidebar */}
        <SearchFilterPanel state={filterState} />

        {/* Results */}
        <main className="flex-1 min-w-0">
          {isLoading && <LoadingState />}

          {!isLoading && error && (
            <ErrorState onRetry={() => mutate()} />
          )}

          {!isLoading && !error && q && !hasResults && (
            <EmptyState query={q} />
          )}

          {!isLoading && !error && q && hasResults && (
            <div>
              {data!.places.length > 0 && (
                <PoiSection
                  places={data!.places}
                  expanded={expanded.places}
                  onToggle={() => setExpanded(e => ({ ...e, places: !e.places }))}
                />
              )}
              {data!.plans.length > 0 && (
                <PlanSection
                  plans={data!.plans}
                  expanded={expanded.plans}
                  onToggle={() => setExpanded(e => ({ ...e, plans: !e.plans }))}
                />
              )}
              {data!.explore.length > 0 && (
                <ExploreSection
                  explore={data!.explore}
                  expanded={expanded.explore}
                  onToggle={() => setExpanded(e => ({ ...e, explore: !e.explore }))}
                />
              )}
            </div>
          )}

          {/* Initial empty — no query yet */}
          {!q && (
            <div className="flex flex-col items-center text-center py-sp-16 px-sp-6">
              <Search size={40} strokeWidth={2} className="text-muted mb-sp-4" aria-hidden="true" />
              <p className="text-f-base text-muted">{t('placeholder')}</p>
              <div className="flex flex-wrap gap-sp-2 justify-center mt-sp-8">
                {(['kpop', 'kdrama', 'kbeauty', 'kculture'] as const).map(cat => {
                  // DEC-26: chips → /search?q=<category>, not Explore hubs
                  const queries: Record<string, string> = {
                    kpop: 'k-pop', kdrama: 'k-drama',
                    kbeauty: 'k-beauty', kculture: 'k-culture',
                  }
                  return (
                    <Link
                      key={cat}
                      href={`/search?q=${queries[cat]}`}
                      className="px-sp-4 py-sp-2 rounded-full text-f-sm font-semibold text-lav min-h-touch flex items-center"
                      style={{ border: '1px solid var(--lav-border)' }}
                    >
                      {t(`categories.${cat}`)}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile filter sheet */}
      <MobileFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        state={filterState}
      />
    </div>
  )
}
