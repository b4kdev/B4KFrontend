'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import useSWR from 'swr'
import { Map as MapIcon } from 'lucide-react'
import { Link as IntlLink, useRouter } from '@/i18n/navigation'
import {
  Breadcrumbs,
  Button,
  Card,
  Chip,
  EmptyState,
  ExploreCollections,
  ExplorePackages,
  Hero,
  LeftPanel,
  PlanningCue,
  RowSection,
  Skeleton,
  Tabs,
  TreeItem,
  TreeView,
} from '@/components/library'
import { usePathname } from 'next/navigation'
import { usePhone } from '@/components/library/hooks'
import type { ExploreData, ExplorePoi } from '@/app/api/explore/[category]/route'
import type { CollectionCard } from '@/app/api/explore/[category]/collections/route'
import type { CollectionDetail } from '@/lib/collections'
import type { HomeTrendingPoi } from '@/app/api/home/trending/route'
import type { HomePopularPlan } from '@/app/api/home/popular-plans/route'
import { useCd, useCdKey } from '../cd'
import { usePlaceActions } from '../usePlaceActions'
import { useDDay } from '../useDDay'
import { useGap } from '../gaps'
import { V2Page } from '../V2Page'
import { useV2Shell } from '../V2Shell'
import { CATEGORIES, jsonFetch, RowState } from './A2Home'

// Explore (A2): Category page (SCR-002), See all list (SCR-010), Collection page (SCR-014),
// Category special pages (SCR-015). Live data from /api/explore/*. Desktop: Left panel Index (280)
// with the category tree; phones: category Tabs on top. Card taps open the map with the place
// (PD-20); the Planning cue sits after the first row (PD-36).

const CAT_KEY: Record<string, string> = { 'k-pop': 'kpop', 'k-drama': 'kdrama', 'k-beauty': 'kbeauty', 'k-culture': 'kculture', 'k-food': 'kfood' }
// Collection types (lib/collections) → their Copy Deck chip labels (Explore collections).
const COLLECTION_TYPE: Record<string, string> = { ROUTE: 'CD1336', FAN_THEME: 'CD1337', STORY: 'CD1338', CHALLENGE: 'CD1339' }
const poiName = (p: { name_ko: string; name_en?: string | null }, locale: string) => (locale === 'ko' ? p.name_ko : p.name_en || p.name_ko)

// Rows that open their special page instead of the generic See all list (as on the live site),
// keyed by category then row id.
const SPECIAL_HREF: Record<string, Record<string, string>> = {
  'k-pop': { memberFootsteps: '/explore/k-pop/bts/footsteps' },
  'k-drama': { filming: '/explore/k-drama/tangerines/filming-spots' },
  'k-beauty': { brandFlagship: '/explore/k-beauty/perfume-flagships' },
  'k-culture': { heritage: '/explore/k-culture/gyeongbuk/heritage' },
  'k-food': { noodles: '/explore/k-food/michelin-noodles' },
}
const rowHref = (category: string, row: string) => SPECIAL_HREF[category]?.[row] ?? `/explore/${category}/${row}`

// Row labels drawn per category where the Copy Deck has them; the shared row label otherwise.
const ROW_LABEL: Record<string, Record<string, string>> = {
  'k-pop': { trending: 'CD1555', concerts: 'CD1556', merchandise: 'CD1557' },
  'k-drama': { trending: 'CD1561' },
}
function useRowLabel() {
  const t = useCd()
  const k = useCdKey()
  return (category: string, row: string) => (ROW_LABEL[category]?.[row] ? t(ROW_LABEL[category][row]) : k(`explore.sections.${row}`))
}

function CategoryIndex({ category, sections, active }: { category: string; sections: string[]; active?: string }) {
  const t = useCd()
  const rowLabel = useRowLabel()
  const router = useRouter()
  // On the category page itself the first row (its top section) is the selected one.
  const current = active ?? sections[0]
  return (
    <div className="flex flex-col gap-[var(--space-4)] pt-[var(--space-4)]">
      <p aria-hidden className="px-[var(--space-4)] type-eyebrow-category text-ui-fg-muted">{t('CD0804')}</p>
      <TreeView label={t('CD0804')}>
        {CATEGORIES.map((c) => (
          <TreeItem
            key={c.slug}
            label={t(c.label)}
            kind={c.slug === category ? 'expanded' : 'collapsed'}
            selected={false}
            onToggle={() => router.push(`/explore/${c.slug}`)}
            onSelect={() => router.push(`/explore/${c.slug}`)}
          >
            {c.slug === category
              ? [
                  ...sections.map((s) => (
                    <TreeItem key={s} level={2} kind="leaf" label={rowLabel(c.slug, s)} selected={current === s} onSelect={() => router.push(rowHref(c.slug, s))} />
                  )),
                  <TreeItem key="collections" level={2} kind="leaf" label={t('CD0162')} selected={active === 'collections'} onSelect={() => router.push(`/explore/${c.slug}#collections`)} />,
                ]
              : null}
          </TreeItem>
        ))}
      </TreeView>
    </div>
  )
}

function ExploreFrame({ category, sections, active, pageTitle, children }: { category: string; sections: string[]; active?: string; pageTitle?: string; children: React.ReactNode }) {
  const t = useCd()
  const phone = usePhone()
  const router = useRouter()
  return (
    <div className="flex min-h-0 flex-1">
      {!phone ? (
        <LeftPanel type="index" label={t('CD0804')}>
          <CategoryIndex category={category} sections={sections} active={active} />
        </LeftPanel>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* A list page inside a category (See all) gets a Page top bar with its title on phones, no tabs. */}
        <V2Page bar={pageTitle ? { type: 'page', title: pageTitle } : { type: 'home' }}>
          {phone && !pageTitle ? (
            <Tabs
              label={t('CD0804')}
              value={category}
              onValueChange={(v) => router.push(`/explore/${v}`)}
              tabs={CATEGORIES.map((c) => ({ id: c.slug, label: t(c.label) }))}
              className="-mx-[var(--grid-gutter-mobile)] -mt-[var(--space-6)] mb-[var(--space-6)] px-[var(--grid-gutter-mobile)]"
            />
          ) : null}
          {children}
        </V2Page>
      </div>
    </div>
  )
}

const LAST_CATEGORY_KEY = 'b4k_last_explore_category'

/** /explore: no hub, it opens the category the visitor used last on this device (K-Pop the first time). */
export function ExploreEntryScreen() {
  const router = useRouter()
  const [category, setCategory] = useState<string | null>(null)
  useEffect(() => {
    let last: string | null = null
    try { last = localStorage.getItem(LAST_CATEGORY_KEY) } catch {}
    if (last && last !== 'k-pop' && CATEGORIES.some((c) => c.slug === last)) router.replace(`/explore/${last}`)
    else setCategory('k-pop')
  }, [router])
  return category ? <CategoryScreen category={category} /> : null
}

export function CategoryScreen({ category }: { category: string }) {
  useEffect(() => {
    try { localStorage.setItem(LAST_CATEGORY_KEY, category) } catch {}
  }, [category])
  const act = usePlaceActions({ resume: true })
  const GAP = useGap()
  const t = useCd()
  const k = useCdKey()
  const locale = useLocale()
  const { openQuickPlan } = useV2Shell()
  const rowLabel = useRowLabel()
  const { data, error, isLoading, mutate } = useSWR<ExploreData>(`/api/explore/${category}`, jsonFetch)
  const cols = useSWR<{ items: CollectionCard[] }>(`/api/explore/${category}/collections?locale=${locale}`, jsonFetch)
  const [colType, setColType] = useState('all')
  const sections = data?.sections.filter((s) => s.items.length) ?? []
  const hero = data?.hero?.[0]
  const cue = (
    <PlanningCue
      state="start"
      label={t('CD1359')}
      tiles={{
        newPlan: { href: '/map?plan=new', title: t('CD1359'), text: t('CD1360') },
        quickPlan: { onOpen: openQuickPlan, title: t('CD1361'), text: t('CD1362') },
        fromSaved: { href: '/saved/plan', title: t('CD1363'), text: t('CD1364') },
      }}
    />
  )
  const colTypes = useMemo(() => Array.from(new Set((cols.data?.items ?? []).map((c) => c.primaryType).filter(Boolean))) as string[], [cols.data])
  return (
    <ExploreFrame category={category} sections={sections.map((s) => s.id)}>
      <div className="flex flex-col gap-[var(--space-12)]">
        <h1 className="sr-only">{k(`explore.${CAT_KEY[category]}.title`)}</h1>
        {hero ? (
          <Hero
            size="section"
            as="h2"
            imageSrc={hero.image_url}
            eyebrow={hero.badge}
            title={hero.title}
            subtitle={hero.subtitle}
            action={<IntlLink href={`${hero.cta_href}`} className="inline-flex h-[var(--control-height-lg)] items-center bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse">{hero.cta_label}</IntlLink>}
            // Edge to edge in the content area: flush under the header on desktop, under the tabs on phones.
            className="-mx-[var(--grid-gutter-mobile)] -mt-[var(--space-6)] w-auto md:-mx-[var(--grid-gutter-tablet)] lg:-mx-[var(--space-8)]"
          />
        ) : null}
        {isLoading ? <RowState title={k(`explore.${CAT_KEY[category]}.title`)} loading onRetry={() => mutate()} /> : null}
        {error ? <RowState title={k(`explore.${CAT_KEY[category]}.title`)} error={error} onRetry={() => mutate()} /> : null}
        {sections.map((s, i) => {
          const featured = s.items.find((p) => p.is_featured)
          return (
            <div key={s.id} className="flex flex-col gap-[var(--space-12)]">
              <RowSection
                arrowLabels={{ previous: t('CD0390'), next: t('CD0389') }}
                title={rowLabel(category, s.id)}
                seeAll={{ href: rowHref(category, s.id), label: t('CD1309') }}
                featured={featured ? <Card type="featured" href={`/map?poi=${featured.poi_id}`} title={poiName(featured, locale)} imageSrc={featured.primary_image_url} eyebrow={t('CD0423')} meta={featured.display_region} /> : undefined}
                cards={s.items.filter((p) => p !== featured).map((p) => <PoiCard key={p.poi_id} p={p} act={act} />)}
              />
              {i === 0 ? cue : null}
            </div>
          )
        })}
        {cols.data?.items.length ? (
          <div id="collections" className="scroll-mt-[var(--space-6)]">
          <ExploreCollections
            title={t('CD0162')}
            filters={[{ id: 'all', label: t('CD1267') }, ...colTypes.map((c) => ({ id: c, label: COLLECTION_TYPE[c] ? t(COLLECTION_TYPE[c]) : c }))]}
            active={colType}
            onFilter={setColType}
            cards={cols.data.items
              .filter((c) => colType === 'all' || c.primaryType === colType)
              .slice(0, 8)
              .map((c) => <Card key={c.slug} type="collection-photo" href={`/explore/collections/${c.slug}`} title={c.title} imageSrc={c.primary_image_url} meta={c.primaryType ?? ''} />)}
          />
          </div>
        ) : null}
        {data?.packages?.length ? (
          <ExplorePackages
            title={t('CD1341')}
            cards={data.packages.map((p) => (
              <Card key={p.id} type="package" href={p.partner_url} external={{ newTabLabel: GAP.newTab }} title={p.title} imageSrc={p.cover_image_url} partner={p.partner_name} cta={GAP.viewOnPartner(p.partner_name)} sponsored={t('CD0476')} />
            ))}
          />
        ) : null}
      </div>
    </ExploreFrame>
  )
}

function PoiCard({ p, act }: { p: ExplorePoi; act: ReturnType<typeof usePlaceActions> }) {
  const locale = useLocale()
  const t = useCd()
  const dDay = useDDay()
  return (
    <Card
      type="place"
      href={`/map?poi=${p.poi_id}`}
      {...act(p.poi_id, poiName(p, locale))}
      title={poiName(p, locale)}
      imageSrc={p.primary_image_url}
      meta={p.display_region}
      trending={p.is_trending ? t('CD0313') : undefined}
      sponsored={p.is_partner ? t('CD0476') : undefined}
      dDay={p.event_date ? dDay(p.event_date) : undefined}
    />
  )
}

// ── See all list (SCR-010) ──────────────────────────────────────────────────

const PAGE = 12

export function SeeAllScreen({ category, row }: { category: string; row: string }) {
  const rowLabel = useRowLabel()
  const act = usePlaceActions({ resume: true })
  const GAP = useGap()
  const t = useCd()
  const locale = useLocale()
  const fromHome = category === 'all'
  const explore = useSWR<ExploreData>(fromHome ? null : `/api/explore/${category}`, jsonFetch)
  const trending = useSWR<HomeTrendingPoi[]>(fromHome && row === 'trending' ? '/api/home/trending' : null, jsonFetch)
  const plans = useSWR<HomePopularPlan[]>(fromHome && row === 'popular-plans' ? '/api/home/popular-plans' : null, jsonFetch)
  const [chip, setChip] = useState('all')
  const [sort, setSort] = useState('popular')
  const [shown, setShown] = useState(PAGE)

  const title = fromHome ? (row === 'trending' ? t('CD0313') : t('CD0477')) : rowLabel(category, row)
  const subtitle = fromHome ? (row === 'trending' ? t('CD1566') : t('CD1568')) : undefined
  const places: { id: string; node: React.ReactNode; domain?: string }[] = fromHome
    ? row === 'trending'
      ? (trending.data ?? []).map((p) => ({ id: p.poi_id, domain: p.display_domain, node: <Card type="place" href={`/map?poi=${p.poi_id}`} {...act(p.poi_id, poiName(p, locale))} title={poiName(p, locale)} imageSrc={p.primary_image_url} meta={p.display_region} /> }))
      : (plans.data ?? []).map((p) => ({ id: p.id, node: <Card type="plan" href={`/plan/${p.id}`} title={p.title} imageSrc={p.cover_image_url} author={p.author_name} saves={String(p.save_count)} stops={t('CD0473', { n: p.stop_count })} /> }))
    : (explore.data?.sections.find((s) => s.id === row)?.items ?? []).map((p) => ({ id: p.poi_id, node: <PoiCard p={p} act={act} /> }))
  const filtered = chip === 'all' ? places : places.filter((p) => p.domain === chip)
  const loading = explore.isLoading || trending.isLoading || plans.isLoading
  const failed = explore.error || trending.error || plans.error
  const sections = explore.data?.sections.filter((s) => s.items.length).map((s) => s.id) ?? []

  const isPlans = fromHome && row === 'popular-plans'
  const categoryLabel = t(CATEGORIES.find((c) => c.slug === category)?.label ?? 'CD0804')
  const sortLabel = sort === 'new' ? t('CD1405') : t('CD1565')
  const body = (
    <div className="flex flex-col gap-[var(--space-4)]">
      <Breadcrumbs
        label={title}
        items={fromHome ? [{ label: t('CD0807'), href: '/' }, { label: title }] : [{ label: categoryLabel, href: `/explore/${category}` }, { label: title }]}
        className="max-lg:hidden"
      />
      {/* Phones show the title in the top bar only. */}
      <header className="flex flex-col gap-[var(--space-1)] max-lg:sr-only">
        <h1 className="type-display-h3">{title}</h1>
        {subtitle ? <p className="type-body-base text-ui-fg-muted">{subtitle}</p> : null}
      </header>
      {/* Chips on the left; the count and the sort (a dropdown chip over a native select) on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
        {fromHome && row === 'trending' ? (
          <div className="flex gap-[var(--space-2)] max-lg:-mx-[var(--grid-gutter-mobile)] max-lg:w-[calc(100%+var(--grid-gutter-mobile)*2)] max-lg:overflow-x-auto max-lg:px-[var(--grid-gutter-mobile)] max-lg:[scrollbar-width:none] lg:flex-wrap">
            <Chip selected={chip === 'all'} onClick={() => setChip('all')}>{t('CD1267')}</Chip>
            {CATEGORIES.map((c) => <Chip key={c.slug} selected={chip === c.slug} onClick={() => setChip(c.slug)}>{t(c.label)}</Chip>)}
          </div>
        ) : <span className="max-lg:hidden" />}
        <div className="flex items-center gap-[var(--space-3)] max-lg:w-full max-lg:justify-between">
          <p aria-live="polite" className="type-body-caption text-ui-fg-muted">{isPlans ? t('CD1302', { count: filtered.length }) : t('CD0160', { count: filtered.length })}</p>
          <label className="relative">
            <Chip type="dropdown" aria-hidden tabIndex={-1} className="pointer-events-none">{sortLabel}</Chip>
            <select aria-label={t('CD1272')} value={sort} onChange={(e) => setSort(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
              <option value="popular">{t('CD1565')}</option>
              <option value="new">{t('CD1405')}</option>
            </select>
          </label>
        </div>
      </div>
      {loading ? <div aria-busy className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div> : null}
      {failed ? <EmptyState type="error" container="bordered" title={t('CD1571')} action={<Button size="md" variant="secondary" onClick={() => location.reload()}>{t('CD0125')}</Button>}>{t('CD1572')}</EmptyState> : null}
      {!loading && !failed && !filtered.length ? (
        <EmptyState type="no-results" title={GAP.noCategoryTrending(chip === 'all' ? '' : t(CATEGORIES.find((c) => c.slug === chip)?.label ?? 'CD0251'))} action={<Button size="md" variant="secondary" onClick={() => setChip('all')}>{t('CD1433')}</Button>}>{t('CD1570')}</EmptyState>
      ) : null}
      <ul className="grid grid-cols-2 gap-x-[var(--space-4)] gap-y-[var(--space-6)] lg:grid-cols-4">{filtered.slice(0, shown).map((p) => <li key={p.id}>{p.node}</li>)}</ul>
      {filtered.length > shown ? <Button variant="secondary" className="self-center" onClick={() => setShown((s) => s + PAGE)}>{t('CD0836')}</Button> : null}
    </div>
  )
  if (fromHome) return <V2Page bar={{ type: 'page', title }}>{body}</V2Page>
  return <ExploreFrame category={category} sections={sections} active={row} pageTitle={title}>{body}</ExploreFrame>
}

// ── Collection page (SCR-014) ───────────────────────────────────────────────

export function CollectionScreen({ slug }: { slug: string }) {
  const act = usePlaceActions({ resume: true })
  const t = useCd()
  const k = useCdKey()
  const locale = useLocale()
  const router = useRouter()
  const { data, error, isLoading, mutate } = useSWR<CollectionDetail>(`/api/explore/collections/${slug}?locale=${locale}`, jsonFetch)
  const [shown, setShown] = useState(PAGE)
  // The category comes from the collection's slug (slide-kculture-..., slide-kpop-...); a slug
  // without one shows the page without the Index panel.
  const category = CATEGORIES.find((c) => slug.includes(`-${c.slug.replace('-', '')}-`))?.slug
  const explore = useSWR<ExploreData>(category ? `/api/explore/${category}` : null, jsonFetch)
  const rows = explore.data?.sections.filter((x) => x.items.length).map((x) => x.id) ?? []
  const items = data?.items ?? []
  const body = (
    <div className="flex flex-col gap-[var(--space-6)]">
      <h1 className="type-display-h1">{data?.title}</h1>
      {data?.siblings && data.siblings.length > 1 ? (
        <div role="group" aria-label={t('CD0162')} className="flex flex-wrap gap-[var(--space-2)]">
          {data.siblings.map((c) => <Chip key={c.slug} selected={c.slug === slug} onClick={() => router.push(`/explore/collections/${c.slug}`)}>{c.title}</Chip>)}
        </div>
      ) : null}
      {data && items.length ? <p aria-live="polite" className="type-body-caption text-ui-fg-muted">{t('CD1302', { count: data.totalCount })}</p> : null}
      {isLoading ? <div aria-busy className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div> : null}
      {error ? <EmptyState type="error" container="bordered" title={t('CD1571')} action={<Button size="md" variant="secondary" onClick={() => mutate()}>{t('CD0125')}</Button>}>{t('CD1572')}</EmptyState> : null}
      {data?.children?.length ? (
        <ul className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-4">
          {data.children.map((c) => <li key={c.slug}><Card type="collection-photo" href={`/explore/collections/${c.slug}`} title={c.title} imageSrc={c.primary_image_url} meta="" /></li>)}
        </ul>
      ) : null}
      {items.length ? (
        <ol className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-4">
          {items.slice(0, shown).map((p) => (
            <li key={p.poi_id}><Card type="place" href={`/map?poi=${p.poi_id}`} {...act(p.poi_id, poiName(p, locale))} title={poiName(p, locale)} imageSrc={p.primary_image_url} meta={p.display_region} /></li>
          ))}
        </ol>
      ) : null}
      {items.length > shown ? <Button variant="secondary" className="self-center" onClick={() => setShown((n) => n + PAGE)}>{k('explore.viewAll')}</Button> : null}
    </div>
  )
  if (!category) return <V2Page bar={{ type: 'page', title: data?.title ?? '' }}>{body}</V2Page>
  return <ExploreFrame category={category} sections={rows} active="collections">{body}</ExploreFrame>
}

// ── Category special pages (SCR-015) ────────────────────────────────────────

type SpecialItem = { poi_id: string; name_ko: string; name_en: string; primary_image_url: string | null; display_region: string; relationship_en?: string; relationship_ko?: string }

export function SpecialScreen({ api, category }: { api: string; category: string }) {
  const act = usePlaceActions({ resume: true })
  const t = useCd()
  const locale = useLocale()
  const { data, error, isLoading } = useSWR<Record<string, unknown> & { items: SpecialItem[] }>(api, jsonFetch)
  // The Index panel lists the category's rows and selects the row this special page belongs to.
  const explore = useSWR<ExploreData>(`/api/explore/${category}`, jsonFetch)
  const pathname = usePathname() ?? ''
  const rows = explore.data?.sections.filter((x) => x.items.length).map((x) => x.id) ?? []
  const activeRow = Object.entries(SPECIAL_HREF[category] ?? {}).find(([, href]) => pathname.endsWith(href))?.[0]
  const title =
    (data && ((locale === 'ko' ? data.workNameKo ?? data.teamNameKo ?? data.regionNameKo : data.workNameEn ?? data.teamNameEn ?? data.regionNameEn) ?? data.titleEn ?? data.title)) as string | undefined
  return (
    <ExploreFrame category={category} sections={rows} active={activeRow}>
      <div className="flex flex-col gap-[var(--space-6)]">
        <section className="flex flex-col gap-[var(--space-4)] md:flex-row">
          <div className="flex flex-1 flex-col gap-[var(--space-3)]">
            <span className="type-eyebrow-badge text-ui-fg-muted">{t(CATEGORIES.find((c) => c.slug === category)?.label ?? 'CD0804')}</span>
            <h1 className="type-display-h1">{title}</h1>
            <p className="max-w-[60ch] type-body-long text-ui-fg-muted">{t('CD1575')}</p>
            <div className="flex flex-wrap gap-[var(--gap-sm)]">
              <IntlLink href={`/map?collection=${encodeURIComponent(api)}`} className="inline-flex h-[var(--control-height-md)] items-center gap-[var(--gap-sm)] bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse"><MapIcon aria-hidden className="size-[var(--icon-size-sm)]" />{t('CD1573')}</IntlLink>
            </div>
          </div>
        </section>
        {data ? <p className="type-body-caption text-ui-fg-muted">{t('CD1302', { count: data.items.length })}</p> : null}
        {isLoading ? <div aria-busy className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div> : null}
        {error ? <EmptyState type="error" container="bordered" title={t('CD1571')}>{t('CD1572')}</EmptyState> : null}
        <ul className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-4">
          {data?.items.map((p) => (
            <li key={p.poi_id}>
              <Card type="place" href={`/map?poi=${p.poi_id}`} {...act(p.poi_id, poiName(p, locale))} title={poiName(p, locale)} imageSrc={p.primary_image_url} meta={(locale === 'ko' ? p.relationship_ko : p.relationship_en) ?? p.display_region} />
            </li>
          ))}
        </ul>
      </div>
    </ExploreFrame>
  )
}
