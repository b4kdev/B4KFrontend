'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import useSWR, { mutate as mutateKey } from 'swr'
import useSWRInfinite from 'swr/infinite'
import { Award, Bell, Bookmark, Calendar, Map as MapIcon, Pencil, Share2, Sparkles, Star, Trophy, Zap, User } from 'lucide-react'
import { Link as IntlLink, useRouter } from '@/i18n/navigation'
import {
  buttonVariants,
  AchievementBadge,
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  EmptyState,
  IconButton,
  LeaderboardRow,
  ListItem,
  Modal,
  NotificationItem,
  ProfileHeader,
  QuickPlan,
  RowSection,
  SectionHeader,
  SegmentedControl,
  MenuItem,
  Skeleton,
  Spinner,
  Tabs,
  TextInput,
  Toggle,
} from '@/components/library'
import { usePhone } from '@/components/library/hooks'
import { FOCUS_RING } from '@/components/library/styles'
import { cn } from '@/lib/cn'
import { useAuth } from '@/contexts/AuthContext'
import { getThemeChoice, setTheme, type ThemeChoice } from '@/lib/theme'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { GAMIFICATION } from '@/lib/features'
import type { ProfileData } from '@/app/api/profile/route'
import type { ProfileTrip } from '@/app/api/profile/trips/route'
import type { Badge as BadgeT, BadgesData } from '@/app/api/badges/route'
import type { LeaderboardData, LeaderboardWindow } from '@/app/api/leaderboard/route'
import type { HomePopularPlan } from '@/app/api/home/popular-plans/route'
import type { HomeTrendingPoi } from '@/app/api/home/trending/route'
import type { Notification, NotificationsData } from '@/app/api/notifications/route'
import type { NotificationPref } from '@/app/api/account/notification-prefs/route'
import type { OtherUserTrip } from '@/app/api/profile/[id]/trips/route'
import type { OtherUserBadge } from '@/app/api/profile/[id]/badges/route'
import { useBadgeName } from '../badges'
import { useCd, useCdKey } from '../cd'
import { useGap } from '../gaps'
import { apiFetch } from '@/lib/api'
import { useInterests } from '@/hooks/useInterests'
import { labelOf, MAX_INTEREST_CHIPS } from '@/lib/quickplan'
import { V2Page } from '../V2Page'
import { UNREAD_KEY, useV2Shell, useV2SignOut } from '../V2Shell'
import { LANGUAGES, LanguageRowMenu } from '../V2Settings'
import { usePlaceActions, usePlanActions } from '../usePlaceActions'
import { jsonFetch } from './A2Home'
import { SignedOutPrompt } from './A3Saved'
import { passwordProblem } from '@/lib/password'

// A3 account screens and A5 language and theme: Profile own and visitor, Badges, Leaderboard,
// Notifications, Settings. Live /api/profile, /api/badges, /api/leaderboard,
// /api/notifications, /api/account/*.

const send = (url: string, method: string, body?: unknown) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json().catch(() => ({}))
  })

const BADGE_ICON = (category: string) => {
  const Icon = category === 'creator' ? Award : category === 'explorer' ? MapIcon : category === 'challenge' || category === 'leaderboard' ? Trophy : category === 'special' ? Zap : Star
  return <Icon />
}

// ── Profile (own) ───────────────────────────────────────────────────

// The Profile header carries its own 16 / 24 inset and is drawn edge to edge on phones: it bleeds
// over the page gutter and the page top padding below desktop.
const HEADER_BLEED = 'max-md:-mx-[var(--grid-gutter-mobile)] md:max-lg:-mx-[var(--grid-gutter-tablet)] max-lg:-mt-[var(--space-6)]'

export function ProfileOwnScreen() {
  const GAP = useGap()
  const badgeName = useBadgeName()
  const k = useCdKey()
  const t = useCd()
  const phone = usePhone()
  const { user } = useAuth()
  const profile = useSWR<ProfileData>(user ? '/api/profile' : null, jsonFetch)
  const trips = useSWR<ProfileTrip[]>(user ? '/api/profile/trips' : null, jsonFetch)
  const badges = useSWR<BadgesData>(user && GAMIFICATION ? '/api/badges' : null, jsonFetch)
  if (!user) {
    return <V2Page bar={{ type: 'page', title: k('profile.header.breadcrumb') }}><SignedOutPrompt title={k('auth.gate.context.profile_nav')} text={k('auth.gate.valueProp')} /></V2Page>
  }
  const p = profile.data
  // Your profile is your public page: only published plans; drafts and private plans live in Saved.
  const plans = trips.data?.filter((tr) => tr.is_published)
  return (
    <V2Page bar={{ type: 'page', title: k('profile.header.breadcrumb') }}>
      {/* Figma: one 960 column; header, then the Plans section (subtitle, See all, three
          cards, Open Saved) on the 24 inset. */}
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-[var(--space-6)]">
        {p ? (
          <div className={HEADER_BLEED}><ProfileHeader
            viewport={phone ? 'mobile' : 'desktop'}
            name={p.name || k('profile.header.namePlaceholder')}
            avatarSrc={p.avatar_url}
            stats={[
              { number: p.trips_count, label: k('profile.header.tripsLabel') },
              { number: p.saves_count, label: k('profile.header.savesLabel') },
              ...(GAMIFICATION ? [{ number: p.badges_count, label: k('profile.header.badgesLabel') }] : []),
            ]}
            badges={GAMIFICATION && p.pinned_badges.length ? p.pinned_badges.map((b) => <AchievementBadge key={b.id} name={badgeName(b)} detail={k(`badges.rarity.${b.rarity}`)} icon={<Trophy />} rarity={b.rarity} />) : undefined}
            // Figma: a small outlined button, full width on phones.
            action={<IntlLink href="/settings" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'max-lg:w-full')}><Pencil aria-hidden className="size-[var(--icon-size-sm)]" />{t('CD1515')}</IntlLink>}
          /></div>
        ) : profile.error ? (
          <EmptyState type="error" container="bordered" title={k('profile.header.errorTitle')} action={<Button size="md" variant="secondary" onClick={() => profile.mutate()}>{k('profile.header.errorRetry')}</Button>} />
        ) : (
          <Skeleton className="h-[120px]" />
        )}
        {plans?.length ? (
          <section aria-labelledby="profile-plans" className="flex flex-col gap-[var(--space-6)] lg:px-[var(--space-6)]">
            <SectionHeader id="profile-plans" title={t('CD1300')} subtitle={GAP.profilePlansNote} seeAll={{ href: '/saved?tab=my-plans', label: t('CD1309') }} />
            <ul className="grid grid-cols-2 gap-[var(--space-3)] lg:grid-cols-3 lg:gap-[var(--space-4)]">
              {plans.slice(0, phone ? 2 : 3).map((tr) => <li key={tr.id}><Card type="plan" href={`/plan/${tr.id}`} title={tr.title} imageSrc={tr.thumbnail_url} author={p?.name ?? ''} saves={String(tr.save_count)} stops={k('saved.plan.stops', { count: tr.stop_count })} /></li>)}
            </ul>
            <IntlLink href="/saved?tab=my-plans" className="inline-flex h-[var(--control-height-md)] items-center self-start px-[var(--button-padding-x)] type-label-button text-ui-fg hover:bg-ui-state-hover">{GAP.openSaved}</IntlLink>
          </section>
        ) : plans ? (
          <EmptyState container="bordered" title={k('profile.trips.empty.title')} action={<IntlLink href="/map?plan=new" className="inline-flex h-[var(--control-height-md)] items-center bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse">{k('profile.trips.empty.cta')}</IntlLink>}>{k('profile.trips.empty.desc')}</EmptyState>
        ) : null}
        {badges.data ? (
          <RowSection
            title={k('badges.title')}
            subtitle={t('CD1590', { earned: badges.data.earned_count, total: badges.data.total_count })}
            seeAll={{ href: '/badges', label: t('CD1309') }}
            cards={badges.data.badges.map((b) => <BadgeTile key={b.id} b={b} />)}
          />
        ) : null}
      </div>
    </V2Page>
  )
}


function BadgeTile({ b, onOpen }: { b: BadgeT; onOpen?: () => void }) {
  const badgeName = useBadgeName()
  const k = useCdKey()
  const locale = useLocale()
  const detail = b.earned && b.earned_at
    ? `${k(`badges.rarity.${b.rarity}`)} · ${k('badges.badge.earnedOn', { date: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(b.earned_at)) })}`
    : b.unlock_criteria.description
  const tile = <AchievementBadge name={badgeName(b)} detail={detail} icon={BADGE_ICON(b.category)} rarity={b.rarity} locked={!b.earned} lockedLabel={k('badges.badge.locked')} />
  return onOpen ? (
    <button type="button" onClick={onOpen} className="rounded-2xl p-[var(--space-2)] hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none">{tile}</button>
  ) : tile
}

// ── Profile (visitor) ───────────────────────────────────────────────

type OtherProfile = { id: number; name: string | null; avatar_url: string | null; trips_count: number; saves_count: number; badges_count: number; trips_public: boolean; badges_public: boolean }

export function ProfileVisitorScreen({ id }: { id: string }) {
  const badgeName = useBadgeName()
  const k = useCdKey()
  const t = useCd()
  const phone = usePhone()
  const { toast } = useV2Shell()
  const locale = useLocale()
  const profile = useSWR<OtherProfile>(`/api/profile/${id}`, jsonFetch)
  const trips = useSWR<OtherUserTrip[]>(`/api/profile/${id}/trips`, jsonFetch)
  const planActions = usePlanActions({ resume: true })
  const badges = useSWR<OtherUserBadge[] | { badges: OtherUserBadge[] }>(GAMIFICATION ? `/api/profile/${id}/badges` : null, jsonFetch)
  const badgeList = Array.isArray(badges.data) ? badges.data : badges.data?.badges ?? []
  const p = profile.data
  if (profile.error) return <V2Page bar={{ type: 'page', title: '' }}><EmptyState title={k('profile.notFound')} /></V2Page>
  return (
    <V2Page bar={{ type: 'page', title: p?.name ?? '' }}>
      {/* Figma: the own profile layout; Share is a round icon button in the header row. */}
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-[var(--space-6)]">
        {p ? (
          <div className={HEADER_BLEED}><ProfileHeader
            viewport={phone ? 'mobile' : 'desktop'}
            name={p.name || k('profile.anonymousUser')}
            avatarSrc={p.avatar_url}
            stats={[
              { number: p.trips_count, label: k('profile.header.tripsLabel') },
              { number: p.saves_count, label: k('profile.header.savesLabel') },
              ...(GAMIFICATION ? [{ number: p.badges_count, label: k('profile.header.badgesLabel') }] : []),
            ]}
            actionInRow
            action={<IconButton variant="secondary" label={k('saved.myPlan.share')} icon={<Share2 />} onClick={() => { navigator.clipboard?.writeText(`${location.origin}/${locale}/profile/${id}`); toast({ type: 'success', message: k('profile.trips.card.shareCopiedToast') }) }} />}
          /></div>
        ) : <Skeleton className="h-[120px]" />}
        {trips.data?.length ? (
          <section aria-labelledby="visitor-plans" className="flex flex-col gap-[var(--space-6)] lg:px-[var(--space-6)]">
            <SectionHeader id="visitor-plans" title={t('CD1300')} />
            <ul className="grid grid-cols-2 gap-[var(--space-3)] lg:grid-cols-3 lg:gap-[var(--space-4)]">
              {trips.data.map((tr) => <li key={tr.id}><Card type="plan" href={`/plan/${tr.id}`} title={tr.title} author={p?.name ?? ''} saves={String(tr.save_count)} stops={`${k('saved.plan.stops', { count: tr.stop_count })} · ${k('saved.plan.days', { count: tr.day_count })}`} save={planActions(String(tr.id), tr.title)} /></li>)}
            </ul>
          </section>
        ) : null}
        {badgeList.filter((b) => b.earned).length ? (
          <RowSection title={k('badges.title')} cards={badgeList.filter((b) => b.earned).map((b) => <AchievementBadge key={b.badge_id} name={badgeName(b)} detail={k(`badges.rarity.${b.rarity}`)} icon={<Trophy />} rarity={b.rarity} />)} />
        ) : null}
      </div>
    </V2Page>
  )
}

// ── Badges ─────────────────────────────────────────────────────────

// Badges come in two drawn groups: places you save (Exploring Korea) and what others do with your
// plans (Making plans). Locked badges say how to earn them; the server has no progress counts yet.
const PLAN_BADGES = new Set(['creator', 'social'])
// Category names and their Explore pages for the "Find … places" action.
const BADGE_CATEGORY: Record<string, { cd: string; slug: string }> = {
  kpop: { cd: 'CD0254', slug: 'k-pop' }, kdrama: { cd: 'CD0248', slug: 'k-drama' }, kbeauty: { cd: 'CD0242', slug: 'k-beauty' },
  kculture: { cd: 'CD0245', slug: 'k-culture' }, food: { cd: 'CD0251', slug: 'k-food' },
}
// How to earn, from the Copy Deck where it has the badge; else the server's description.
const BADGE_HOW_CD: Record<string, string> = { 'first-save': 'CD1658', 'map-maker': 'CD1659', 'k-pop-pilgrim': 'CD1660' }

export function BadgesScreen() {
  const badgeName = useBadgeName()
  const k = useCdKey()
  const t = useCd()
  const locale = useLocale()
  const router = useRouter()
  const phone = usePhone()
  const { user } = useAuth()
  const { toast } = useV2Shell()
  const { data, error, isLoading, mutate } = useSWR<BadgesData>('/api/badges', jsonFetch)
  const [open, setOpen] = useState<BadgeT | null>(null)
  const badges = data?.badges ?? []
  // /badges?badge={slug} (View badge on the unlock toast) opens that badge once the list is in.
  const asked = useSearchParams()?.get('badge')
  useEffect(() => {
    const b = asked ? data?.badges.find((x) => x.slug === asked) : undefined
    if (b) setOpen(b)
  }, [asked, data])
  const pinned = badges.filter((b) => b.is_pinned).length
  const day = (iso: string) => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso))
  const how = (b: BadgeT) => (BADGE_HOW_CD[b.slug] ? t(BADGE_HOW_CD[b.slug]) : b.unlock_criteria.description)
  const groups = [
    { id: 'exploring', title: t('CD1663'), sub: 'CD1664', list: badges.filter((b) => !PLAN_BADGES.has(b.category)) },
    { id: 'plans', title: t('CD1665'), sub: 'CD1666', list: badges.filter((b) => PLAN_BADGES.has(b.category)) },
  ]
  const category = (b: BadgeT) => (BADGE_CATEGORY[b.category] ? t(BADGE_CATEGORY[b.category].cd) : groups.find((g) => g.list.includes(b))?.title ?? '')
  const find = open && !open.earned ? BADGE_CATEGORY[open.category] : undefined
  return (
    // Figma: 16 above and below on phones; 24 above and 32 below on desktop.
    <V2Page bar={{ type: 'page', title: k('badges.title') }} className="max-lg:py-[var(--space-4)] lg:pb-[var(--space-8)]">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-[var(--space-6)]">
        {/* Desktop only: phones carry the title in the top bar and draw no count line. */}
        <header className="flex flex-col gap-[var(--space-1)] max-lg:hidden">
          <h1 className="type-display-h3">{k('badges.title')}</h1>
          <p className="type-body-base text-ui-fg-muted">{user ? t('CD1590', { earned: data?.earned_count ?? 0, total: data?.total_count ?? 0 }) : t('CD1591')}</p>
        </header>
        {isLoading ? <Skeleton className="h-[240px]" /> : null}
        {error ? <EmptyState type="error" container="bordered" title={k('badges.error.title')} action={<Button size="md" variant="secondary" onClick={() => mutate()}>{k('badges.error.retry')}</Button>} /> : null}
        {groups.map((g) => g.list.length ? (
          <section key={g.id} aria-labelledby={`badges-${g.id}`} className="flex flex-col gap-[var(--space-6)]">
            <SectionHeader id={`badges-${g.id}`} title={g.title} subtitle={user ? t(g.sub, { earned: g.list.filter((b) => b.earned).length, total: g.list.length }) : undefined} />
            <ul className="flex flex-wrap gap-x-[var(--space-3)] gap-y-[var(--space-6)] lg:gap-x-[var(--space-6)]">
              {g.list.map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => setOpen(b)} className={cn('flex rounded-xl text-left', FOCUS_RING)}>
                    <AchievementBadge name={badgeName(b)} detail={b.earned && b.earned_at ? k('badges.badge.earnedOn', { date: day(b.earned_at) }) : how(b)} icon={<Trophy />} rarity={b.rarity} locked={!b.earned} lockedLabel={k('badges.badge.locked')} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null)}
      </div>
      <Dialog
        open={!!open}
        onCancel={() => setOpen(null)}
        title={open ? badgeName(open) : ''}
        body={open ? (open.earned && open.earned_at
          ? t('CD1671', { category: category(open), rarity: k(`badges.rarity.${open.rarity}`), date: day(open.earned_at) })
          : `${category(open)} · ${k(`badges.rarity.${open.rarity}`)} · ${k('badges.badge.locked')}. ${how(open)}`) : ''}
        cancel={<Button variant="secondary" data-autofocus onClick={() => setOpen(null)}>{phone ? k('saved.folder.cancel') : k('badges.detail.close')}</Button>}
        confirm={open?.earned ? (
          <Button
            onClick={async () => {
              if (!open) return
              if (!open.is_pinned && pinned >= 3) return toast({ type: 'warning', message: k('badges.detail.pinLimit') })
              await send(`/api/badges/${open.id}/pin`, 'PATCH', { is_pinned: !open.is_pinned }).catch(() => toast({ type: 'critical', message: k('badges.detail.pinError') }))
              setOpen(null)
              mutate()
            }}
          >
            {open.is_pinned ? k('badges.detail.unpin') : k('badges.detail.pin')}
          </Button>
        ) : find ? (
          <Button onClick={() => router.push(`/explore/${find.slug}`)}>{t('CD1673', { category: t(find.cd) })}</Button>
        ) : undefined}
      />
    </V2Page>
  )
}

// ── Leaderboard ────────────────────────────────────────────────────

// Popular planners rows: position, avatar, name, saves and likes (no trophies, score or arrows).
// The server does not send saves and likes per planner yet, so the line shows only when it does.
type PlannerEntry = LeaderboardData['entries'][number] & { saves?: number; likes?: number }

function PlannerRows({ data, limit }: { data: LeaderboardData; limit?: number }) {
  const k = useCdKey()
  const t = useCd()
  const { user } = useAuth()
  const profile = useSWR<ProfileData>(user ? '/api/profile' : null, jsonFetch)
  const line = (e: { saves?: number; likes?: number }) => (e.saves != null && e.likes != null ? t('CD1652', { saves: e.saves, likes: e.likes }) : undefined)
  const own = data.your_rank as (LeaderboardData['your_rank'] & { saves?: number; likes?: number }) | null
  return (
    <ol className="w-full lg:max-w-[720px]">
      {(data.entries as PlannerEntry[]).slice(0, limit).map((e) => (
        <LeaderboardRow
          key={e.user.id}
          rank={e.rank}
          rankLabel={k('leaderboard.rank', { rank: e.rank })}
          name={e.user.name}
          avatarSrc={e.user.avatar_url}
          detail={line(e)}
         
          href={`/profile/${e.user.id}`}
          renderLink={({ href, className, children }) => <IntlLink href={href} className={className}>{children}</IntlLink>}
        />
      ))}
      {user && own ? <LeaderboardRow rank={own.rank} rankLabel={k('leaderboard.yourRank.ariaLabel', { rank: own.rank })} name={profile.data?.name ?? ''} avatarSrc={profile.data?.avatar_url} you={t('CD1592')} detail={line(own)} /> : null}
    </ol>
  )
}

function PlannersEmpty({ className }: { className?: string }) {
  const k = useCdKey()
  const t = useCd()
  return (
    <EmptyState container="plain" icon={<Trophy />} className={className} title={k('leaderboard.empty.title')} action={<IntlLink href="/map?plan=new" className="inline-flex h-[var(--control-height-md)] items-center bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse">{t('CD1594')}</IntlLink>}>{t('CD1593')}</EmptyState>
  )
}

const PERIODS = ['weekly', 'rising', 'annual'] as const

// The weekly board runs Monday to Sunday: "Oct 13 to 19", or "Oct 27 to Nov 2" across months.
function weekRange(locale: string, now = new Date()) {
  const start = new Date(now)
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const md = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' })
  return { start: md.format(start), end: start.getMonth() === end.getMonth() ? new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(end) : md.format(end) }
}

/** Saved, fourth tab (behind the gamification switch): period, trending plans and places, popular planners, your badges. */
export function LeaderboardTab() {
  const k = useCdKey()
  const t = useCd()
  const locale = useLocale()
  const router = useRouter()
  const badgeName = useBadgeName()
  const { user } = useAuth()
  const { requireSignIn } = useV2Shell()
  const [win, setWin] = useState<LeaderboardWindow>('weekly')
  const board = useSWR<LeaderboardData>(`/api/leaderboard?window=${win}`, jsonFetch)
  const plans = useSWR<HomePopularPlan[]>('/api/home/popular-plans', jsonFetch)
  const places = useSWR<HomeTrendingPoi[]>('/api/home/trending', jsonFetch)
  const badges = useSWR<BadgesData>(user ? '/api/badges' : null, jsonFetch)
  const act = usePlaceActions({ resume: true })
  const planAct = usePlanActions({ resume: true })
  const placeName = (p: HomeTrendingPoi) => (locale === 'ko' ? p.name_ko : p.name_en || p.name_ko)
  const range = weekRange(locale)
  const arrows = { previous: t('CD0390'), next: t('CD0389') }
  const day = (iso: string) => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso))
  // Next up: earned badges first, then the locked ones to work on, six in all.
  const next = [...(badges.data?.badges ?? [])].sort((a, b) => Number(b.earned) - Number(a.earned) || (b.earned_at ?? '').localeCompare(a.earned_at ?? '')).slice(0, 6)
  // Figma: each section 24 above and below; 16 apart on desktop, end to end on phones.
  const section = 'flex flex-col gap-[var(--space-4)] py-[var(--space-6)] max-lg:-mt-[var(--space-4)]'
  return (
    <>
      <SegmentedControl label={k('leaderboard.windows.ariaLabel')} options={PERIODS.map((w) => ({ id: w, label: k(`leaderboard.windows.${w}`) }))} value={win} onValueChange={(v) => setWin(v as LeaderboardWindow)} className="w-full lg:w-[320px]" />
      {win === 'weekly' ? <SectionHeader title={t('CD1646')} subtitle={t('CD1647', range)} /> : <SectionHeader title={k(`leaderboard.windows.${win}`)} />}
      {plans.data?.length ? (
        <RowSection
          className={section}
          arrowLabels={arrows}
          title={t('CD1648')}
          seeAll={{ href: '/explore/popular-plans', label: t('CD1309') }}
          cards={plans.data.map((p) => <Card key={p.id} type="plan" href={`/plan/${p.id}`} title={p.title} imageSrc={p.cover_image_url} author={p.author_name} authorHref={p.author_id ? `/profile/${p.author_id}` : undefined} saves={String(p.save_count)} stops={t('CD0473', { n: p.stop_count })} save={planAct(String(p.id), p.title)} />)}
        />
      ) : null}
      {places.data?.length ? (
        <RowSection
          className={section}
          arrowLabels={arrows}
          title={t('CD1649')}
          seeAll={{ href: '/explore/trending', label: t('CD1309') }}
          cards={places.data.map((p) => <Card key={p.poi_id} type="place" href={`/map?poi=${p.poi_id}`} {...act(p.poi_id, placeName(p))} title={placeName(p)} imageSrc={p.primary_image_url} meta={p.display_region} trending={t('CD0313')} />)}
        />
      ) : null}
      <section aria-labelledby="lb-planners" className={section}>
        <SectionHeader id="lb-planners" title={t('CD1650')} subtitle={t('CD1651')} seeAll={board.data?.entries.length ? { href: '/leaderboard', label: t('CD1309') } : undefined} />
        {board.isLoading ? <Skeleton className="h-[200px] lg:max-w-[720px]" /> : null}
        {board.error ? <EmptyState type="error" container="bordered" title={k('leaderboard.error.title')} action={<Button size="md" variant="secondary" onClick={() => board.mutate()}>{k('leaderboard.error.retry')}</Button>} /> : null}
        {board.data ? (board.data.entries.length ? <PlannerRows data={board.data} limit={3} /> : <PlannersEmpty />) : null}
      </section>
      <section aria-labelledby="lb-badges" className={section}>
        <SectionHeader
          id="lb-badges"
          title={t('CD1653')}
          subtitle={user ? t('CD1667', { earned: badges.data?.earned_count ?? 0, total: badges.data?.total_count ?? 0 }) : t('CD1654')}
          seeAll={user ? { href: '/badges', label: t('CD1309') } : undefined}
        />
        {user ? (
          <ul className="-mx-[var(--grid-gutter-mobile)] flex gap-[var(--space-3)] overflow-x-auto px-[var(--grid-gutter-mobile)] [scrollbar-width:none] lg:mx-0 lg:gap-[var(--space-6)] lg:px-0">
            {/* relative: keeps the locked tiles' screen-reader label inside the scrolling track. */}
            {next.map((b) => (
              <li key={b.id} className="relative shrink-0">
                <button type="button" onClick={() => router.push('/badges')} className={cn('flex rounded-xl text-left', FOCUS_RING)}>
                  <AchievementBadge name={badgeName(b)} detail={b.earned && b.earned_at ? k('badges.badge.earnedOn', { date: day(b.earned_at) }) : b.unlock_criteria.description} icon={<Trophy />} rarity={b.rarity} locked={!b.earned} lockedLabel={k('badges.badge.locked')} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState container="plain" icon={<Bookmark />} title={t('CD1591')} action={<Button size="md" onClick={() => requireSignIn({ title: t('CD1591'), run: () => {} })}>{t('CD0050')}</Button>}>{t('CD1655')}</EmptyState>
        )}
      </section>
    </>
  )
}

/** Popular planners See all: the whole board for a period, with your own row. */
export function LeaderboardScreen() {
  const k = useCdKey()
  const t = useCd()
  const phone = usePhone()
  const [win, setWin] = useState<LeaderboardWindow>('weekly')
  const { data, error, isLoading, mutate } = useSWR<LeaderboardData>(`/api/leaderboard?window=${win}`, jsonFetch)
  return (
    // Figma: 16 above on phones; 24 above and 32 below on desktop.
    // An empty board fills the page, the empty state centred in it.
    <V2Page bar={{ type: 'page', title: t('CD1650') }} className="flex flex-col max-lg:py-[var(--space-4)] lg:pb-[var(--space-8)]">
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-[var(--space-4)]">
        <SectionHeader title={t('CD1650')} subtitle={t('CD1651')} className="max-lg:hidden" />
        <Tabs label={k('leaderboard.windows.ariaLabel')} width={phone ? 'equal' : 'hug'} value={win} onValueChange={(v) => setWin(v as LeaderboardWindow)} tabs={PERIODS.map((w) => ({ id: w, label: k(`leaderboard.windows.${w}`) }))} className="lg:max-w-[480px]" />
        {isLoading ? <Skeleton className="h-[320px]" /> : null}
        {error ? <EmptyState type="error" container="bordered" title={k('leaderboard.error.title')} action={<Button size="md" variant="secondary" onClick={() => mutate()}>{k('leaderboard.error.retry')}</Button>} /> : null}
        {data ? (data.entries.length ? <PlannerRows data={data} /> : <PlannersEmpty className="flex-1 justify-center" />) : null}
      </div>
    </V2Page>
  )
}

// ── Notifications ──────────────────────────────────────────────────

const NOTIF_ICON: Record<string, React.ReactNode> = { badge_earned: <Award />, event_drop: <Calendar />, editorial_pick: <Sparkles />, deal_expiring: <Bell />, challenge_new: <Trophy />, promotion: <Bookmark /> }

const NOTIF_PAGE = 20

export function NotificationsScreen() {
  const k = useCdKey()
  const t = useCd()
  const locale = useLocale()
  const { user } = useAuth()
  const { toast } = useV2Shell()
  // Load more pages the server list, 20 at a time; the last page is the one with fewer than 20.
  const pages = useSWRInfinite<NotificationsData>(
    (i, prev: NotificationsData | null) => (!user || (prev && prev.notifications.length < NOTIF_PAGE) ? null : `/api/notifications?limit=${NOTIF_PAGE}&offset=${i * NOTIF_PAGE}`),
    jsonFetch,
  )
  const { error, isLoading, mutate, setSize } = pages
  const data = pages.data ? { notifications: pages.data.flatMap((p) => p.notifications), unread_count: pages.data[0]?.unread_count ?? 0 } : undefined
  const more = !!pages.data && (pages.data[pages.data.length - 1]?.notifications.length ?? 0) >= NOTIF_PAGE
  // Mark read and Mark all read show at once and roll back with an error toast if the server says no.
  const markRead = async (id: string | null) => {
    const before = pages.data
    mutate(before?.map((p) => ({ unread_count: id ? Math.max(0, p.unread_count - 1) : 0, notifications: p.notifications.map((n) => (!id || n.id === id ? { ...n, is_read: true } : n)) })), { revalidate: false })
    try {
      await (id ? send(`/api/notifications/${id}`, 'PATCH', { is_read: true }) : send('/api/notifications/mark-all-read', 'POST'))
    } catch {
      mutate(before, { revalidate: false })
      toast({ type: 'critical', message: t('CD0061') })
    }
    mutateKey(UNREAD_KEY)
  }
  const groups = useMemo(() => {
    const today = new Date().toDateString()
    const y = new Date(Date.now() - 864e5).toDateString()
    const g: Record<'today' | 'yesterday' | 'earlier', Notification[]> = { today: [], yesterday: [], earlier: [] }
    for (const n of (pages.data ?? []).flatMap((p) => p.notifications).filter((n) => GAMIFICATION || (n.type !== 'badge_earned' && n.type !== 'challenge_new'))) {
      const d = new Date(n.created_at).toDateString()
      g[d === today ? 'today' : d === y ? 'yesterday' : 'earlier'].push(n)
    }
    return g
  }, [pages.data])
  // Figma "2h ago", "1d ago": relative time in the reader's language, no Copy Deck text needed.
  const time = (iso: string) => {
    const rtf = new Intl.RelativeTimeFormat(locale, { style: 'narrow', numeric: 'always' })
    const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 6e4))
    return min < 60 ? rtf.format(-min, 'minute') : min < 1440 ? rtf.format(-Math.round(min / 60), 'hour') : rtf.format(-Math.round(min / 1440), 'day')
  }
  if (!user) return <V2Page bar={{ type: 'page', title: k('notifications.title') }}><SignedOutPrompt title={k('notifications.title')} text={t('CD1596')} /></V2Page>
  return (
    <V2Page bar={{ type: 'page', title: k('notifications.title') }} className="flex flex-col max-lg:py-[var(--space-4)] lg:pb-[var(--space-8)]">
      {/* Figma: 720 column, section-header title, Mark all read on its own row at the end,
          caps day labels, Load more at the start; Nothing yet is a plain empty state. */}
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-[var(--space-4)]">
        <h1 className="type-display-h3 max-lg:hidden">{k('notifications.title')}</h1>
        {data?.unread_count ? <Button variant="ghost" size="md" className="self-end" onClick={() => markRead(null)}>{k('notifications.markAllRead')}</Button> : null}
        {isLoading ? <Skeleton className="h-[240px]" /> : null}
        {error ? <EmptyState type="error" container="bordered" title={k('notifications.error.title')} action={<Button size="md" variant="secondary" onClick={() => mutate()}>{k('notifications.error.retry')}</Button>} /> : null}
        {data && !data.notifications.length ? <EmptyState icon={<Bell />} title={t('CD1595')} className="flex-1">{t('CD1596')}</EmptyState> : null}
        {(['today', 'yesterday', 'earlier'] as const).map((g) =>
          groups[g].length ? (
            <section key={g} className="flex flex-col gap-[var(--space-4)]">
              <h2 className="type-eyebrow-category text-ui-fg-muted">{k(`notifications.groups.${g}`)}</h2>
              <ul>
                {groups[g].map((n) => (
                  <NotificationItem
                    key={n.id}
                    icon={NOTIF_ICON[n.type] ?? <Bell />}
                    title={n.title}
                    body={n.body}
                    time={time(n.created_at)}
                    read={n.is_read}
                    unreadLabel={k('notifications.unread', { count: 1 })}
                    href={n.deep_link_url ? `${n.deep_link_url}` : '/notifications'}
                    renderLink={({ href, className, children }) => (
                      <IntlLink href={href} className={className} onClick={() => !n.is_read && markRead(n.id)}>{children}</IntlLink>
                    )}
                  />
                ))}
              </ul>
            </section>
          ) : null,
        )}
        {more ? <Button variant="secondary" size="md" className="self-start" loading={pages.isValidating && pages.size > (pages.data?.length ?? 0)} onClick={() => setSize((n) => n + 1)}>{k('notifications.loadMore')}</Button> : null}
      </div>
    </V2Page>
  )
}

// ── Settings with Language and theme ─────────────────────

/**
 * Your interests sheet (Figma SCR-022 Your interests): the Quick plan dialog without a step
 * indicator, laid out like step 2: the picked chips, then the categories (a list on desktop, a row
 * of chips on phones) and that category's chips; footer Clear and Save interests.
 */
function InterestsSheet({ open, initial, onClose, onSaved }: { open: boolean; initial: string[]; onClose: () => void; onSaved: () => void }) {
  const t = useCd()
  const k = useCdKey()
  const lang = useLocale()
  const phone = usePhone()
  const { toast } = useV2Shell()
  const { categories, isLoading, isError, retry } = useInterests(open)
  const [picked, setPicked] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const chipLabel = new Map(categories.flatMap((g) => g.chips.map((c) => [c.slug, labelOf(c, lang)] as const)))
  const group = categories.find((g) => g.slug === activeGroup) ?? categories[0]
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : p.length < MAX_INTEREST_CHIPS ? [...p, slug] : p))
  const lbl = 'type-eyebrow-category text-ui-fg-muted'
  const save = async () => {
    setBusy(true)
    try {
      await apiFetch('/me/interests', { method: 'PUT', body: JSON.stringify({ tags: picked, completed: true }) })
      toast({ type: 'success', message: t('CD0773') })
      onSaved()
    } catch {
      toast({ type: 'critical', message: t('CD0772') })
    } finally {
      setBusy(false)
    }
  }
  return (
    <QuickPlan
      open={open}
      onClose={onClose}
      step={2}
      stepTitle={t('CD1599')}
      title={t('CD1599')}
      closeLabel={k('badges.detail.close')}
      back={{ label: t('CD0789'), onClick: () => setPicked([]) }}
      next={{ label: t('CD1610'), onClick: save, loading: busy }}
    >
      <div className="flex flex-col gap-[var(--space-5)]">
        <div className="flex flex-col gap-[var(--space-2)]">
          <p aria-live="polite" className={lbl}>{t('CD1348', { count: picked.length, max: MAX_INTEREST_CHIPS })}</p>
          {picked.length ? (
            <div className="flex flex-wrap gap-[var(--space-2)]">
              {picked.map((slug) => <Chip key={slug} type="dismissible" dismissLabel={t('CD0783', { label: chipLabel.get(slug) ?? slug })} onClick={() => toggle(slug)}>{chipLabel.get(slug) ?? slug}</Chip>)}
            </div>
          ) : <p className="type-body-caption text-ui-fg-muted">{t('CD0779')}</p>}
        </div>
        {isLoading ? <Spinner label={t('CD0781')} /> : null}
        {isError ? (
          <p role="alert" className="type-body-base text-ui-danger">
            {t('CD0780')} <button type="button" onClick={retry} className="underline underline-offset-2">{t('CD0784')}</button>
          </p>
        ) : null}
        {group ? (
          <div className={phone ? 'flex flex-col gap-[var(--space-6)]' : 'flex gap-[var(--space-6)]'}>
            <div role="group" aria-label={t('CD0778')} className={phone ? 'flex gap-[var(--space-2)] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : 'flex w-[136px] shrink-0 flex-col items-start gap-[var(--space-3)]'}>
              {categories.map((g) =>
                phone ? (
                  <Chip key={g.slug} selected={g.slug === group.slug} onClick={() => setActiveGroup(g.slug)} className="shrink-0">{labelOf(g, lang)}</Chip>
                ) : (
                  <button
                    key={g.slug}
                    type="button"
                    aria-pressed={g.slug === group.slug}
                    onClick={() => setActiveGroup(g.slug)}
                    className={cn('text-left focus-visible:shadow-focus-ring focus-visible:outline-none', g.slug === group.slug ? 'type-body-label text-ui-fg' : 'type-body-base text-ui-fg-muted hover:text-ui-fg')}
                  >
                    {labelOf(g, lang)}
                  </button>
                ),
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap content-start gap-[var(--space-2)]">
              {group.chips.map((c) => {
                const on = picked.includes(c.slug)
                return <Chip key={c.slug} selected={on} disabled={!on && picked.length >= MAX_INTEREST_CHIPS} onClick={() => toggle(c.slug)}>{labelOf(c, lang)}</Chip>
              })}
            </div>
          </div>
        ) : null}
      </div>
    </QuickPlan>
  )
}

export function SettingsScreen() {
  const k = useCdKey()
  const t = useCd()
  const locale = useLocale()
  const router = useRouter()
  const phone = usePhone()
  const { user } = useAuth()
  const { openLanguage, toast } = useV2Shell()
  const signOut = useV2SignOut()
  const GAP = useGap()
  // Your interests row: how many are picked, as drawn ("6 picked · used for Home and Quick plan").
  const interests = useSWR(user ? '/me/interests' : null, (p: string) => apiFetch<{ interest_tags?: string[] }>(p).catch(() => null))
  const picked = interests.data?.interest_tags?.length ?? 0
  const prefs = useSWR<{ prefs: NotificationPref[] }>(user ? '/api/account/notification-prefs' : null, jsonFetch)
  const profile = useSWR<ProfileData>(user ? '/api/profile' : null, jsonFetch)
  const [theme, setThemeState] = useState<ThemeChoice>('system')
  useEffect(() => setThemeState(getThemeChoice()), [])
  const [themeSheet, setThemeSheet] = useState(false)
  const [interestsSheet, setInterestsSheet] = useState(false)
  const [nameSheet, setNameSheet] = useState(false)
  const [name, setName] = useState('')
  const [pwSheet, setPwSheet] = useState(false)
  // What you agreed to: the account's consent record, read when the sheet opens.
  const [agreedSheet, setAgreedSheet] = useState(false)
  const consent = useSWR<{ consent: { age_confirmed?: boolean; accepted_at?: string } | null }>(user && agreedSheet ? '/api/account/consent' : null, jsonFetch)
  const agreedOn = consent.data?.consent?.accepted_at ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(consent.data.consent.accepted_at)) : null
  const [pw, setPw] = useState({ current: '', next: '' })
  const [deleting, setDeleting] = useState(false)
  // Account delete needs a sign-in within the last 10 minutes (the delete route enforces it too):
  // password accounts re-enter the password, Google accounts sign in with Google again.
  const [reauth, setReauth] = useState(false)
  const [reauthPw, setReauthPw] = useState('')
  const [reauthError, setReauthError] = useState('')
  const [reauthBusy, setReauthBusy] = useState(false)
  const providers: string[] = (user?.app_metadata?.providers as string[] | undefined) ?? [user?.app_metadata?.provider ?? 'email']
  const hasPassword = providers.includes('email')
  const hasGoogle = providers.includes('google')
  const startDelete = async () => {
    const res = await fetch('/api/account/recent-login').then((r) => r.json()).catch(() => ({ recent: false }))
    if (res.recent) setDeleting(true)
    else { setReauthPw(''); setReauthError(''); setReauth(true) }
  }
  const confirmPassword = async () => {
    setReauthBusy(true)
    setReauthError('')
    const ok = await send('/api/account/recent-login', 'POST', { password: reauthPw }).then(() => true, () => false)
    setReauthBusy(false)
    if (!ok) return setReauthError(t('CD1010'))
    setReauth(false)
    setDeleting(true)
  }
  const confirmGoogle = () =>
    createSupabaseBrowserClient().auth.signInWithOAuth({
      provider: 'google',
      options: { scopes: 'email profile', redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent('/settings?delete=1')}` },
    })
  // Back from the Google sign-in: continue the delete flow.
  useEffect(() => {
    if (!user || new URLSearchParams(window.location.search).get('delete') !== '1') return
    window.history.replaceState(null, '', window.location.pathname)
    startDelete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])
  const themeOptions: { id: ThemeChoice; label: string }[] = [
    { id: 'light', label: t('CD0988') },
    { id: 'dark', label: t('CD0987') },
    { id: 'system', label: t('CD1639') },
  ]
  const chooseTheme = (v: ThemeChoice) => {
    setTheme(v)
    setThemeState(v)
  }
  const optOut = (type: string) => prefs.data?.prefs?.find((p) => p.notif_type === type)?.opt_out ?? false
  const toggleNotif = async (type: string, on: boolean) => {
    await send('/api/account/notification-prefs', 'PATCH', { notif_type: type, opt_out: !on }).catch(() => toast({ type: 'critical', message: k('profile.settings.notifications.error') }))
    prefs.mutate()
  }
  // Figma: caps group labels on the column edge, lists with row dividers, 16 between all parts.
  const heading = 'type-eyebrow-category text-ui-fg-muted'
  const langName = LANGUAGES.find((l) => l.code === locale)?.name ?? locale

  return (
    // Figma: 16 above the content on phones, 24 on desktop.
    <V2Page bar={{ type: 'page', title: k('nav.settings') }} className="pt-[var(--space-4)] lg:pt-[var(--space-6)]">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[var(--space-4)]">
        <h1 className="type-display-h3 max-lg:hidden">{k('nav.settings')}</h1>
        {/* Signed out: every group stays; account rows and toggles are disabled. */}
        <h2 className={heading}>{k('profile.settings.account.heading')}</h2>
        {user ? (
          <>
            <ul>
              <ListItem
                leading={<Avatar size="md" src={profile.data?.avatar_url} name={profile.data?.name} decorative />}
                title={profile.data?.name ?? ''}
                secondary={t('CD1597')}
                chevron
                onClick={() => { setName(profile.data?.name ?? ''); setNameSheet(true) }}
              />
              {/* Google-only accounts have no password to change. */}
              {hasPassword ? <ListItem title={t('CD0046')} secondary={t('CD1598')} chevron onClick={() => setPwSheet(true)} /> : null}
            </ul>
          </>
        ) : (
          <ul>
            <ListItem leading={<User />} title={k('nav.signIn')} secondary={t('CD1450')} chevron onClick={() => router.push('/login')} />
            <ListItem title={t('CD0046')} secondary={t('CD1598')} chevron disabled onClick={() => {}} />
          </ul>
        )}

        <h2 className={heading}>{k('profile.settings.preferences.heading')}</h2>
        <ul>
          {phone ? <ListItem title={k('profile.settings.preferences.language')} trailing={<span lang={locale}>{langName}</span>} onClick={openLanguage} /> : <LanguageRowMenu title={k('profile.settings.preferences.language')} />}
          {phone ? (
            <ListItem title={t('CD1283')} trailing={themeOptions.find((o) => o.id === theme)?.label} onClick={() => setThemeSheet(true)} />
          ) : (
            <ListItem title={t('CD1283')} trailing={<SegmentedControl label={t('CD1283')} options={themeOptions} value={theme} onValueChange={(v) => chooseTheme(v as ThemeChoice)} className="w-[320px]" />} />
          )}
          <ListItem title={t('CD1599')} secondary={picked ? GAP.interestsPicked(picked) : undefined} chevron disabled={!user} onClick={() => setInterestsSheet(true)} />
        </ul>

        <h2 className={heading}>{k('profile.settings.notifications.heading')}</h2>
        <ul>
          {([['badge_earned', 'CD1600'], ['event_drop', 'CD1602'], ['editorial_pick', 'CD0971']] as const).filter(([type]) => GAMIFICATION || type !== 'badge_earned').map(([type, cd]) => (
            <ListItem key={type} title={t(cd)} disabled={!user} trailing={<Toggle label={t(cd)} hideLabel disabled={!user} checked={!!user && !optOut(type)} onCheckedChange={(on) => toggleNotif(type, on)} />} />
          ))}
        </ul>

        {/* Privacy is per plan: no per-tab public toggles here. */}
        <h2 className={heading}>{GAP.settingsData}</h2>
        <ul>
          {user ? <ListItem title={t('CD1766')} secondary={t('CD1767')} chevron onClick={() => setAgreedSheet(true)} /> : null}
          <ListItem title={t('CD1603')} secondary={t('CD0137')} chevron onClick={() => router.push('/legal/cookies')} />
          {user ? <ListItem title={<span className="text-ui-danger">{k('profile.settings.deleteAccount')}</span>} secondary={GAP.deleteAccountNote} onClick={startDelete} /> : null}
        </ul>

        {user ? (
          <div className="flex flex-wrap items-start gap-[var(--space-2)]">
            <Button variant="secondary" size="md" onClick={signOut}>{k('profile.settings.signOut')}</Button>
            <Button variant="ghost" size="md" onClick={async () => { await send('/api/account/signout-all', 'POST').catch(() => toast({ type: 'critical', message: k('profile.settings.signOutAllError') })); signOut() }}>{t('CD1604')}</Button>
          </div>
        ) : null}
      </div>

      <Modal open={themeSheet} onClose={() => setThemeSheet(false)} size="sm" title={t('CD1283')} closeLabel={k('badges.detail.close')}>
        {/* Figma phone Theme sheet: a checked list like the Language sheet, 8 from the header and edges. */}
        <div role="menu" aria-label={t('CD1283')} className="-mx-[var(--space-4)] -mt-[var(--space-4)] [&>*]:px-[var(--space-4)]">
          {themeOptions.map((o) => (
            <MenuItem key={o.id} checked={o.id === theme} onClick={() => { chooseTheme(o.id); setThemeSheet(false) }}>{o.label}</MenuItem>
          ))}
        </div>
      </Modal>
      <InterestsSheet
        key={interestsSheet ? 'open' : 'closed'}
        open={interestsSheet}
        initial={(interests.data?.interest_tags ?? []).slice(0, MAX_INTEREST_CHIPS)}
        onClose={() => setInterestsSheet(false)}
        onSaved={() => { setInterestsSheet(false); interests.mutate() }}
      />
      <Modal open={nameSheet} onClose={() => setNameSheet(false)} size="sm" title={t('CD1597')} closeLabel={k('badges.detail.close')}
        secondaryAction={<Button variant="ghost" onClick={() => setNameSheet(false)}>{k('saved.folder.cancel')}</Button>}
        primaryAction={<Button disabled={!name.trim()} onClick={async () => { await send('/api/account/profile', 'PATCH', { display_name: name.trim() }).catch(() => toast({ type: 'critical', message: k('profile.settings.identity.error') })); setNameSheet(false); profile.mutate() }}>{k('profile.settings.identity.save')}</Button>}>
        <TextInput label={k('profile.settings.identity.displayName')} showLabel value={name} onChange={(e) => setName(e.target.value)} data-autofocus />
      </Modal>
      <Modal open={pwSheet} onClose={() => setPwSheet(false)} size="sm" title={k('profile.settings.password.heading')} closeLabel={k('badges.detail.close')}
        secondaryAction={<Button variant="ghost" onClick={() => setPwSheet(false)}>{k('saved.folder.cancel')}</Button>}
        primaryAction={<Button disabled={!!passwordProblem(pw.next) || !pw.current} onClick={async () => { try { await send('/api/account/password', 'POST', { currentPassword: pw.current, newPassword: pw.next }); toast({ type: 'success', message: k('profile.settings.password.success') }); setPwSheet(false) } catch { toast({ type: 'critical', message: k('profile.settings.passwordError') }) } }}>{k('profile.settings.password.submit')}</Button>}>
        <div className="flex flex-col gap-[var(--space-4)]">
          <TextInput label={k('profile.settings.password.current')} showLabel type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} data-autofocus />
          <TextInput label={k('profile.settings.password.new')} showLabel type="password" autoComplete="new-password" help={k('profile.settings.password.hint')} error={passwordProblem(pw.next) === 'weak' ? t('CD1866') : undefined} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        </div>
      </Modal>
      <Modal open={agreedSheet} onClose={() => setAgreedSheet(false)} size="sm" title={t('CD1766')} closeLabel={t('CD0758')} hideClose
        primaryAction={<Button onClick={() => setAgreedSheet(false)}>{t('CD0758')}</Button>}>
        <div className="flex flex-col gap-[var(--space-2)]">
          <p className="type-body-base text-ui-fg-muted">{t('CD1769')}</p>
          <ul>
            <ListItem title={t('CD0812')} secondary={agreedOn ? t('CD1770', { date: agreedOn }) : undefined} chevron href="/legal/terms" renderLink={({ href, className, children }) => <IntlLink href={href} className={className}>{children}</IntlLink>} />
            <ListItem title={t('CD0811')} secondary={agreedOn ? t('CD1770', { date: agreedOn }) : undefined} chevron href="/legal/privacy" renderLink={({ href, className, children }) => <IntlLink href={href} className={className}>{children}</IntlLink>} />
            <ListItem title={t('CD1771')} secondary={agreedOn && consent.data?.consent?.age_confirmed ? t('CD1772', { date: agreedOn }) : undefined} />
          </ul>
        </div>
      </Modal>
      <Dialog
        open={deleting}
        onCancel={() => setDeleting(false)}
        title={t('CD1605')}
        body={t('CD1606')}
        cancel={<Button variant="secondary" data-autofocus onClick={() => setDeleting(false)}>{k('profile.settings.deleteCancel')}</Button>}
        confirm={<Button variant="danger" onClick={async () => {
          try { await send('/api/account/delete', 'DELETE'); signOut() } catch (e) {
            if ((e as Error).message === '403') { setDeleting(false); setReauthPw(''); setReauthError(''); setReauth(true) }
            else toast({ type: 'critical', message: k('profile.settings.deleteError') })
          }
        }}>{k('profile.settings.deleteAccount')}</Button>}
      />
      <Modal open={reauth} onClose={() => setReauth(false)} size="sm" title={t('CD1011')} closeLabel={k('badges.detail.close')}
        secondaryAction={<Button variant="ghost" onClick={() => setReauth(false)}>{t('CD1008')}</Button>}
        primaryAction={hasPassword
          ? <Button disabled={!reauthPw || reauthBusy} loading={reauthBusy} onClick={confirmPassword}>{reauthBusy ? t('CD1014') : t('CD1009')}</Button>
          : <Button onClick={confirmGoogle}>{t('CD0043')}</Button>}>
        {hasPassword ? (
          <>
            <p className="type-body-base text-ui-fg-muted">{t('CD1012')}</p>
            <TextInput label={t('CD1013')} showLabel type="password" autoComplete="current-password" value={reauthPw}
              onChange={(e) => { setReauthPw(e.target.value); setReauthError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter' && reauthPw) confirmPassword() }}
              error={reauthError || undefined} data-autofocus />
            {hasGoogle ? <Button variant="secondary" onClick={confirmGoogle}>{t('CD0043')}</Button> : null}
          </>
        ) : null}
      </Modal>
    </V2Page>
  )
}
