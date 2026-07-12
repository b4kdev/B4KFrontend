'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import { Search, SlidersHorizontal, MapPin, BookOpen, Sparkles, X, ChevronRight } from 'lucide-react'
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

// ─── Desktop Filter Panel ─────────────────────────────────────────────────────

function SearchFilterPanel({
  type,
  setType,
  sort,
  setSort,
}: {
  type: FilterType
  setType: (t: FilterType) => void
  sort: SortType
  setSort: (s: SortType) => void
}) {
  const t = useTranslations('search.filters')
  const sections: FilterType[] = ['all', 'places', 'plans', 'explore']

  return (
    <aside
      className="hidden lg:block w-[220px] shrink-0 pr-sp-6"
      style={{ borderRight: 'var(--bdr)' }}
    >
      <p className="text-f-sm font-semibold text-fg mb-sp-4">{t('title')}</p>

      <div className="mb-sp-6">
        <p className="text-f-xs text-muted uppercase tracking-[0.08em] mb-sp-2">
          {t('sections')}
        </p>
        <div className="flex flex-col gap-sp-1">
          {sections.map(s => (
            <button
              key={s}
              onClick={() => setType(s)}
              className="text-left px-sp-3 py-sp-2 rounded-full text-f-sm transition-colors min-h-touch flex items-center"
              style={{
                background: type === s ? 'var(--lav-dim)' : 'transparent',
                color: type === s ? 'var(--lav)' : 'var(--muted)',
              }}
            >
              {t(`section_${s}` as const)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-f-xs text-muted uppercase tracking-[0.08em] mb-sp-2">
          {t('sort.label')}
        </p>
        {(['relevance', 'popularity'] as SortType[]).map(s => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className="w-full text-left px-sp-3 py-sp-2 rounded-full text-f-sm transition-colors min-h-touch flex items-center"
            style={{
              background: sort === s ? 'var(--lav-dim)' : 'transparent',
              color: sort === s ? 'var(--lav)' : 'var(--muted)',
            }}
          >
            {t(`sort.${s}` as const)}
          </button>
        ))}
      </div>
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

// ─── Result Sections ──────────────────────────────────────────────────────────

function PoiSection({ places }: { places: SearchPoi[] }) {
  const t = useTranslations('search')
  const router = useRouter()

  return (
    <section>
      <h2 className="text-f-xs font-semibold uppercase tracking-[0.08em] text-muted px-sp-4 py-sp-2">
        {t('results.poi')}
      </h2>
      <ul>
        {places.map(poi => {
          const name = getDisplayName({ name_en: poi.name_en, name_ko: poi.name_ko })
          return (
            <li key={poi.place_id}>
              <button
                className="w-full flex items-center gap-sp-3 px-sp-4 py-sp-3 text-left hover:bg-muted-3 transition-colors min-h-touch"
                style={{ borderBottom: 'var(--bdr)' }}
                onClick={() => router.push(`/map?poi=${poi.place_id}`)}
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
    </section>
  )
}

function PlanSection({ plans }: { plans: SearchPlan[] }) {
  const t = useTranslations('search')
  const router = useRouter()

  return (
    <section>
      <h2 className="text-f-xs font-semibold uppercase tracking-[0.08em] text-muted px-sp-4 py-sp-2">
        {t('results.plans')}
      </h2>
      <ul>
        {plans.map(plan => (
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
    </section>
  )
}

function ExploreSection({ explore }: { explore: SearchExplore[] }) {
  const t = useTranslations('search')

  return (
    <section>
      <h2 className="text-f-xs font-semibold uppercase tracking-[0.08em] text-muted px-sp-4 py-sp-2">
        {t('results.explore')}
      </h2>
      <div className="flex flex-wrap gap-sp-2 px-sp-4 py-sp-3">
        {explore.map(item => (
          <Link
            key={item.category}
            href={item.href as `/explore/${string}`}
            className="px-sp-4 py-sp-2 rounded-full text-f-sm font-semibold text-lav min-h-touch flex items-center"
            style={{ border: '1px solid var(--lav-border)' }}
            aria-label={t('exploreAriaLabel', { category: item.category })}
          >
            {t(`categories.${item.label_key}` as `categories.${string}`)}
          </Link>
        ))}
      </div>
    </section>
  )
}

// ─── Mobile Filter Sheet ──────────────────────────────────────────────────────

function MobileFilterSheet({
  open,
  onClose,
  type,
  setType,
  sort,
  setSort,
}: {
  open: boolean
  onClose: () => void
  type: FilterType
  setType: (t: FilterType) => void
  sort: SortType
  setSort: (s: SortType) => void
}) {
  const t = useTranslations('search.filters')
  const sections: FilterType[] = ['all', 'places', 'plans', 'explore']

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
        className="absolute bottom-0 left-0 right-0 p-sp-6 rounded-none"
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

        <p className="text-f-xs text-muted uppercase tracking-[0.08em] mb-sp-2">{t('sections')}</p>
        <div className="flex flex-wrap gap-sp-2 mb-sp-4">
          {sections.map(s => (
            <button
              key={s}
              onClick={() => { setType(s); onClose() }}
              className="px-sp-4 py-sp-2 rounded-full text-f-sm font-semibold min-h-touch transition-colors"
              style={{
                background: type === s ? 'var(--lav)' : 'var(--muted-3)',
                color: type === s ? 'var(--bg)' : 'var(--muted)',
              }}
            >
              {t(`section_${s}` as const)}
            </button>
          ))}
        </div>

        <p className="text-f-xs text-muted uppercase tracking-[0.08em] mb-sp-2">{t('sort.label')}</p>
        <div className="flex flex-wrap gap-sp-2">
          {(['relevance', 'popularity'] as SortType[]).map(s => (
            <button
              key={s}
              onClick={() => { setSort(s); onClose() }}
              className="px-sp-4 py-sp-2 rounded-full text-f-sm font-semibold min-h-touch transition-colors"
              style={{
                background: sort === s ? 'var(--lav)' : 'var(--muted-3)',
                color: sort === s ? 'var(--bg)' : 'var(--muted)',
              }}
            >
              {t(`sort.${s}` as const)}
            </button>
          ))}
        </div>
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Build SWR key — null when no query to avoid fetching
  const swrKey = inputVal.trim()
    ? `/api/search?q=${encodeURIComponent(inputVal.trim())}${type !== 'all' ? `&type=${type}` : ''}&sort=${sort}`
    : null

  const { data, error, isLoading, mutate } = useSWR<SearchResponse>(
    swrKey,
    fetcher,
  )

  // Sync URL param changes → input (e.g. browser back/forward)
  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    setInputVal(q)
  }, [searchParams])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const q = inputVal.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }, [inputVal, router])

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
        <SearchFilterPanel
          type={type}
          setType={setType}
          sort={sort}
          setSort={setSort}
        />

        {/* Results */}
        <main className="flex-1 min-w-0">
          {isLoading && <LoadingState />}

          {!isLoading && error && (
            <ErrorState onRetry={() => mutate()} />
          )}

          {!isLoading && !error && inputVal.trim() && !hasResults && (
            <EmptyState query={inputVal.trim()} />
          )}

          {!isLoading && !error && inputVal.trim() && hasResults && (
            <div>
              {data!.places.length > 0 && (
                <PoiSection places={data!.places} />
              )}
              {data!.plans.length > 0 && (
                <PlanSection plans={data!.plans} />
              )}
              {data!.explore.length > 0 && (
                <ExploreSection explore={data!.explore} />
              )}
            </div>
          )}

          {/* Initial empty — no query yet */}
          {!inputVal.trim() && (
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
        type={type}
        setType={setType}
        sort={sort}
        setSort={setSort}
      />
    </div>
  )
}
