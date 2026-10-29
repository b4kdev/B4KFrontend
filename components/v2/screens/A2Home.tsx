'use client'

import { Fragment, useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import useSWR from 'swr'
import { RotateCw } from 'lucide-react'
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
import type { HomeTrendingPoi } from '@/app/api/home/trending/route'
import type { HomePopularPlan } from '@/app/api/home/popular-plans/route'
import type { HomeEvent } from '@/app/api/home/events/route'
import { HOME_SECTION_ORDER, type HomeSectionOrder } from '@/app/api/home/section-order/order'
import { useCd } from '../cd'
import { V2Page } from '../V2Page'
import { useV2Shell } from '../V2Shell'
import { usePlaceActions, usePlanActions } from '../usePlaceActions'
import { CATEGORIES } from '../categories'
import { useDDay } from '../useDDay'

// Home: hero, Explore by category, Trending now,
// Planning cue (after Trending), Interests card, Upcoming events, Popular plans.
// Live data from /api/home/*; a row with no content hides; a row that fails shows an
// Empty state Error with Try again.

// The hero's action button look.
const HERO_ACTION = 'inline-flex h-[var(--control-height-lg)] items-center bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse focus-visible:shadow-focus-ring focus-visible:outline-none'

export const jsonFetch = <T,>(url: string) => fetch(url).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(r.status)))

export { CATEGORIES } from '../categories'

/** Loading cards as drawn: a 4:3 photo and two lines; 240 wide on phones, desktop width per page. */
function CardSkeletons({ cardClassName = 'lg:w-[296px]' }: { cardClassName?: string }) {
  return (
    <div className="flex gap-[var(--space-3)] overflow-hidden">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={`flex w-[240px] shrink-0 flex-col gap-[var(--space-2)] ${cardClassName}`}>
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton shape="line" className="h-[var(--space-3-5)] w-4/5" />
          <Skeleton shape="line" className="h-[var(--space-3-5)] w-1/2" />
        </div>
      ))}
    </div>
  )
}

/** Two loading sections as drawn: a title line and cards, 24 above and below each. */
export function SectionSkeletons({ cardClassName }: { cardClassName?: string }) {
  return (
    <>
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-[var(--space-4)] py-[var(--space-6)]">
          <Skeleton shape="line" className="h-[var(--space-5)] w-[180px]" />
          <CardSkeletons cardClassName={cardClassName} />
        </div>
      ))}
    </>
  )
}

/** Home while its rows load, as drawn: the hero block, then two sections of a title line and cards. */
function HomeSkeleton({ heroClassName }: { heroClassName: string }) {
  return (
    <div aria-busy className="pb-[var(--space-8)]">
      <Skeleton className={`h-[var(--hero-height-home)] w-full ${heroClassName}`} />
      <div className="mx-auto w-full max-w-[calc(var(--container-xl)+var(--space-8)*2)] px-[var(--grid-gutter-mobile)] md:px-[var(--grid-gutter-tablet)] lg:px-[var(--space-8)]">
        <SectionSkeletons />
      </div>
    </div>
  )
}

export function RowState({ title, error, onRetry, loading, errorTitle, errorBody = 'CD1560' }: { title: string; error?: unknown; onRetry: () => void; loading?: boolean; errorTitle?: string; errorBody?: string }) {
  const t = useCd()
  if (loading) {
    return (
      <section aria-busy className="flex flex-col gap-[var(--space-4)]">
        <SectionHeader title={title} />
        <CardSkeletons />
      </section>
    )
  }
  if (!error) return null
  return (
    <section className="flex flex-col gap-[var(--space-4)]">
      <SectionHeader title={title} />
      <EmptyState type="error" container="plain" title={errorTitle ? t(errorTitle) : t('CD1563', { title })} action={<Button size="md" variant="secondary" leadingIcon={<RotateCw />} onClick={onRetry}>{t('CD0125')}</Button>}>
        {t(errorBody)}
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

/** The plan in progress for the Planning cue's Continue tile, when signed in: the account draft, or a
 * device draft not yet moved to the account. Signed out the cue always reads Start, as drawn. */
export function useContinueDraft() {
  const { user } = useAuth()
  const [deviceDraft, setDeviceDraft] = useState<{ name?: string; stops: number } | null>(null)
  useEffect(() => {
    const d = getDraftPlan()
    if (d?.stops?.length) setDeviceDraft({ name: d.name, stops: d.stops.length })
  }, [])
  const accountDraft = useSWR<{ title?: string; stop_count: number } | null>(user ? '/api/plans/draft' : null, jsonFetch)
  return user
    ? accountDraft.data?.stop_count ? { name: accountDraft.data.title || undefined, stops: accountDraft.data.stop_count } : deviceDraft
    : null
}

/** The served order, cleaned: known keys only, then any default key it left out, in its default place. */
function sectionOrder(served?: string[]) {
  const known = (served ?? []).filter((k, i, all) => HOME_SECTION_ORDER.includes(k) && all.indexOf(k) === i)
  const out = [...known]
  HOME_SECTION_ORDER.forEach((k, i) => {
    if (!out.includes(k)) out.splice(Math.min(i, out.length), 0, k)
  })
  return out
}

export function HomeScreen() {
  const act = usePlaceActions({ resume: true })
  const planAct = usePlanActions({ resume: true })
  const dDay = useDDay()
  const t = useCd()
  const locale = useLocale()
  const { openQuickPlan, toast } = useV2Shell()
  const { user } = useAuth()
  // Hero slide 2 shows the photo its Theme page shows (its first place's photo), read from the same
  // data as that page so the two stay in step.
  const foodTheme = useSWR<{ items: { primary_image_url: string | null }[] }>('/api/explore/k-food/michelin-noodles', jsonFetch)
  const trending = useSWR<HomeTrendingPoi[]>('/api/home/trending', jsonFetch)
  const plans = useSWR<HomePopularPlan[]>('/api/home/popular-plans', jsonFetch)
  const events = useSWR<HomeEvent[]>('/api/home/events', jsonFetch)
  const order = useSWR<HomeSectionOrder>('/api/home/section-order', jsonFetch, { revalidateOnFocus: false })
  const draft = useContinueDraft()

  // Interests card: on a following visit (a later browser session than the one in which this device
  // first opened Home), signed in, no interests saved yet, not dismissed on this device.
  const mine = useSWR(user ? '/me/interests' : null, (p: string) => apiFetch<{ interest_tags: string[] }>(p))
  const [dismissed, setDismissed] = useState(true)
  useEffect(() => {
    try {
      let following = true
      if (!localStorage.getItem('b4k-v2-first-visit')) {
        localStorage.setItem('b4k-v2-first-visit', new Date().toISOString())
        sessionStorage.setItem('b4k-v2-first-visit', 'this')
        following = false
      } else if (sessionStorage.getItem('b4k-v2-first-visit') === 'this') following = false
      setDismissed(!following || localStorage.getItem('b4k-v2-interests-card') === 'done')
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

  // Phones: the hero runs up under the floating top bar, so it grows by the bar's height.
  const heroPhone = 'max-lg:h-[calc(var(--hero-height-home)+var(--fab-size)+env(safe-area-inset-top))]'
  if (trending.isLoading && !trending.data) {
    return (
      <V2Page bleed underBar>
        <HomeSkeleton heroClassName={heroPhone} />
      </V2Page>
    )
  }

  // Home's content sections by key, in the order /api/home/section-order gives (the drawn order by
  // default; later the account's own). Unknown keys are ignored; a missing key keeps its default place.
  const blocks: Record<string, React.ReactNode> = {
    exploreHub: <section aria-labelledby="explore-cats" className="flex flex-col gap-[var(--space-4)]">
              <SectionHeader id="explore-cats" title={t('CD0426')} />
              <ul className="-mx-[var(--grid-gutter-mobile)] flex gap-[var(--space-3)] overflow-x-auto px-[var(--grid-gutter-mobile)] [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-5 lg:px-0">
                {CATEGORIES.map((c) => (
                  <li key={c.slug} className="w-[160px] shrink-0 lg:w-auto">
                    <Card type="collection-photo" href={`/explore/${c.slug}`} title={t(c.label)} imageSrc={c.image} meta={t(c.sub)} />
                  </li>
                ))}
              </ul>
            </section>,
    trending: (trending.data?.length ? (
              <RowSection
                arrowLabels={{ previous: t('CD0390'), next: t('CD0389') }}
                title={t('CD0313')}
                seeAll={{ href: '/explore/trending', label: t('CD1309') }}
                cards={trending.data.map((p) => (
                  <Card key={p.poi_id} type="place" href={`/map?poi=${p.poi_id}`} {...act(p.poi_id, name(p))} title={name(p)} imageSrc={p.primary_image_url} meta={p.display_region} />
                ))}
              />
            ) : (
              <RowState title={t('CD0313')} loading={trending.isLoading} error={trending.error} onRetry={() => trending.mutate()} />
            )),
    planningCue: <PlanningCue
              state={draft ? 'continue' : 'start'}
              label={t('CD1359')}
              tiles={{
                newPlan: { href: '/map?plan=new', title: t('CD1359'), text: t('CD1360') },
                continue: draft ? { href: '/map?plan=open', title: t('CD0411'), text: `${draft.name ?? t('CD1359')} · ${t('CD0473', { n: draft.stops })}` } : undefined,
                quickPlan: { onOpen: openQuickPlan, title: t('CD1361'), text: t('CD1362') },
                fromSaved: { href: '/saved/plan', title: t('CD1363'), text: t('CD1364') },
              }}
            />,
    interests: (showInterests ? (
              <InterestsCard
                title={t('CD1609')}
                text={t('CD1347')}
                tags={interestTags(categories).map((c) => ({ id: c.slug, label: labelOf(c, locale) }))}
                selected={picked}
                onToggle={(id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 10 ? [...p, id] : p))}
                // A failed save keeps the card and its picks, with the error toast.
                onSave={() =>
                  apiFetch('/me/interests', { method: 'PUT', body: JSON.stringify({ tags: picked, completed: true }) })
                    .then(doneInterests)
                    .catch(() => toast({ type: 'critical', message: t('CD0061') }))
                }
                onDismiss={doneInterests}
                labels={{ save: t('CD1610'), dismiss: t('CD0128') }}
              />
            ) : null),
    events: (events.data?.length ? (
              <RowSection
                arrowLabels={{ previous: t('CD0390'), next: t('CD0389') }}
                title={t('CD0425')}
                cards={events.data.map((e) => (
                  <Card key={e.id} type="place" href={`/map?event=${e.id}`} title={e.title} imageSrc={e.image_url} meta={e.location} dDay={dDay(e.date_start)} />
                ))}
              />
            ) : (
              <RowState title={t('CD0425')} error={events.error} onRetry={() => events.mutate()} />
            )),
    popularPlans: (plans.data?.length ? (
              <RowSection
                arrowLabels={{ previous: t('CD0390'), next: t('CD0389') }}
                title={t('CD0477')}
                seeAll={{ href: '/explore/popular-plans', label: t('CD1309') }}
                cards={plans.data.map((p) => (
                  <Card key={p.id} type="plan" href={`/plan/${p.id}`} title={p.title} save={planAct(String(p.id), p.title)} imageSrc={p.cover_image_url} author={p.author_name} authorHref={p.author_id ? `/profile/${p.author_id}` : undefined} saves={String(p.save_count)} stops={[t('CD0473', { n: p.stop_count }), ...(p.duration_days ? [t('CD1232', { count: p.duration_days })] : [])].join(' · ')} sponsored={p.is_partner ? t('CD0476') : undefined} />
                ))}
              />
            ) : (
              <RowState title={t('CD0477')} loading={plans.isLoading} error={plans.error} onRetry={() => plans.mutate()} />
            )),
  }

  return (
    <V2Page bleed underBar>
      {/* Two slides: no autoplay, the arrows wrap around. Slide 1 is the brand slide (no photo, the
          media surface with the fade); its action opens Quick plan. The drawn K-Drama slide waits for
          its photo. */}
      <Carousel type="hero" label={t('CD0388')} previousLabel={t('CD0390')} nextLabel={t('CD0389')} slideLabel={(n) => t('CD0391', { n })}>
        {[
          { id: 'plan', eyebrow: t('CD0463'), title: t('CD1781'), subtitle: t('CD1782'), image: null, action: <button type="button" onClick={openQuickPlan} className={HERO_ACTION}>{t('CD0738')}</button> },
          { id: 'food', eyebrow: t('CD0251'), title: t('CD1786'), subtitle: t('CD1787'), image: foodTheme.data?.items[0]?.primary_image_url ?? null, action: <IntlLink href="/explore/k-food/michelin-noodles" className={HERO_ACTION}>{t('CD1785')}</IntlLink> },
        ].map((s, i) => (
          <Hero key={s.id} className={heroPhone} as={i === 0 ? 'h1' : 'h2'} priority={i === 0} imageSrc={s.image} eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} action={s.action} />
        ))}
      </Carousel>

      <div className="mx-auto flex w-full max-w-[calc(var(--container-xl)+var(--space-8)*2)] flex-col gap-[var(--space-12)] px-[var(--grid-gutter-mobile)] pb-[calc(var(--space-6)+var(--space-8))] pt-[var(--space-6)] md:px-[var(--grid-gutter-tablet)] lg:px-[var(--space-8)]">
        {sectionOrder(order.data?.order).map((key) => (
          <Fragment key={key}>{blocks[key]}</Fragment>
        ))}
      </div>
    </V2Page>
  )
}
