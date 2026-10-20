'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import useSWR from 'swr'
import { Copy, Map, SlidersHorizontal, WifiOff } from 'lucide-react'
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
  SearchSuggestions,
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
import { V2Page } from '../V2Page'
import { useV2Shell } from '../V2Shell'

const jsonFetch = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
const RECENT_KEY = 'b4k-v2-recent-searches'

// ── Search (SCR-027, PD-42, PD-43, PD-38) ───────────────────────────────────

type SearchResult = { places: SearchPoi[]; plans: SearchPlan[]; explore: SearchExplore[] }

function useRecent() {
  const [recent, setRecent] = useState<string[]>([])
  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'))
    } catch {}
  }, [])
  const save = (next: string[]) => {
    setRecent(next)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {}
  }
  return {
    recent,
    add: (q: string) => save([q, ...recent.filter((r) => r !== q)].slice(0, 8)),
    remove: (q: string) => save(recent.filter((r) => r !== q)),
    clear: () => save([]),
  }
}

export function SearchScreen() {
  const t = useCd()
  const locale = useLocale()
  const router = useRouter()
  const phone = usePhone()
  const { labels } = useV2Shell()
  const params = useSearchParams()
  const q = params?.get('q') ?? ''
  const [draft, setDraft] = useState(q)
  const [focused, setFocused] = useState(!q)
  const [filters, setFilters] = useState<Record<string, string[]>>({ show: ['all'] })
  const [sort, setSort] = useState('relevance')
  const [sheet, setSheet] = useState(false)
  const recents = useRecent()
  useEffect(() => setDraft(q), [q])

  const show = filters.show?.[0] ?? 'all'
  const qs = new URLSearchParams({ q, sort })
  if (show !== 'all') qs.set('type', show)
  if (filters.region?.[0]) qs.set('area_lv1', filters.region[0])
  if (filters.district?.[0]) qs.set('area_lv2', filters.district[0])
  if (filters.theme?.length) qs.set('tags', filters.theme.join(','))
  const { data, error, isLoading } = useSWR<SearchResult>(q.length >= 2 ? `/api/search?${qs}` : null, jsonFetch)
  const { data: sugg } = useSWR<{ suggestions: string[] }>(focused && draft.trim().length >= 2 ? `/api/search/suggestions?q=${encodeURIComponent(draft)}&lang=${locale}` : null, jsonFetch)

  const go = (text: string) => {
    if (!text.trim()) return
    recents.add(text.trim())
    setFocused(false)
    router.push(`/search?q=${encodeURIComponent(text.trim())}`)
  }
  const groups: FilterGroup[] = [
    { id: 'show', label: t('CD1271'), options: [['all', 'CD1267'], ['places', 'CD1269'], ['plans', 'CD1270'], ['explore', 'CD1268']].map(([id, cd]) => ({ id, label: t(cd) })) },
    { id: 'region', label: t('CD1254'), options: [['Seoul', 'CD1266'], ['Busan', 'CD1264'], ['Jeju', 'CD1265']].map(([id, cd]) => ({ id, label: t(cd) })) },
    { id: 'district', label: t('CD1255'), options: [['Gangnam', 'CD1257'], ['Hongdae', 'CD1259'], ['Myeongdong', 'CD1261'], ['Haeundae', 'CD1258'], ['Seomyeon', 'CD1263'], ['Jeju City', 'CD1260'], ['Seogwipo', 'CD1262']].map(([id, cd]) => ({ id, label: t(cd) })) },
    { id: 'theme', label: t('CD1283'), multi: true, options: [['kpop', 'CD1279'], ['kdrama', 'CD1278'], ['kbeauty', 'CD1277'], ['food', 'CD1275'], ['history', 'CD1276'], ['nature', 'CD1280'], ['shopping', 'CD1282'], ['nightlife', 'CD1281']].map(([id, cd]) => ({ id, label: t(cd) })) },
  ]
  const sortCfg = { label: t('CD1272'), options: [{ id: 'relevance', label: t('CD1274') }, { id: 'popularity', label: t('CD1273') }], value: sort, onValueChange: setSort }
  const suggestions = (
    <SearchSuggestions
      viewport={phone ? 'mobile' : 'desktop'}
      state={draft.trim() ? 'typing' : 'empty'}
      query={draft}
      onSearch={go}
      places={(sugg?.suggestions ?? []).slice(0, 3).map((s, i) => ({ id: `s${i}`, name: s, meta: '', href: `/search?q=${encodeURIComponent(s)}` }))}
      recent={recents.recent.map((r) => ({ id: r, text: r }))}
      onRemoveRecent={recents.remove}
      onClearRecent={recents.clear}
      trending={[['K-Pop', 'CD1247'], ['K-Drama', 'CD1246'], ['K-Beauty', 'CD1244']].map(([id, cd]) => ({ id, text: t(cd) }))}
      categories={[['k-pop', 'CD1247'], ['k-drama', 'CD1246'], ['k-beauty', 'CD1244'], ['k-culture', 'CD1245']].map(([id, cd]) => ({ id, name: t(cd), href: `/explore/${id}` }))}
      labels={{ searchFor: (x) => `${t('CD1317')}: “${x}”`, places: t('CD1316'), plans: t('CD1300'), explore: t('CD1299'), recent: t('CD1297'), clearAll: t('CD1248'), trending: t('CD0313'), browse: t('CD1299'), remove: (x) => t('CD1298', { query: x }) }}
    />
  )
  const field = (
    <SearchInput
      label={labels.search}
      placeholder={labels.search}
      value={draft}
      autoFocus={!q}
      onFocus={() => setFocused(true)}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && go(draft)}
      onClear={() => setDraft('')}
      clearLabel={t('CD1248')}
      size="md"
    />
  )

  const results = (
    <div className="flex flex-col gap-[var(--space-8)]">
      {q ? <p aria-live="polite" className="type-body-caption text-ui-fg-muted">{data ? t('CD1303', { query: q, places: data.places.length, plans: data.plans.length, explore: data.explore.length }) : isLoading ? t('CD1285') : ''}</p> : null}
      {error ? <EmptyState type="error" title={t('CD1249')} action={<Button size="md" variant="secondary" onClick={() => router.refresh()}>{t('CD1304')}</Button>} /> : null}
      {isLoading ? (
        <div aria-busy className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div>
      ) : null}
      {data && !data.places.length && !data.plans.length && !data.explore.length ? (
        <EmptyState type="no-results" title={t('CD1291', { query: q })} action={<Button size="md" variant="secondary" onClick={() => setFilters({ show: ['all'] })}>{t('CD1433')}</Button>}>{t('CD1292')}</EmptyState>
      ) : null}
      {data?.places.length ? (
        <section className="flex flex-col gap-[var(--space-4)]">
          <SectionHeader title={t('CD1307')} />
          <ul className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-3">
            {(show === 'places' ? data.places : data.places.slice(0, 3)).map((p) => (
              <li key={p.poi_id}>
                <Card type="place" href={`/map?poi=${p.poi_id}`} title={locale === 'ko' ? p.name_ko : p.name_en || p.name_ko} imageSrc={p.primary_image_url} meta={[p.display_region, p.display_domain].filter(Boolean).join(' · ')} />
              </li>
            ))}
          </ul>
          {show !== 'places' && data.places.length > 3 ? <Button variant="secondary" size="md" className="self-start" onClick={() => setFilters({ ...filters, show: ['places'] })}>{t('CD1311', { count: data.places.length })}</Button> : null}
        </section>
      ) : null}
      {data?.plans.length ? (
        <section className="flex flex-col gap-[var(--space-4)]">
          <SectionHeader title={t('CD1308')} />
          <ul className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-3">
            {data.plans.slice(0, show === 'plans' ? 60 : 3).map((p) => (
              <li key={p.id}>
                <Card type="plan" href={`/plan/${p.id}`} title={p.title} imageSrc={p.cover_image_url} author={p.author_name} saves={String(p.save_count)} stops={t('CD1315', { count: p.stop_count })} sponsored={p.is_partner ? t('CD1314') : undefined} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {data?.explore.length ? (
        <section className="flex flex-col gap-[var(--space-4)]">
          <SectionHeader title={t('CD1306')} />
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
    return (
      <>
        <TopAppBar type="search" labels={labels} onBack={() => router.back()} search={field} className="sticky top-0 z-30" />
        <main id="main" className="flex-1 px-[var(--grid-gutter-mobile)] py-[var(--space-3)]">
          {focused ? suggestions : (
            <>
              <div className="-mx-[var(--grid-gutter-mobile)] mb-[var(--space-4)] flex gap-[var(--space-2)] overflow-x-auto px-[var(--grid-gutter-mobile)] [scrollbar-width:none]">
                <Chip type="icon-only" leadingIcon={<SlidersHorizontal />} onClick={() => setSheet(true)}>{t('CD1284')}</Chip>
                {groups[0].options.map((o) => <Chip key={o.id} selected={show === o.id} onClick={() => setFilters({ ...filters, show: [o.id] })}>{o.label}</Chip>)}
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
      <main id="main" className="flex min-w-0 flex-1 flex-col gap-[var(--space-6)] overflow-y-auto px-[var(--space-8)] py-[var(--space-6)]">
        <div className="relative max-w-[560px]">
          {field}
          {focused ? <div className="absolute inset-x-0 top-full z-40 mt-[var(--space-2)]">{suggestions}</div> : null}
        </div>
        <h1 className="sr-only">{t('CD1293')}</h1>
        {results}
        {q ? <IntlLink href="/map" className="inline-flex items-center gap-[var(--space-2)] self-start type-label-button text-ui-link hover:text-ui-link-hover"><Map aria-hidden className="size-[var(--icon-size-sm)]" />{t('CD1287')}</IntlLink> : null}
      </main>
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
