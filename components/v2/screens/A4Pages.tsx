'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import useSWR from 'swr'
import { Copy, Map, WifiOff } from 'lucide-react'
import { Link as IntlLink, useRouter } from '@/i18n/navigation'
import {
  Accordion,
  AccordionItem,
  BottomSheet,
  Breadcrumbs,
  Button,
  Card,
  Chip,
  CookieBanner,
  EmptyState,
  LeftPanel,
  LegalDocument,
  SearchFilters,
  SearchInput,
  RowSection,
  SectionHeader,
  Skeleton,
  TopAppBar,
  type FilterGroup,
} from '@/components/library'
import { usePhone } from '@/components/library/hooks'
import { getConsent, setConsent } from '@/lib/consent'
import { termsContactEmail, termsLastUpdated, termsSections } from '@/content/legal/terms-content'
import { privacyPolicyContactEmail, privacyPolicyLastUpdated, privacyPolicySections } from '@/content/legal/privacy-policy-content'
import { cookiePolicyContactEmail, cookiePolicyLastUpdated, cookiePolicySections } from '@/content/legal/cookie-policy-content'
import type { SearchExplore, SearchPlan, SearchPoi } from '@/app/api/search/route'
import { useCd, useCdKey } from '../cd'
import { useGap } from '../gaps'
import { keepKNamesDeep } from '../text'
import { V2Footer, V2Page } from '../V2Page'
import { useSearchBox } from '../V2Search'
import { usePlaceActions } from '../usePlaceActions'
import { useV2Shell } from '../V2Shell'

const jsonFetch = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))

// ── Search (SCR-027, PD-42, PD-43, PD-38) ───────────────────────────────────

type SearchResult = { places: SearchPoi[]; plans: SearchPlan[]; explore: SearchExplore[] }

export function SearchScreen() {
  const t = useCd()
  const locale = useLocale()
  const router = useRouter()
  const phone = usePhone()
  const { labels } = useV2Shell()
  const act = usePlaceActions({ resume: true })
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
  const qs = new URLSearchParams({ q, sort })
  if (show !== 'all') qs.set('type', show)
  if (filters.region?.[0]) qs.set('area_lv1', filters.region[0])
  if (filters.district?.[0]) qs.set('area_lv2', filters.district[0])
  if (filters.theme?.length) qs.set('tags', filters.theme.join(','))
  const { data, error, isLoading } = useSWR<SearchResult>(q.length >= 2 ? `/api/search?${qs}` : null, jsonFetch)

  const groups: FilterGroup[] = [
    { id: 'show', label: t('CD1271'), options: [['all', 'CD1267'], ['places', 'CD1269'], ['plans', 'CD1270'], ['explore', 'CD1268']].map(([id, cd]) => ({ id, label: t(cd) })) },
    { id: 'region', label: t('CD1254'), options: [['Seoul', 'CD1266'], ['Busan', 'CD1264'], ['Jeju', 'CD1265']].map(([id, cd]) => ({ id, label: t(cd) })) },
    { id: 'district', label: t('CD1255'), options: [['Gangnam', 'CD1257'], ['Hongdae', 'CD1259'], ['Myeongdong', 'CD1261'], ['Haeundae', 'CD1258'], ['Seomyeon', 'CD1263'], ['Jeju City', 'CD1260'], ['Seogwipo', 'CD1262']].map(([id, cd]) => ({ id, label: t(cd) })) },
    { id: 'theme', label: t('CD1283'), multi: true, options: [['kpop', 'CD1279'], ['kdrama', 'CD1278'], ['kbeauty', 'CD1277'], ['food', 'CD1275'], ['history', 'CD1276'], ['nature', 'CD1280'], ['shopping', 'CD1282'], ['nightlife', 'CD1281']].map(([id, cd]) => ({ id, label: t(cd) })) },
  ]
  const sortCfg = { label: t('CD1272'), options: [{ id: 'relevance', label: t('CD1274') }, { id: 'popularity', label: t('CD1273') }], value: sort, onValueChange: setSort }
  // Filters set beyond the defaults (Show All), for the phone All filters chip.
  const active = Object.entries(filters).reduce((n, [g, v]) => n + (g === 'show' ? (v[0] && v[0] !== 'all' ? 1 : 0) : v.length), 0)
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
  const morePlaces = show !== 'places' && (data?.places.length ?? 0) > (phone ? 4 : 3)

  const results = (
    <div className="flex flex-col gap-[var(--space-10)]">
      {/* Screen readers hear the counts of every section once the results arrive. */}
      {q ? <p aria-live="polite" className="sr-only">{data ? t('CD1303', { query: q, places: data.places.length, plans: data.plans.length, explore: data.explore.length }) : isLoading ? t('CD1285') : ''}</p> : null}
      {error ? <EmptyState type="error" title={t('CD1249')} action={<Button size="md" variant="secondary" onClick={() => router.refresh()}>{t('CD1304')}</Button>} /> : null}
      {isLoading ? (
        <div aria-busy className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div>
      ) : null}
      {data && !data.places.length && !data.plans.length && !data.explore.length ? (
        <EmptyState type="no-results" title={t('CD1291', { query: q })} action={<Button size="md" variant="secondary" onClick={() => setFilters({ show: ['all'] })}>{t('CD1433')}</Button>}>{t('CD1292')}</EmptyState>
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
          <ul className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-3">
            {(show === 'places' ? data.places : data.places.slice(0, phone ? 4 : 3)).map((p) => (
              <li key={p.poi_id}>
                <Card type="place" href={`/map?poi=${p.poi_id}`} {...act(p.poi_id, placeName(p))} title={placeName(p)} imageSrc={p.primary_image_url} meta={[p.display_region, p.display_domain].filter(Boolean).join(' · ')} />
              </li>
            ))}
          </ul>
          {morePlaces ? <Button variant="secondary" className="lg:self-center max-lg:self-start" onClick={() => setFilters({ ...filters, show: ['places'] })}>{t('CD1311', { count: data.places.length })}</Button> : null}
        </section>
      ) : null}
      {data?.plans.length ? (
        show === 'plans' ? (
          <section className="flex flex-col gap-[var(--space-4)]">
            <SectionHeader title={`${t('CD1308')} · ${data.plans.length}`} />
            <ul className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-3">
              {data.plans.map((p) => (
                <li key={p.id}>
                  <Card type="plan" href={`/plan/${p.id}`} title={p.title} imageSrc={p.cover_image_url} author={p.author_name} saves={String(p.save_count)} stops={t('CD1315', { count: p.stop_count })} sponsored={p.is_partner ? t('CD1314') : undefined} />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <RowSection
            title={`${t('CD1308')} · ${data.plans.length}`}
            arrowLabels={{ previous: t('CD0390'), next: t('CD0389') }}
            seeAll={{ href: `/search?q=${encodeURIComponent(q)}&show=plans`, label: t('CD1309') }}
            cards={data.plans.map((p) => (
              <Card key={p.id} type="plan" href={`/plan/${p.id}`} title={p.title} imageSrc={p.cover_image_url} author={p.author_name} saves={String(p.save_count)} stops={t('CD1315', { count: p.stop_count })} sponsored={p.is_partner ? t('CD1314') : undefined} />
            ))}
          />
        )
      ) : null}
      {data?.explore.length ? (
        <section className="flex flex-col gap-[var(--space-4)]">
          <SectionHeader title={`${t('CD1306')} · ${data.explore.length}`} />
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {data.explore.map((e) => (
              <IntlLink key={e.href} href={`${e.href}`} className="inline-flex h-[var(--control-height-sm)] items-center rounded-full border border-ui-border-strong px-[var(--chip-padding-x)] type-body-chip text-ui-fg hover:bg-ui-state-hover">
                {t(({ kpop: 'CD1247', kdrama: 'CD1246', kbeauty: 'CD1244', kculture: 'CD1245' } as Record<string, string>)[e.label_key] ?? 'CD1306')}
              </IntlLink>
            ))}
          </div>
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
        <main id="main" className="flex-1 px-[var(--grid-gutter-mobile)] py-[var(--space-3)]">
          <h1 className="sr-only">{t('CD1293')}</h1>
          {box.open ? box.suggestions : (
            <>
              <div className="-mx-[var(--grid-gutter-mobile)] mb-[var(--space-4)] flex gap-[var(--space-2)] overflow-x-auto px-[var(--grid-gutter-mobile)] [scrollbar-width:none]">
                <Chip type="dropdown" selected count={active || undefined} onClick={() => setSheet(true)}>{t('CD1284')}</Chip>
                {groups.map((g) => <Chip key={g.id} type="dropdown" onClick={() => setSheet(true)}>{groupLabel(g)}</Chip>)}
              </div>
              {results}
            </>
          )}
        </main>
        <BottomSheet open={sheet} onClose={() => setSheet(false)} label={t('CD1284')}>
          <SearchFilters viewport="mobile" groups={groups} value={filters} onValueChange={setFilters} sort={sortCfg} labels={{ title: t('CD1284'), clearAll: t('CD1248'), showResults: t('CD1251') }} onShowResults={() => setSheet(false)} />
        </BottomSheet>
      </>
    )
  }
  return (
    <div className="flex min-h-0 flex-1">
      <LeftPanel type="filters" label={t('CD1284')}>
        <SearchFilters viewport="desktop" groups={groups} value={filters} onValueChange={setFilters} sort={sortCfg} labels={{ title: t('CD1284'), clearAll: t('CD1248') }} />
      </LeftPanel>
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <main id="main" tabIndex={-1} className="flex flex-1 flex-col gap-[var(--space-6)] px-[var(--space-8)] py-[var(--space-6)] outline-none">
          <h1 className={q ? 'type-display-h3' : 'sr-only'}>{t('CD1293')}</h1>
          {results}
          {q ? <IntlLink href="/map" className="inline-flex items-center gap-[var(--space-2)] self-start type-label-button text-ui-link hover:text-ui-link-hover"><Map aria-hidden className="size-[var(--icon-size-sm)]" />{t('CD1287')}</IntlLink> : null}
        </main>
        <V2Footer />
      </div>
    </div>
  )
}

// ── Help (SCR-030) ──────────────────────────────────────────────────────────

const HELP_SECTIONS = ['getting-started', 'planning', 'saved', 'account', 'technical'] as const

export function HelpScreen() {
  const k = useCdKey()
  const [copied, setCopied] = useState(false)
  const email = k('help.sections.contact.emailAddress')
  return (
    <V2Page bar={{ type: 'page', title: k('help.title') }}>
      <div className="mx-auto flex max-w-[720px] flex-col gap-[var(--space-10)]">
        <h1 className="type-display-h1 max-lg:hidden">{k('help.title')}</h1>
        {HELP_SECTIONS.map((s) => (
          <section key={s} id={s} aria-labelledby={`h-${s}`} className="flex flex-col gap-[var(--space-3)]">
            <h2 id={`h-${s}`} className="type-display-h3">{k(`help.sections.${s}.title`)}</h2>
            <Accordion>
              {(['q1', 'q2', 'q3'] as const).map((q) => (
                <AccordionItem key={q} title={k(`help.sections.${s}.items.${q}.q`)}>{k(`help.sections.${s}.items.${q}.a`)}</AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
        <section aria-labelledby="h-contact" className="flex flex-col gap-[var(--space-3)] border border-ui-border bg-ui-bg-raised p-[var(--space-6)]">
          <h2 id="h-contact" className="type-display-h3">{k('help.sections.contact.title')}</h2>
          <p className="type-body-base text-ui-fg-muted">{k('help.sections.contact.desc')}</p>
          <div className="flex flex-wrap gap-[var(--gap-sm)]">
            <a href={`mailto:${email}`} className="inline-flex h-[var(--control-height-md)] items-center bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse focus-visible:shadow-focus-ring focus-visible:outline-none">{k('help.sections.contact.ctaEmail')}</a>
            <Button variant="secondary" size="md" leadingIcon={<Copy />} onClick={() => { navigator.clipboard?.writeText(email); setCopied(true) }}>
              {copied ? k('help.sections.contact.copyEmailCopied') : k('help.sections.contact.copyEmail')}
            </Button>
          </div>
        </section>
      </div>
    </V2Page>
  )
}

// ── Legal pages (SCR-029) and cookie preferences (SCR-026) ──────────────────

export function LegalScreen({ doc }: { doc: 'terms' | 'privacy' | 'cookies' }) {
  const GAP = useGap()
  const t = useCd()
  const k = useCdKey()
  const phone = usePhone()
  const [consent, setConsentState] = useState<'accepted' | 'declined' | null>(null)
  useEffect(() => setConsentState(getConsent()), [])
  const cfg = useMemo(
    () =>
      ({
        terms: { title: k('routes.legalTerms.title'), updated: termsLastUpdated, email: termsContactEmail, sections: keepKNamesDeep(termsSections) },
        privacy: { title: k('routes.legalPrivacy.title'), updated: privacyPolicyLastUpdated, email: privacyPolicyContactEmail, sections: keepKNamesDeep(privacyPolicySections) },
        cookies: { title: k('routes.legalCookies.title'), updated: cookiePolicyLastUpdated, email: cookiePolicyContactEmail, sections: keepKNamesDeep(cookiePolicySections) },
      })[doc],
    [doc, k],
  )
  return (
    <V2Page bar={{ type: 'page', title: cfg.title }}>
      <div className="flex flex-col gap-[var(--space-8)]">
        {doc === 'cookies' ? (
          <div className="max-w-[720px]">
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
          </div>
        ) : null}
        <LegalDocument
          viewport={phone ? 'mobile' : 'desktop'}
          breadcrumbs={[{ label: t('CD0807'), href: '/' }, { label: t('CD0809') }, { label: cfg.title }]}
          title={cfg.title}
          updated={GAP.lastUpdated(cfg.updated)}
          contact={<a href={`mailto:${cfg.email}`} className="underline underline-offset-2">{cfg.email}</a>}
          sections={cfg.sections.map((s) => ({ id: s.id, title: s.heading.replace(/^\d+\.\s*/, ''), body: s.body }))}
          labels={{ breadcrumb: GAP.breadcrumb, contents: t('CD1519'), onThisPage: t('CD1520') }}
        />
      </div>
    </V2Page>
  )
}

// ── Not found and error (SCR-031) ───────────────────────────────────────────

export function NotFoundScreen() {
  const t = useCd()
  return (
    <V2Page bar={{ type: 'home' }} className="flex items-center justify-center">
      <EmptyState
        title={<span className="type-display-h1">{t('CD0116')}</span>}
        action={
          <div className="flex flex-wrap justify-center gap-[var(--gap-sm)]">
            <IntlLink href="/" className="inline-flex h-[var(--control-height-lg)] items-center bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse focus-visible:shadow-focus-ring focus-visible:outline-none">{t('CD0114')}</IntlLink>
            <IntlLink href="/map" className="inline-flex h-[var(--control-height-lg)] items-center border border-ui-border-strong px-[var(--button-padding-x)] type-label-button text-ui-fg hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none">{t('CD1287')}</IntlLink>
          </div>
        }
      >
        {t('CD0115')}
      </EmptyState>
    </V2Page>
  )
}

export function ErrorScreen({ reset }: { reset: () => void }) {
  const t = useCd()
  return (
    <V2Page bar={{ type: 'home' }} className="flex items-center justify-center">
      <EmptyState
        type="error"
        title={t('CD0113')}
        action={
          <div className="flex flex-wrap justify-center gap-[var(--gap-sm)]">
            <Button onClick={reset}>{t('CD0110')}</Button>
            <IntlLink href="/" className="inline-flex h-[var(--control-height-lg)] items-center border border-ui-border-strong px-[var(--button-padding-x)] type-label-button text-ui-fg hover:bg-ui-state-hover">{t('CD0112')}</IntlLink>
          </div>
        }
      >
        {t('CD0111')}
      </EmptyState>
    </V2Page>
  )
}

// ── Offline page and Site map (pre-v2 addresses nothing links to, kept on the new design) ──

export function OfflineScreen() {
  const k = useCdKey()
  return (
    <V2Page bar={{ type: 'home' }} className="flex items-center justify-center">
      <EmptyState
        icon={<WifiOff />}
        title={k('boundary.offline.title')}
        action={<Button variant="secondary" onClick={() => window.location.reload()}>{k('boundary.offline.retry')}</Button>}
      >
        {k('boundary.offline.desc')}
      </EmptyState>
    </V2Page>
  )
}

export function SiteMapScreen() {
  const t = useCd()
  const k = useCdKey()
  const GAP = useGap()
  return (
    <V2Page bar={{ type: 'page', title: k('routes.sitemap.title') }}>
      <div className="flex flex-col gap-[var(--space-6)]">
        <Breadcrumbs label={GAP.breadcrumb} items={[{ label: t('CD0807'), href: '/' }, { label: k('routes.sitemap.breadcrumb') }]} />
        <h1 className="type-display-h1 text-ui-fg">{k('routes.sitemap.title')}</h1>
        <EmptyState title={k('routes.sitemap.empty.title')}>{k('routes.sitemap.empty.desc')}</EmptyState>
      </div>
    </V2Page>
  )
}
