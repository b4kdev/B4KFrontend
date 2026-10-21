'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import useSWR from 'swr'
import { Link as IntlLink } from '@/i18n/navigation'
import {
  Button,
  Card,
  Carousel,
  EmptyState,
  Hero,
  InterestsCard,
  PlanningCue,
  RowSection,
  SectionHeader,
  Skeleton,
} from '@/components/library'
import { useAuth } from '@/contexts/AuthContext'
import { useInterests } from '@/hooks/useInterests'
import { apiFetch } from '@/lib/api'
import { getDraftPlan } from '@/lib/draft-plan'
import { labelOf } from '@/lib/quickplan'
import type { HomeCarouselSlide } from '@/app/api/home/carousel/data'
import type { HomeTrendingPoi } from '@/app/api/home/trending/route'
import type { HomePopularPlan } from '@/app/api/home/popular-plans/route'
import type { HomeEvent } from '@/app/api/home/events/route'
import { useCd } from '../cd'
import { V2Page } from '../V2Page'
import { useV2Shell } from '../V2Shell'
import { usePlaceActions } from '../usePlaceActions'
import { useDDay } from '../useDDay'

// Home (SCR-001, PD-19, PD-36, PD-40; UI-81, UI-97): hero, Explore by category, Trending now,
// Planning cue (after Trending), Interests card (SCR-036), Upcoming events, Popular plans.
// Live data from /api/home/*; a row with no content hides (PD-51); a row that fails shows an
// Empty state Error with Try again.

export const jsonFetch = <T,>(url: string) => fetch(url).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(r.status)))

export const CATEGORIES = [
  { slug: 'k-pop', label: 'CD0433', sub: 'CD1550', image: '/images/home/editorial/KP-008_world-kpop-center-hybe-insight.webp' },
  { slug: 'k-drama', label: 'CD0431', sub: 'CD1551', image: '/images/home/new/KD010-009_hakrim-dabang.webp' },
  { slug: 'k-beauty', label: 'CD0427', sub: 'CD1552', image: '/images/home/editorial/KB-NEW-065_olive-young-myeongdong.webp' },
  { slug: 'k-culture', label: 'CD0429', sub: 'CD1553', image: '/images/home/editorial/KD016-014_gyeongbokgung-palace.webp' },
  { slug: 'k-food', label: 'CD0251', sub: 'CD1554', image: '/mock-images/kbbq.png' },
] as const

export function RowState({ title, error, onRetry, loading }: { title: string; error?: unknown; onRetry: () => void; loading?: boolean }) {
  const t = useCd()
  if (loading) {
    return (
      <section aria-busy className="flex flex-col gap-[var(--space-4)]">
        <SectionHeader title={title} />
        <div className="flex gap-[var(--space-4)] overflow-hidden">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] w-[280px] shrink-0" />)}</div>
      </section>
    )
  }
  if (!error) return null
  return (
    <section className="flex flex-col gap-[var(--space-4)]">
      <SectionHeader title={title} />
      <EmptyState type="error" container="bordered" title={t('CD1571')} action={<Button size="md" variant="secondary" onClick={onRetry}>{t('CD0125')}</Button>}>
        {t('CD1560')}
      </EmptyState>
    </section>
  )
}

/** The interests card shows 6 tags, as drawn: taken one per category in turn (first chip of each, then the second). */
function interestTags<T>(categories: { chips: T[] }[], count = 6): T[] {
  const out: T[] = []
  for (let round = 0; out.length < count; round++) {
    const next = categories.map((c) => c.chips[round]).filter((x): x is T => x !== undefined)
    if (!next.length) break
    out.push(...next.slice(0, count - out.length))
  }
  return out
}

export function HomeScreen() {
  const act = usePlaceActions({ resume: true })
  const dDay = useDDay()
  const t = useCd()
  const locale = useLocale()
  const { openQuickPlan } = useV2Shell()
  const { user } = useAuth()
  const slides = useSWR<HomeCarouselSlide[]>('/api/home/carousel', jsonFetch)
  const trending = useSWR<HomeTrendingPoi[]>('/api/home/trending', jsonFetch)
  const plans = useSWR<HomePopularPlan[]>('/api/home/popular-plans', jsonFetch)
  const events = useSWR<HomeEvent[]>('/api/home/events', jsonFetch)
  // Continue your plan when signed in (the account draft, or a device draft not yet moved to the
  // account); signed out the cue always reads Start, as drawn.
  const [deviceDraft, setDeviceDraft] = useState<{ name?: string; stops: number } | null>(null)
  useEffect(() => {
    const d = getDraftPlan()
    if (d?.stops?.length) setDeviceDraft({ name: d.name, stops: d.stops.length })
  }, [])
  const accountDraft = useSWR<{ title?: string; stop_count: number } | null>(user ? '/api/plans/draft' : null, jsonFetch)
  const draft = user
    ? accountDraft.data?.stop_count ? { name: accountDraft.data.title || undefined, stops: accountDraft.data.stop_count } : deviceDraft
    : null

  // Interests card (SCR-036): signed in, no interests saved yet, not dismissed on this device.
  const mine = useSWR(user ? '/me/interests' : null, (p: string) => apiFetch<{ interest_tags: string[] }>(p))
  const [dismissed, setDismissed] = useState(true)
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem('b4k-v2-interests-card') === 'done')
    } catch {}
  }, [])
  const showInterests = !!user && !dismissed && !!mine.data && mine.data.interest_tags.length === 0
  const { categories } = useInterests(showInterests)
  const [picked, setPicked] = useState<string[]>([])
  const doneInterests = () => {
    try {
      localStorage.setItem('b4k-v2-interests-card', 'done')
    } catch {}
    setDismissed(true)
  }

  const name = (p: HomeTrendingPoi) => (locale === 'ko' ? p.name_ko : p.name_en || p.name_ko)

  return (
    <V2Page bleed>
      {slides.data?.length ? (
        <Carousel type="hero" label={t('CD0388')} previousLabel={t('CD0390')} nextLabel={t('CD0389')} slideLabel={(n) => t('CD0391', { n })}>
          {slides.data.map((s, i) => (
            <Hero
              key={s.id}
              as={i === 0 ? 'h1' : 'h2'}
              imageSrc={s.image_url}
              eyebrow={s.badge}
              title={s.title}
              subtitle={s.subtitle}
              action={<IntlLink href={`${s.cta_href.startsWith('/') ? s.cta_href : `/${s.cta_href}`}`} className="inline-flex h-[var(--control-height-lg)] items-center bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse focus-visible:shadow-focus-ring focus-visible:outline-none">{s.cta_label}</IntlLink>}
            />
          ))}
        </Carousel>
      ) : slides.isLoading ? (
        <Skeleton className="h-[var(--hero-height-home)] w-full" />
      ) : null}

      <div className="mx-auto flex w-full max-w-[var(--container-xl)] flex-col gap-[var(--space-12)] px-[var(--grid-gutter-mobile)] py-[var(--space-10)] md:px-[var(--grid-gutter-tablet)] lg:px-[var(--space-8)]">
        <section aria-labelledby="explore-cats" className="flex flex-col gap-[var(--space-4)]">
          <SectionHeader id="explore-cats" title={t('CD0426')} />
          <ul className="-mx-[var(--grid-gutter-mobile)] flex gap-[var(--space-3)] overflow-x-auto px-[var(--grid-gutter-mobile)] [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-5 lg:px-0">
            {CATEGORIES.map((c) => (
              <li key={c.slug} className="w-[160px] shrink-0 lg:w-auto">
                <Card type="collection-photo" href={`/explore/${c.slug}`} title={t(c.label)} imageSrc={c.image} meta={t(c.sub)} />
              </li>
            ))}
          </ul>
        </section>

        {trending.data?.length ? (
          <RowSection
            title={t('CD0313')}
            seeAll={{ href: '/explore/all/trending', label: t('CD1309') }}
            cards={trending.data.map((p) => (
              <Card key={p.poi_id} type="place" href={`/map?poi=${p.poi_id}`} {...act(p.poi_id, name(p))} title={name(p)} imageSrc={p.primary_image_url} meta={p.display_region} />
            ))}
          />
        ) : (
          <RowState title={t('CD0313')} loading={trending.isLoading} error={trending.error} onRetry={() => trending.mutate()} />
        )}

        <PlanningCue
          state={draft ? 'continue' : 'start'}
          label={t('CD1359')}
          tiles={{
            newPlan: { href: '/map?plan=new', title: t('CD1359'), text: t('CD1360') },
            continue: draft ? { href: '/map?plan=open', title: t('CD0411'), text: `${draft.name ?? t('CD1359')} · ${t('CD0473', { n: draft.stops })}` } : undefined,
            quickPlan: { onOpen: openQuickPlan, title: t('CD1361'), text: t('CD1362') },
            fromSaved: { href: '/saved/plan', title: t('CD1363'), text: t('CD1364') },
          }}
        />

        {showInterests ? (
          <InterestsCard
            title={t('CD1609')}
            text={t('CD1347')}
            tags={interestTags(categories).map((c) => ({ id: c.slug, label: labelOf(c, locale) }))}
            selected={picked}
            onToggle={(id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 10 ? [...p, id] : p))}
            onSave={async () => {
              await apiFetch('/me/interests', { method: 'PUT', body: JSON.stringify({ tags: picked, completed: true }) }).catch(() => {})
              doneInterests()
            }}
            onDismiss={doneInterests}
            labels={{ save: t('CD1610'), dismiss: t('CD0128') }}
          />
        ) : null}

        {events.data?.length ? (
          <RowSection
            title={t('CD0425')}
            cards={events.data.map((e) => (
              <Card key={e.id} type="place" href={`/map?event=${e.id}`} title={e.title} imageSrc={e.image_url} meta={e.location} dDay={dDay(e.date_start)} />
            ))}
          />
        ) : (
          <RowState title={t('CD0425')} error={events.error} onRetry={() => events.mutate()} />
        )}

        {plans.data?.length ? (
          <RowSection
            title={t('CD0477')}
            seeAll={{ href: '/explore/all/popular-plans', label: t('CD1309') }}
            cards={plans.data.map((p) => (
              <Card key={p.id} type="plan" href={`/plan/${p.id}`} title={p.title} imageSrc={p.cover_image_url} author={p.author_name} saves={String(p.save_count)} stops={t('CD0473', { n: p.stop_count })} sponsored={p.is_partner ? t('CD0476') : undefined} />
            ))}
          />
        ) : (
          <RowState title={t('CD0477')} loading={plans.isLoading} error={plans.error} onRetry={() => plans.mutate()} />
        )}
      </div>
    </V2Page>
  )
}
