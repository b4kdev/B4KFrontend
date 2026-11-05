'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { track } from '@/lib/analytics'
import useSWR from 'swr'
import { Map } from 'lucide-react'
import { Link as IntlLink, useRouter } from '@/i18n/navigation'
import {
  Accordion,
  AccordionItem,
  BottomSheet,
  Button,
  Card,
  Chip,
  CookieBanner,
  EmptyState,
  LeftPanel,
  ListItem,
  Logo,
  LegalDocument,
  SearchFilters,
  SearchInput,
  RowSection,
  ExploreCollections,
  SectionHeader,
  Skeleton,
  TopAppBar,
  buttonVariants,
  type FilterGroup,
  placeTypeOf,
} from '@/components/library'
import { usePhone } from '@/components/library/hooks'
import { getConsent, setConsent } from '@/lib/consent'
import { termsContactEmail, termsLastUpdated, termsSections } from '@/content/legal/terms-content'
import { privacyPolicyContactEmail, privacyPolicyLastUpdated, privacyPolicySections } from '@/content/legal/privacy-policy-content'
import { cookiePolicyContactEmail, cookiePolicyLastUpdated, cookiePolicySections } from '@/content/legal/cookie-policy-content'
import type { SearchCollection, SearchExplore, SearchPlan, SearchPoi } from '@/app/api/search/route'
import { useCd, useCdKey } from '../cd'
import { useGap } from '../gaps'
import { cn } from '@/lib/cn'
import { COMPANY, companyValues, fillCompanyText } from '@/lib/company'
import { HIT_AREA } from '@/components/library/styles'
import { HELP_TOP, HELP_TOPICS, helpTopic, type HelpQuestion } from '../help'
import { keepKNamesDeep } from '../text'
import { V2Footer, V2Page } from '../V2Page'
import { useSearchBox } from '../V2Search'
import { usePlaceActions, usePlanActions } from '../usePlaceActions'
import { useV2Shell } from '../V2Shell'
import { districtName, regionName } from '../map/areaName'
import type { PlaceArea } from '@/app/api/places/areas/route'

const jsonFetch = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))

// ── Search ───────────────────────────────────

type SearchResult = { places: SearchPoi[]; plans: SearchPlan[]; explore: SearchExplore[]; collections?: SearchCollection[] }
// Collection types → their Copy Deck chip labels, as on Explore.
const COLLECTION_TYPE: Record<string, string> = { ROUTE: 'CD1336', FAN_THEME: 'CD1337', STORY: 'CD1338' }


export function SearchScreen() {
  const t = useCd()
  const locale = useLocale()
  const router = useRouter()
  const phone = usePhone()
  const { labels } = useV2Shell()
  const act = usePlaceActions({ resume: true })
  const planAct = usePlanActions({ resume: true })
  const params = useSearchParams()
  const q = params?.get('q') ?? ''
  // Phones: the screen's own field; desktop searches from the Header field.
  const box = useSearchBox({ viewport: 'mobile', initial: q, open: !q })
  // See all on a section opens the search with that section shown (?show=plans).
  const showParam = params?.get('show') ?? 'all'
  const [filters, setFilters] = useState<Record<string, string[]>>({ show: [showParam] })
  useEffect(() => setFilters((f) => ({ ...f, show: [showParam] })), [showParam])
  const [sort, setSort] = useState('relevance')
  const [sheet, setSheet] = useState(false)

  const show = filters.show?.[0] ?? 'all'
  // No results names the picked area: the district if one is picked, else the region.
  const noResultsArea = filters.district?.[0] ? districtName(filters.district[0], locale) : filters.region?.[0] ? regionName(filters.region[0], locale) : null
  const qs = new URLSearchParams({ q, sort })
  if (show !== 'all') qs.set('type', show)
  if (filters.region?.[0]) qs.set('area_lv1', filters.region[0])
  if (filters.district?.[0]) qs.set('area_lv2', filters.district[0])
  if (filters.theme?.length) qs.set('tags', filters.theme.join(','))
  const { data, error, isLoading, mutate } = useSWR<SearchResult>(q.length >= 2 ? `/api/search?${qs}` : null, jsonFetch)
  // Region and district options: the areas that have places, most places first, named per language.
  const areas = useSWR<PlaceArea[]>('/api/places/areas', jsonFetch, { revalidateOnFocus: false })
  // One search event per query and filter set once its results are in: the count, never the text.
  const counted = useRef('')
  useEffect(() => {
    if (!data || counted.current === qs.toString()) return
    counted.current = qs.toString()
    track('search', { result_count: data.places.length + data.plans.length + data.explore.length, category: filters.theme?.join(',') || undefined, locale, screen_id: 'search' })
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const groups: FilterGroup[] = [
    { id: 'show', label: t('CD1271'), options: [['all', 'CD1267'], ['places', 'CD1269'], ['plans', 'CD1270'], ['explore', 'CD1268']].map(([id, cd]) => ({ id, label: t(cd) })) },
    { id: 'region', label: t('CD1254'), options: (areas.data ?? []).map((a) => ({ id: a.region, label: regionName(a.region, locale) })) },
    // Districts of the picked region only, as drawn; the group shows once a region is picked.
    ...(filters.region?.[0] ? [{ id: 'district', label: t('CD1255'), options: (areas.data?.find((a) => a.region === filters.region[0])?.districts ?? []).map((d) => ({ id: d.name, label: districtName(d.name, locale) })) }] : []),
    { id: 'theme', label: t('CD1283'), multi: true, options: [['kpop', 'CD1279'], ['kdrama', 'CD1278'], ['kbeauty', 'CD1277'], ['food', 'CD1275'], ['nature', 'CD1280'], ['shopping', 'CD1282'], ['history', 'CD1276'], ['nightlife', 'CD1281']].map(([id, cd]) => ({ id, label: t(cd) })) },
  ]
  // A picked district leaves when its region is no longer picked.
  const pickFilters = (v: Record<string, string[]>) => {
    const region = v.region?.[0]
    const districts = areas.data?.find((a) => a.region === region)?.districts ?? []
    setFilters({ ...v, district: (v.district ?? []).filter((d) => districts.some((x) => x.name === d)) })
  }
  const sortCfg = { label: t('CD1272'), options: [{ id: 'relevance', label: t('CD1274') }, { id: 'popularity', label: t('CD1565') }], value: sort, onValueChange: setSort }
  // Filters set beyond the defaults (Show All), for the phone All filters chip.
  const active = Object.entries(filters).reduce((n, [g, v]) => n + (g === 'show' ? (v[0] && v[0] !== 'all' ? 1 : 0) : v.length), 0)
  // The filters title carries the count once a filter is set: "Filters (3)".
  const filtersTitle = active ? t('CD1513', { count: active }) : t('CD1284')
  const field = (
    <SearchInput
      label={labels.search}
      placeholder={labels.search}
      value={box.draft}
      autoFocus={!q}
      onFocus={() => box.setOpen(true)}
      onChange={(e) => box.setDraft(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && box.go(box.draft)}
      onClear={() => box.setDraft('')}
      clearLabel={t('CD1248')}
      size="md"
    />
  )
  const placeName = (p: SearchPoi) => (locale === 'ko' ? p.name_ko : p.name_en || p.name_ko)
  const [colType, setColType] = useState('all')
  const colTypes = Array.from(new Set((data?.collections ?? []).map((c) => c.primaryType).filter((c): c is string => !!c && c in COLLECTION_TYPE)))
  const morePlaces = show !== 'places' && (data?.places.length ?? 0) > (phone ? 4 : 3)
  const collections = data?.collections ?? []
  const noResults = !!data && !data.places.length && !data.plans.length && !collections.length
  const exploreChips = (data?.explore ?? []).map((e) => (
    <IntlLink key={e.href} href={`${e.href}`} className="inline-flex h-[var(--control-height-sm)] items-center rounded-chip bg-control-fill shadow-rest px-[var(--chip-padding-x)] type-body-chip text-ui-fg hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none">
      {t(({ kpop: 'CD1247', kdrama: 'CD1246', kbeauty: 'CD1244', kculture: 'CD1245' } as Record<string, string>)[e.label_key] ?? 'CD1306')}
    </IntlLink>
  ))

  // Figma No results fills the results area to the bottom with its block centred in it, so the
  // results column grows and the empty state takes the rest of it.
  const results = (
    <div className={cn('flex flex-col gap-[var(--space-10)]', noResults && 'flex-1')}>
      {/* Screen readers hear the counts of every section once the results arrive. */}
      {q ? <p aria-live="polite" className="sr-only">{data ? t('CD1303', { query: q, places: data.places.length, plans: data.plans.length, explore: data.explore.length }) : isLoading ? t('CD1285') : ''}</p> : null}
      {error ? <EmptyState type="error" title={t('CD1249')} action={<Button size="md" variant="secondary" onClick={() => mutate()}>{t('CD1304')}</Button>} /> : null}
      {isLoading ? (
        <div aria-busy className="grid grid-cols-2 gap-x-[var(--space-3)] gap-y-[var(--space-4)] lg:grid-cols-3 lg:gap-x-[var(--space-4)]">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div>
      ) : null}
      {/* Explore matches are the fixed category links, so no places and no plans is No results;
          the categories become its suggestions (Figma No results: chips, then Clear filters). */}
      {/* Figma No results: on desktop the "0 places" count 16 under the title; the block ends 12 (phone) or 32
          (desktop) above the end of the page area. */}
      {noResults ? (
        <div className="flex flex-1 flex-col gap-[var(--space-4)] max-lg:mb-[var(--space-3)] lg:-mt-[var(--space-2)] lg:mb-[var(--space-8)]">
        {!phone ? <p className="type-body-caption text-ui-fg-muted">{t('CD0160', { count: 0 })}</p> : null}
        <EmptyState
          type="no-results"
          className="flex-1"
          titleAs="h2"
          title={noResultsArea ? t('CD1863', { query: q, area: noResultsArea }) : t('CD1291', { query: q })}
          action={
            <div className="flex flex-col items-center gap-[var(--space-6)]">
              <div className="flex flex-wrap justify-center gap-[var(--space-2)]">{exploreChips}</div>
              <Button variant="secondary" onClick={() => setFilters({ show: ['all'] })}>{t('CD1433')}</Button>
            </div>
          }
        >
          {t('CD1864')}
        </EmptyState>
        </div>
      ) : null}
      {data?.places.length ? (
        <section aria-label={t('CD1307')} className="flex flex-col gap-[var(--space-4)]">
          {/* Figma: the places count, and on phones the sort, above the grid; no section title. */}
          <div className="flex items-center justify-between gap-[var(--space-3)]">
            <p className="type-body-caption text-ui-fg-muted">{t('CD0160', { count: data.places.length })}</p>
            {phone ? (
              <label className="relative">
                <Chip type="dropdown" aria-hidden tabIndex={-1} className="pointer-events-none">{sortCfg.options.find((o) => o.id === sort)?.label}</Chip>
                <select aria-label={t('CD1272')} value={sort} onChange={(e) => setSort(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
                  {sortCfg.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
            ) : null}
          </div>
          {/* Card meta: the area in the visitor's language (the data names regions in Korean, as the area
              filter does). The drawn place type after it waits for its text; the K-category slug is not shown. */}
          <ul className="grid grid-cols-2 gap-x-[var(--space-3)] gap-y-[var(--space-4)] lg:grid-cols-3 lg:gap-x-[var(--space-4)]">
            {(show === 'places' ? data.places : data.places.slice(0, phone ? 4 : 3)).map((p) => (
              <li key={p.poi_id}>
                <Card type="place" href={`/map?poi=${p.poi_id}`} {...act(p.poi_id, placeName(p))} title={placeName(p)} imageSrc={p.primary_image_url} placeType={placeTypeOf(p.interest_category)} meta={p.display_region ? regionName(p.display_region, locale) : ''} />
              </li>
            ))}
          </ul>
          {morePlaces ? <Button variant="secondary" className="lg:self-center max-lg:self-start" onClick={() => setFilters({ ...filters, show: ['places'] })}>{t('CD1311', { count: data.places.length })}</Button> : null}
        </section>
      ) : null}
      {data?.plans.length ? (
        show === 'plans' ? (
          <section className="flex flex-col gap-[var(--space-4)]">
            <SectionHeader title={t('CD1903', { label: t('CD1308'), count: data.plans.length })} />
            <ul className="grid grid-cols-2 gap-x-[var(--space-3)] gap-y-[var(--space-4)] lg:grid-cols-3 lg:gap-x-[var(--space-4)]">
              {data.plans.map((p) => (
                <li key={p.id}>
                  <Card type="plan" href={`/plan/${p.id}`} title={p.title} save={planAct(String(p.id), p.title)} imageSrc={p.cover_image_url} author={p.author_name} saves={String(p.save_count)} stops={t('CD1315', { count: p.stop_count })} sponsored={p.is_partner ? t('CD1314') : undefined} />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <RowSection
            title={t('CD1903', { label: t('CD1308'), count: data.plans.length })}
            arrowLabels={{ previous: t('CD0390'), next: t('CD0389') }}
            seeAll={{ href: `/search?q=${encodeURIComponent(q)}&show=plans`, label: t('CD1309') }}
            cards={data.plans.map((p) => (
              <Card key={p.id} type="plan" href={`/plan/${p.id}`} title={p.title} save={planAct(String(p.id), p.title)} imageSrc={p.cover_image_url} author={p.author_name} saves={String(p.save_count)} stops={t('CD1315', { count: p.stop_count })} sponsored={p.is_partner ? t('CD1314') : undefined} />
            ))}
          />
        )
      ) : null}
      {/* Explore: the matching collections with their type chips, as drawn; the category chips when none match. */}
      {collections.length && !noResults ? (
        <ExploreCollections
          title={t('CD1903', { label: t('CD1306'), count: collections.length })}
          filters={[{ id: 'all', label: t('CD1903', { label: t('CD1267'), count: collections.length }) }, ...colTypes.map((c) => ({ id: c, label: t(COLLECTION_TYPE[c]) }))]}
          active={colType}
          onFilter={setColType}
          cards={collections
            .filter((c) => colType === 'all' || c.primaryType === colType)
            .map((c) => {
              const meta = c.primaryType && COLLECTION_TYPE[c.primaryType] ? t(COLLECTION_TYPE[c.primaryType]) : ''
              return c.cover_images.length
                ? <Card key={c.slug} type="collection" href={`/explore/collections/${c.slug}`} title={c.title} images={c.cover_images} meta={meta} />
                : <Card key={c.slug} type="collection-photo" href={`/explore/collections/${c.slug}`} title={c.title} imageSrc={c.primary_image_url} meta={meta} />
            })}
        />
      ) : data?.explore.length && !noResults ? (
        <section className="flex flex-col gap-[var(--space-4)]">
          <SectionHeader title={t('CD1903', { label: t('CD1306'), count: data.explore.length })} />
          <div className="flex flex-wrap gap-[var(--space-2)]">{exploreChips}</div>
        </section>
      ) : null}
    </div>
  )

  if (phone) {
    // Figma chips row: All filters (with the count of filters set) and one dropdown chip per group, all opening the filters sheet.
    const groupLabel = (g: FilterGroup) => {
      const v = filters[g.id] ?? []
      const sel = g.options.filter((o) => v.includes(o.id) && o.id !== 'all')
      return sel.length ? sel.map((o) => o.label).join(', ') : g.label
    }
    return (
      <>
        <TopAppBar type="search" labels={labels} onBack={() => router.back()} search={field} className="sticky top-0 z-30" />
        {/* Figma: results start 12 under the bar; the suggestions card 16 under it. */}
        <main id="main" className={cn('flex flex-1 flex-col px-[var(--grid-gutter-mobile)] py-[var(--space-3)]', box.open && 'pt-[var(--space-4)]')}>
          <h1 className="sr-only">{q ? t('CD1861', { query: q }) : t('CD1293')}</h1>
          {box.open ? box.suggestions : (
            <>
              <div className="-mx-[var(--grid-gutter-mobile)] mb-[var(--space-4)] flex gap-[var(--space-2)] overflow-x-auto px-[var(--grid-gutter-mobile)] [scrollbar-width:none]">
                <Chip type="dropdown" selected onClick={() => setSheet(true)}>{active ? t('CD1815', { count: active }) : t('CD1814')}</Chip>
                {groups.map((g) => <Chip key={g.id} type="dropdown" onClick={() => setSheet(true)}>{groupLabel(g)}</Chip>)}
              </div>
              {results}
            </>
          )}
        </main>
        {/* Figma: Search filters is the whole sheet (bg elevated, its own padding) with a Close in its header. */}
        <BottomSheet open={sheet} onClose={() => setSheet(false)} label={t('CD1284')} flush className="bg-ui-bg-elevated">
          <SearchFilters viewport="mobile" groups={groups} value={filters} onValueChange={pickFilters} sort={sortCfg} labels={{ title: filtersTitle, clearAll: t('CD1248'), showResults: data ? t('CD1514', { count: data.places.length + data.plans.length + data.explore.length }) : t('CD1251'), close: t('CD0082') }} onShowResults={() => setSheet(false)} onClose={() => setSheet(false)} />
        </BottomSheet>
      </>
    )
  }
  return (
    <div className="flex min-h-0 flex-1">
      {/* Figma: the filters sit 16 inside the panel. */}
      <LeftPanel type="filters" label={t('CD1284')} className="p-[var(--space-4)]">
        <SearchFilters viewport="desktop" groups={groups} value={filters} onValueChange={pickFilters} sort={sortCfg} labels={{ title: filtersTitle, clearAll: t('CD1248') }} />
      </LeftPanel>
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <main id="main" tabIndex={-1} className="flex flex-1 flex-col gap-[var(--space-6)] px-[var(--space-8)] py-[var(--space-6)] outline-none">
          {/* Figma: the results title names the search, with a muted line under it (4 apart). */}
          {q ? (
            <div className="flex flex-col gap-[var(--space-1)]">
              <h1 className="type-display-h3">{t('CD1861', { query: q })}</h1>
              <p className="type-body-base text-ui-fg-muted">{t('CD1862')}</p>
            </div>
          ) : (
            <h1 className="sr-only">{t('CD1293')}</h1>
          )}
          {results}
          {q && !noResults ? <IntlLink href="/map" className="inline-flex items-center gap-[var(--space-2)] self-start type-label-button text-ui-link hover:text-ui-link-hover"><Map aria-hidden className="size-[var(--icon-size-sm)]" />{t('CD1287')}</IntlLink> : null}
        </main>
        <V2Footer />
      </div>
    </div>
  )
}

// ── Help ──────────────────────────────────────────────────────────

const linkRow = ({ href, className, children }: { href: string; className: string; children: ReactNode }) => <IntlLink href={href} className={className}>{children}</IntlLink>

/** Help center: search over the questions, Top questions, topics, and the contact block; a topic
 * (?topic=) shows its questions as an accordion, the one linked (&q=) or the first one open. */
export function HelpScreen() {
  const t = useCd()
  const params = useSearchParams()
  const topic = helpTopic(params.get('topic'))
  const [query, setQuery] = useState('')
  const q = query.trim().toLocaleLowerCase()
  const found = q ? HELP_TOPICS.flatMap((x) => x.questions).filter((x) => `${t(x.q)} ${t(x.a)}`.toLocaleLowerCase().includes(q)) : []
  const title = topic ? t(topic.title) : t('CD0806')
  const qa = (list: HelpQuestion[], open?: string) => (
    <Accordion>
      {list.map((x) => (
        <AccordionItem key={x.id} title={t(x.q)} defaultExpanded={x.id === open} headingLevel={2}>{t(x.a)}</AccordionItem>
      ))}
    </Accordion>
  )
  return (
    <V2Page bar={{ type: 'page', title }}>
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[var(--space-4)] lg:gap-[var(--space-6)] lg:py-[var(--space-4)]">
        <h1 className="type-display-h2 max-lg:hidden">{title}</h1>
        {topic ? (
          <>
            <p className="type-eyebrow-category text-ui-fg-muted">{t('CD1703', { n: topic.questions.length })}</p>
            {qa(topic.questions, params.get('q') ?? topic.questions[0].id)}
          </>
        ) : (
          <>
            <SearchInput label={t('CD1696')} placeholder={t('CD1696')} value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} clearLabel={t('CD1248')} />
            {q ? (
              found.length ? qa(found) : <p className="type-body-base text-ui-fg-muted">{t('CD1322', { query: query.trim() })}</p>
            ) : (
              <>
                <section aria-labelledby="help-top" className="flex flex-col gap-[var(--space-4)] lg:gap-[var(--space-6)]">
                  <h2 id="help-top" className="type-eyebrow-category text-ui-fg-muted">{t('CD1697')}</h2>
                  <ul>
                    {HELP_TOP.map((x) => <ListItem key={x.id} title={t(x.q)} chevron href={`/help?topic=${x.topic}&q=${x.id}`} renderLink={linkRow} />)}
                  </ul>
                </section>
                <section aria-labelledby="help-topics" className="flex flex-col gap-[var(--space-4)] lg:gap-[var(--space-6)]">
                  <h2 id="help-topics" className="type-eyebrow-category text-ui-fg-muted">{t('CD1698')}</h2>
                  <ul>
                    {HELP_TOPICS.map((x) => <ListItem key={x.slug} title={t(x.title)} secondary={t('CD1703', { n: x.questions.length })} chevron href={`/help?topic=${x.slug}`} renderLink={linkRow} />)}
                  </ul>
                </section>
              </>
            )}
          </>
        )}
        <section aria-labelledby="help-contact" className="flex flex-col gap-[var(--space-3)]">
          <h2 id="help-contact" className="type-title-card">{t('CD1704')}</h2>
          <p className="type-body-base text-ui-fg-muted">{t('CD1705')}</p>
          {/* Send feedback waits for its endpoint; until then the page offers email only. */}
          <div className="flex flex-wrap gap-[var(--space-2)]">
            <a href={`mailto:${t('CD0344')}`} className={buttonVariants({ variant: 'ghost', size: 'lg' })}>{t('CD1707')}</a>
          </div>
        </section>
      </div>
    </V2Page>
  )
}

// ── Legal pages and cookie preferences ──────────────────

export function LegalScreen({ doc }: { doc: 'terms' | 'privacy' | 'cookies' }) {
  const GAP = useGap()
  const t = useCd()
  const k = useCdKey()
  const phone = usePhone()
  const [consent, setConsentState] = useState<'accepted' | 'declined' | null>(null)
  useEffect(() => setConsentState(getConsent()), [])
  // The section being read: the last heading above the upper third of the window.
  const [current, setCurrent] = useState<string | undefined>()
  const cfg = useMemo(
    () =>
      ({
        terms: { title: k('routes.legalTerms.title'), updated: termsLastUpdated, email: termsContactEmail, sections: keepKNamesDeep(termsSections) },
        privacy: { title: k('routes.legalPrivacy.title'), updated: privacyPolicyLastUpdated, email: privacyPolicyContactEmail, sections: keepKNamesDeep(privacyPolicySections) },
        cookies: { title: k('routes.legalCookies.title'), updated: cookiePolicyLastUpdated, email: cookiePolicyContactEmail, sections: keepKNamesDeep(cookiePolicySections) },
      })[doc],
    [doc, k],
  )
  // Read on every scroll of the page's scroller (the window on phones, the shell column on desktop),
  // looking the headings up each time: the document column moves in the tree when the layout
  // settles on phone or desktop, so headings found once would go stale. At the end of the page the
  // last section is current, since a short final section never reaches the upper third.
  useEffect(() => {
    const ids = cfg.sections.map((s) => s.id)
    let frame = 0
    // The element that scrolls the document: the nearest scrolling ancestor of the first heading.
    const scroller = () => {
      for (let el = document.getElementById(ids[0])?.parentElement; el; el = el.parentElement) {
        const y = getComputedStyle(el).overflowY
        if ((y === 'auto' || y === 'scroll') && el.scrollHeight > el.clientHeight) return el
      }
      return document.scrollingElement
    }
    const update = () => {
      const top = window.innerHeight / 3
      const passed = ids.filter((id) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= top)
      const el = scroller()
      const atEnd = !!el && el.scrollHeight > el.clientHeight && el.scrollTop + el.clientHeight >= el.scrollHeight - 2
      setCurrent(atEnd ? ids[ids.length - 1] : (passed[passed.length - 1] ?? ids[0]))
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', onScroll, { capture: true })
    }
  }, [cfg.sections, phone])
  return (
    // The page container as every content page; the document is a centered reading column inside it,
    // 72 from the top; on phones the document adds 32 above and below the page's 24.
    <V2Page bar={{ type: 'page', title: cfg.title, h1: 'page' }} className="max-lg:py-[calc(var(--space-6)+var(--space-8))] lg:pt-[calc(var(--space-10)+var(--space-8))]">
      <div className="flex flex-col gap-[var(--space-8)]">
        <LegalDocument
          viewport={phone ? 'mobile' : 'desktop'}
          breadcrumbs={[{ label: t('CD0807'), href: '/' }, { label: cfg.title }]}
          title={cfg.title}
          updated={GAP.lastUpdated(cfg.updated)}
          contact={{ label: t('CD0345'), link: <a href={`mailto:${cfg.email}`} className={cn('relative type-body-link text-ui-link underline underline-offset-2 hover:text-ui-link-hover', HIT_AREA)}>{cfg.email}</a> }}
          sections={cfg.sections.map((s) => ({ id: s.id, title: s.heading.replace(/^\d+\.\s*/, ''), body: s.body }))}
          currentSection={current}
          intro={doc === 'cookies' ? (
            <CookieBanner
              type="preferences"
              title={t('CD0137')}
              label={t('CD0137')}
              status={consent === 'accepted' ? t('CD0135') : consent === 'declined' ? t('CD0136') : undefined}
              message={t('CD0134')}
              learnMore={{ href: '/legal/cookies', label: '' }}
              acceptLabel={t('CD0132')}
              declineLabel={t('CD0133')}
              onAccept={() => { setConsent('accepted'); setConsentState('accepted') }}
              onDecline={() => { setConsent('declined'); setConsentState('declined') }}
            />
          ) : undefined}
          labels={{ breadcrumb: GAP.breadcrumb, contents: t('CD1519'), onThisPage: t('CD1520') }}
        />
      </div>
    </V2Page>
  )
}

// ── Not found and error ───────────────────────────────────────────

export function NotFoundScreen() {
  const t = useCd()
  // Figma: the Empty state (full width on phones, 400 on desktop), then the actions below it
  // (not inside it): 16 on phones, 24 on desktop.
  return (
    <V2Page bar={{ type: 'home' }} className="flex flex-col items-center justify-center gap-[var(--space-4)] lg:gap-[var(--space-6)]">
      {/* A not-found page has no metadata hook in this Next version; React places the title in the head. */}
      <title>{t('CD1832', { page: t('CD0116') })}</title>
      <EmptyState type="no-results" titleAs="h1" title={t('CD0116')} className="w-full lg:w-[400px]">{t('CD0115')}</EmptyState>
      <div className="flex flex-wrap justify-center gap-[var(--gap-sm)]">
        <IntlLink href="/" className="inline-flex h-[var(--control-height-lg)] items-center rounded-control bg-button-primary-bg shadow-accent px-[var(--space-5)] type-label-button text-button-primary-fg focus-visible:shadow-focus-ring focus-visible:outline-none">{t('CD0114')}</IntlLink>
        <IntlLink href="/map" className="inline-flex h-[var(--control-height-lg)] items-center rounded-control bg-control-fill px-[var(--space-5)] shadow-rest type-label-button text-ui-fg hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none">{t('CD0481')}</IntlLink>
      </div>
    </V2Page>
  )
}

export function ErrorScreen({ reset }: { reset: () => void }) {
  const t = useCd()
  // Same layout as the not found page.
  return (
    <V2Page bar={{ type: 'home' }} className="flex flex-col items-center justify-center gap-[var(--space-4)] lg:gap-[var(--space-6)]">
      <EmptyState type="error" titleAs="h1" title={t('CD0113')} className="w-full lg:w-[400px]">{t('CD0111')}</EmptyState>
      <div className="flex flex-wrap justify-center gap-[var(--gap-sm)]">
        <Button onClick={reset}>{t('CD0110')}</Button>
        <IntlLink href="/" className="inline-flex h-[var(--control-height-lg)] items-center rounded-control bg-control-fill px-[var(--space-5)] shadow-rest type-label-button text-ui-fg hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none">{t('CD0112')}</IntlLink>
      </div>
    </V2Page>
  )
}

// ── About B4K (footer link) ─────────────────────────────────────────────────

/** About B4K: the wordmark across the page container, then the title and the about text,
 * left-aligned (desktop: a 760 column under the wordmark). Spacing as drawn: 32 above the wordmark on
 * phones, 64 on desktop; the text 48 under it and 40 above the footer. */
export function AboutScreen() {
  const t = useCd()
  const locale = useLocale()
  return (
    <V2Page bar={{ type: 'page', title: t('CD1173'), h1: 'page' }}>
      <div className="flex flex-col gap-[var(--space-4)] pt-[var(--space-2)] lg:gap-0 lg:pt-[var(--space-10)]">
        <Logo type="wordmark" className="h-auto w-full" />
        <div aria-hidden className="h-[var(--space-4)] lg:hidden" />
        <div className="flex flex-col gap-[var(--space-4)] lg:max-w-[760px] lg:gap-[var(--space-6)] lg:pb-[var(--space-4)] lg:pt-[var(--space-12)]">
          <h1 className="type-display-h1">{t('CD1173')}</h1>
          <p className="rounded-sq-md bg-tile-surface px-[var(--space-5)] py-[var(--space-4)] type-body-long leading-[1.7] text-ui-fg shadow-rest">{t('CD1687')}</p>
          {/* Company details as drawn under the about text: title, one line per detail, Check business info. */}
          <h2 className="type-display-h4">{t('CD1688')}</h2>
          <p className="whitespace-pre-line rounded-sq-md bg-tile-surface px-[var(--space-5)] py-[var(--space-4)] type-body-base tabular-nums text-ui-fg-muted shadow-rest">{fillCompanyText(t.raw('CD1689') as string, companyValues(locale))}</p>
          <a href={COMPANY.checkUrl} target="_blank" rel="noopener noreferrer" className={cn('b4k-link relative self-start type-body-link', HIT_AREA)}>{t('CD1685')}</a>
        </div>
      </div>
    </V2Page>
  )
}

