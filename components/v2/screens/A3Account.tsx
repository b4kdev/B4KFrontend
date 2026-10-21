'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import useSWR from 'swr'
import { Award, Bell, Bookmark, Calendar, Map as MapIcon, Pencil, Share2, Sparkles, Star, Trophy, Zap } from 'lucide-react'
import { Link as IntlLink, useRouter } from '@/i18n/navigation'
import {
  AchievementBadge,
  Button,
  Card,
  Chip,
  Dialog,
  EmptyState,
  LeaderboardRow,
  ListItem,
  Modal,
  NotificationItem,
  ProfileHeader,
  RowSection,
  SegmentedControl,
  Skeleton,
  Tabs,
  TextInput,
  Toggle,
} from '@/components/library'
import { usePhone } from '@/components/library/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { getThemeChoice, setTheme, type ThemeChoice } from '@/lib/theme'
import type { ProfileData } from '@/app/api/profile/route'
import type { ProfileTrip } from '@/app/api/profile/trips/route'
import type { Badge as BadgeT, BadgesData } from '@/app/api/badges/route'
import type { LeaderboardData, LeaderboardWindow } from '@/app/api/leaderboard/route'
import type { Notification, NotificationsData } from '@/app/api/notifications/route'
import type { NotificationPref } from '@/app/api/account/notification-prefs/route'
import type { OtherUserTrip } from '@/app/api/profile/[id]/trips/route'
import type { OtherUserBadge } from '@/app/api/profile/[id]/badges/route'
import { useCd, useCdKey } from '../cd'
import { V2Page } from '../V2Page'
import { useV2Shell, useV2SignOut } from '../V2Shell'
import { LANGUAGES } from '../V2Settings'
import { jsonFetch } from './A2Home'
import { SignedOutPrompt } from './A3Saved'

// A3 account screens (PD-46, PD-47, PD-48, UI-100) and A5 language and theme (SCR-034, PD-03,
// PD-06): Profile own (SCR-017) and visitor (SCR-018), Badges (SCR-019), Leaderboard (SCR-020),
// Notifications (SCR-021), Settings (SCR-022). Live /api/profile, /api/badges, /api/leaderboard,
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

// ── Profile (own, SCR-017) ───────────────────────────────────────────────────

export function ProfileOwnScreen() {
  const badgeName = useBadgeName()
  const k = useCdKey()
  const t = useCd()
  const phone = usePhone()
  const { user } = useAuth()
  const profile = useSWR<ProfileData>(user ? '/api/profile' : null, jsonFetch)
  const trips = useSWR<ProfileTrip[]>(user ? '/api/profile/trips' : null, jsonFetch)
  const badges = useSWR<BadgesData>(user ? '/api/badges' : null, jsonFetch)
  if (!user) {
    return <V2Page bar={{ type: 'page', title: k('profile.header.breadcrumb') }}><SignedOutPrompt title={k('auth.gate.context.profile_nav')} text={k('auth.gate.valueProp')} /></V2Page>
  }
  const p = profile.data
  return (
    <V2Page bar={{ type: 'page', title: k('profile.header.breadcrumb') }}>
      <div className="flex flex-col gap-[var(--space-10)]">
        {p ? (
          <ProfileHeader
            viewport={phone ? 'mobile' : 'desktop'}
            name={p.name || k('profile.header.namePlaceholder')}
            avatarSrc={p.avatar_url}
            stats={[
              { number: p.trips_count, label: k('profile.header.tripsLabel') },
              { number: p.saves_count, label: k('profile.header.savesLabel') },
              { number: p.badges_count, label: k('profile.header.badgesLabel') },
            ]}
            badges={p.pinned_badges.length ? p.pinned_badges.map((b) => <AchievementBadge key={b.id} name={badgeName(b)} detail={k(`badges.rarity.${b.rarity}`)} icon={<Trophy />} rarity={b.rarity} />) : undefined}
            action={<IntlLink href="/settings" className="inline-flex h-[var(--control-height-md)] items-center gap-[var(--gap-sm)] border border-ui-border-strong px-[var(--button-padding-x)] type-label-button text-ui-fg hover:bg-ui-state-hover"><Pencil aria-hidden className="size-[var(--icon-size-sm)]" />{t('CD1515')}</IntlLink>}
          />
        ) : profile.error ? (
          <EmptyState type="error" container="bordered" title={k('profile.header.errorTitle')} action={<Button size="md" variant="secondary" onClick={() => profile.mutate()}>{k('profile.header.errorRetry')}</Button>} />
        ) : (
          <Skeleton className="h-[120px]" />
        )}
        {trips.data?.length ? (
          <RowSection
            title={k('saved.tabs.myPlans')}
            seeAll={{ href: '/saved?tab=my-plans', label: t('CD1309') }}
            cards={trips.data.map((tr) => <Card key={tr.id} type="plan" href={`/plan/${tr.id}`} title={tr.title} imageSrc={tr.thumbnail_url} author={p?.name ?? ''} saves={String(tr.save_count)} stops={k('saved.plan.stops', { count: tr.stop_count })} />)}
          />
        ) : trips.data ? (
          <EmptyState container="bordered" title={k('profile.trips.empty.title')} action={<IntlLink href="/map?plan=new" className="inline-flex h-[var(--control-height-md)] items-center bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse">{k('profile.trips.empty.cta')}</IntlLink>}>{k('profile.trips.empty.desc')}</EmptyState>
        ) : null}
        {badges.data ? (
          <RowSection
            title={k('badges.title')}
            subtitle={t('CD1590', { n: badges.data.earned_count })}
            seeAll={{ href: '/badges', label: t('CD1309') }}
            cards={badges.data.badges.map((b) => <BadgeTile key={b.id} b={b} />)}
          />
        ) : null}
      </div>
    </V2Page>
  )
}

// Badge names from the Copy Deck by slug (CD-1615 to CD-1626), so they show in the reader's
// language; a badge the deck does not have keeps the name the server sends (English).
const BADGE_NAME_CD: Record<string, string> = {
  'first-save': 'CD1615', 'map-maker': 'CD1616', 'k-pop-pilgrim': 'CD1617', 'social-butterfly': 'CD1618',
  'drama-chaser': 'CD1619', 'beauty-hunter': 'CD1620', 'culture-keeper': 'CD1621', 'jeju-explorer': 'CD1622',
  'seoul-insider': 'CD1623', 'taste-seeker': 'CD1624', 'leaderboard-top': 'CD1625', 'legendary-guide': 'CD1626',
}

function useBadgeName() {
  const t = useCd()
  return (b: { slug: string; name: string }) => (BADGE_NAME_CD[b.slug] ? t(BADGE_NAME_CD[b.slug]) : b.name)
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

// ── Profile (visitor, SCR-018) ───────────────────────────────────────────────

type OtherProfile = { id: number; name: string | null; avatar_url: string | null; trips_count: number; saves_count: number; badges_count: number; trips_public: boolean; badges_public: boolean }

export function ProfileVisitorScreen({ id }: { id: string }) {
  const badgeName = useBadgeName()
  const k = useCdKey()
  const phone = usePhone()
  const { toast } = useV2Shell()
  const locale = useLocale()
  const profile = useSWR<OtherProfile>(`/api/profile/${id}`, jsonFetch)
  const trips = useSWR<OtherUserTrip[]>(`/api/profile/${id}/trips`, jsonFetch)
  const badges = useSWR<OtherUserBadge[] | { badges: OtherUserBadge[] }>(`/api/profile/${id}/badges`, jsonFetch)
  const badgeList = Array.isArray(badges.data) ? badges.data : badges.data?.badges ?? []
  const p = profile.data
  if (profile.error) return <V2Page bar={{ type: 'page', title: '' }}><EmptyState title={k('profile.notFound')} /></V2Page>
  return (
    <V2Page bar={{ type: 'page', title: p?.name ?? '' }}>
      <div className="flex flex-col gap-[var(--space-10)]">
        {p ? (
          <ProfileHeader
            viewport={phone ? 'mobile' : 'desktop'}
            name={p.name || k('profile.anonymousUser')}
            avatarSrc={p.avatar_url}
            stats={[
              { number: p.trips_count, label: k('profile.header.tripsLabel') },
              { number: p.saves_count, label: k('profile.header.savesLabel') },
              { number: p.badges_count, label: k('profile.header.badgesLabel') },
            ]}
            action={<Button variant="secondary" size="md" leadingIcon={<Share2 />} onClick={() => { navigator.clipboard?.writeText(`${location.origin}/${locale}/profile/${id}`); toast({ type: 'success', message: k('profile.trips.card.shareCopiedToast') }) }}>{k('saved.myPlan.share')}</Button>}
          />
        ) : <Skeleton className="h-[120px]" />}
        {trips.data?.length ? (
          <RowSection title={k('search.results.plans')} cards={trips.data.map((tr) => <Card key={tr.id} type="plan" href={`/plan/${tr.id}`} title={tr.title} author={p?.name ?? ''} saves={String(tr.save_count)} stops={k('saved.plan.stops', { count: tr.stop_count })} />)} />
        ) : p && !p.trips_public ? <p className="type-body-base text-ui-fg-muted">{k('profile.privateTab')}</p> : null}
        {badgeList.filter((b) => b.earned).length ? (
          <RowSection title={k('badges.title')} cards={badgeList.filter((b) => b.earned).map((b) => <AchievementBadge key={b.badge_id} name={badgeName(b)} detail={k(`badges.rarity.${b.rarity}`)} icon={<Trophy />} rarity={b.rarity} />)} />
        ) : null}
      </div>
    </V2Page>
  )
}

// ── Badges (SCR-019) ─────────────────────────────────────────────────────────

export function BadgesScreen() {
  const badgeName = useBadgeName()
  const k = useCdKey()
  const t = useCd()
  const locale = useLocale()
  const { user } = useAuth()
  const { toast } = useV2Shell()
  const { data, error, isLoading, mutate } = useSWR<BadgesData>('/api/badges', jsonFetch)
  const [rarity, setRarity] = useState('all')
  const [open, setOpen] = useState<BadgeT | null>(null)
  const list = (data?.badges ?? []).filter((b) => rarity === 'all' || b.rarity === rarity)
  const pinned = (data?.badges ?? []).filter((b) => b.is_pinned).length
  return (
    <V2Page bar={{ type: 'page', title: k('badges.title') }}>
      <div className="flex flex-col gap-[var(--space-6)]">
        <header className="flex flex-col gap-[var(--space-2)]">
          <h1 className="type-display-h1 max-lg:hidden">{k('badges.title')}</h1>
          <p className="type-body-base text-ui-fg-muted">{user ? t('CD1590', { n: data?.earned_count ?? 0 }) : t('CD1591')}</p>
        </header>
        <div role="group" aria-label={k('badges.filter.ariaLabel')} className="flex flex-wrap gap-[var(--space-2)]">
          {['all', 'common', 'rare', 'epic', 'legendary'].map((r) => <Chip key={r} selected={rarity === r} onClick={() => setRarity(r)}>{k(`badges.filter.${r}`)}</Chip>)}
        </div>
        {isLoading ? <Skeleton className="h-[240px]" /> : null}
        {error ? <EmptyState type="error" container="bordered" title={k('badges.error.title')} action={<Button size="md" variant="secondary" onClick={() => mutate()}>{k('badges.error.retry')}</Button>} /> : null}
        <ul className="grid grid-cols-3 gap-[var(--space-4)] sm:grid-cols-4 lg:grid-cols-6">
          {list.map((b) => <li key={b.id} className="flex items-start justify-center"><BadgeTile b={b} onOpen={() => setOpen(b)} /></li>)}
        </ul>
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} size="sm" title={open ? badgeName(open) : ''} closeLabel={k('badges.detail.close')}
        primaryAction={open?.earned ? (
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
        ) : undefined}
      >
        {open ? (
          <div className="flex flex-col items-center gap-[var(--space-4)] pb-[var(--space-2)]">
            <AchievementBadge name={badgeName(open)} detail={k(`badges.rarity.${open.rarity}`)} icon={BADGE_ICON(open.category)} rarity={open.rarity} locked={!open.earned} />
            <dl className="grid w-full grid-cols-2 gap-[var(--space-2)] type-body-caption">
              <dt className="text-ui-fg-muted">{k('badges.detail.category')}</dt><dd>{open.category}</dd>
              <dt className="text-ui-fg-muted">{k('badges.detail.status')}</dt>
              <dd>{open.earned && open.earned_at ? k('badges.detail.earnedOn', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(open.earned_at)) }) : k('badges.badge.locked')}</dd>
              <dt className="text-ui-fg-muted">{k('badges.detail.unlockCriteria')}</dt><dd>{open.unlock_criteria.description}</dd>
            </dl>
          </div>
        ) : null}
      </Modal>
    </V2Page>
  )
}

// ── Leaderboard (SCR-020) ────────────────────────────────────────────────────

export function LeaderboardScreen() {
  const k = useCdKey()
  const t = useCd()
  const [win, setWin] = useState<LeaderboardWindow>('weekly')
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<LeaderboardData>(`/api/leaderboard?window=${win}`, jsonFetch)
  const trend = (tr: string) => (tr === 'same' ? undefined : { direction: tr as 'up' | 'down', label: k(`leaderboard.trend.${tr}`) })
  return (
    <V2Page bar={{ type: 'page', title: k('leaderboard.title') }}>
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[var(--space-6)]">
        <h1 className="type-display-h1 max-lg:hidden">{k('leaderboard.title')}</h1>
        <Tabs label={k('leaderboard.windows.ariaLabel')} width="equal" value={win} onValueChange={(v) => setWin(v as LeaderboardWindow)} tabs={(['weekly', 'rising', 'annual'] as const).map((w) => ({ id: w, label: k(`leaderboard.windows.${w}`) }))} />
        {isLoading ? <Skeleton className="h-[320px]" /> : null}
        {error ? <EmptyState type="error" container="bordered" title={k('leaderboard.error.title')} action={<Button size="md" variant="secondary" onClick={() => mutate()}>{k('leaderboard.error.retry')}</Button>} /> : null}
        {data && !data.entries.length ? (
          <EmptyState container="bordered" title={k('leaderboard.empty.title')} action={<IntlLink href="/map?plan=new" className="inline-flex h-[var(--control-height-md)] items-center bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse">{t('CD1594')}</IntlLink>}>{t('CD1593')}</EmptyState>
        ) : null}
        <ol className="border-t border-ui-border">
          {data?.entries.map((e) => (
            <LeaderboardRow
              key={e.user.id}
              rank={e.rank}
              rankLabel={k('leaderboard.rank', { rank: e.rank })}
              name={e.user.name}
              avatarSrc={e.user.avatar_url}
              detail={`${k('leaderboard.plans', { count: e.plans_count })} · ${k('profile.header.badgesCountAria', { count: e.badge_count })}`}
              score={`${e.score.toLocaleString()} ${k('leaderboard.scoreUnit')}`}
              trend={trend(e.trend)}
              href={`/profile/${e.user.id}`}
              renderLink={({ href, className, children }) => <IntlLink href={href} className={className}>{children}</IntlLink>}
            />
          ))}
          {user && data?.your_rank ? (
            <LeaderboardRow rank={data.your_rank.rank} rankLabel={k('leaderboard.yourRank.ariaLabel', { rank: data.your_rank.rank })} name="" you={t('CD1592')} score={`${data.your_rank.score.toLocaleString()} ${k('leaderboard.scoreUnit')}`} trend={trend(data.your_rank.trend)} />
          ) : null}
        </ol>
      </div>
    </V2Page>
  )
}

// ── Notifications (SCR-021) ──────────────────────────────────────────────────

const NOTIF_ICON: Record<string, React.ReactNode> = { badge_earned: <Award />, event_drop: <Calendar />, editorial_pick: <Sparkles />, deal_expiring: <Bell />, challenge_new: <Trophy />, promotion: <Bookmark /> }

export function NotificationsScreen() {
  const k = useCdKey()
  const t = useCd()
  const locale = useLocale()
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<NotificationsData>(user ? '/api/notifications' : null, jsonFetch)
  const [shown, setShown] = useState(20)
  const groups = useMemo(() => {
    const today = new Date().toDateString()
    const y = new Date(Date.now() - 864e5).toDateString()
    const g: Record<'today' | 'yesterday' | 'earlier', Notification[]> = { today: [], yesterday: [], earlier: [] }
    for (const n of (data?.notifications ?? []).slice(0, shown)) {
      const d = new Date(n.created_at).toDateString()
      g[d === today ? 'today' : d === y ? 'yesterday' : 'earlier'].push(n)
    }
    return g
  }, [data, shown])
  const time = (iso: string) => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
  if (!user) return <V2Page bar={{ type: 'page', title: k('notifications.title') }}><SignedOutPrompt title={k('notifications.title')} text={t('CD1596')} /></V2Page>
  return (
    <V2Page bar={{ type: 'page', title: k('notifications.title') }}>
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[var(--space-6)]">
        <div className="flex items-center justify-between">
          <h1 className="type-display-h1 max-lg:hidden">{k('notifications.title')}</h1>
          {data?.unread_count ? <Button variant="ghost" size="md" onClick={async () => { await send('/api/notifications/mark-all-read', 'POST').catch(() => {}); mutate() }}>{k('notifications.markAllRead')}</Button> : null}
        </div>
        {isLoading ? <Skeleton className="h-[240px]" /> : null}
        {error ? <EmptyState type="error" container="bordered" title={k('notifications.error.title')} action={<Button size="md" variant="secondary" onClick={() => mutate()}>{k('notifications.error.retry')}</Button>} /> : null}
        {data && !data.notifications.length ? <EmptyState container="bordered" title={t('CD1595')}>{t('CD1596')}</EmptyState> : null}
        {(['today', 'yesterday', 'earlier'] as const).map((g) =>
          groups[g].length ? (
            <section key={g} className="flex flex-col gap-[var(--space-2)]">
              <h2 className="type-body-label text-ui-fg-muted">{k(`notifications.groups.${g}`)}</h2>
              <ul className="border-t border-ui-border">
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
                      <IntlLink href={href} className={className} onClick={() => !n.is_read && send(`/api/notifications/${n.id}`, 'PATCH', { is_read: true }).then(() => mutate()).catch(() => {})}>{children}</IntlLink>
                    )}
                  />
                ))}
              </ul>
            </section>
          ) : null,
        )}
        {data && data.notifications.length > shown ? <Button variant="secondary" className="self-center" onClick={() => setShown((s) => s + 20)}>{k('notifications.loadMore')}</Button> : null}
      </div>
    </V2Page>
  )
}

// ── Settings (SCR-022) with Language and theme (SCR-034) ─────────────────────

export function SettingsScreen() {
  const k = useCdKey()
  const t = useCd()
  const locale = useLocale()
  const router = useRouter()
  const phone = usePhone()
  const { user } = useAuth()
  const { openLanguage, toast } = useV2Shell()
  const signOut = useV2SignOut()
  const prefs = useSWR<{ prefs: NotificationPref[] }>(user ? '/api/account/notification-prefs' : null, jsonFetch)
  const profile = useSWR<ProfileData>(user ? '/api/profile' : null, jsonFetch)
  const [theme, setThemeState] = useState<ThemeChoice>('system')
  useEffect(() => setThemeState(getThemeChoice()), [])
  const [themeSheet, setThemeSheet] = useState(false)
  const [nameSheet, setNameSheet] = useState(false)
  const [name, setName] = useState('')
  const [pwSheet, setPwSheet] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '' })
  const [deleting, setDeleting] = useState(false)
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
  const heading = 'px-[var(--space-4)] pb-[var(--space-2)] pt-[var(--space-6)] type-body-label text-ui-fg-muted'
  const langName = LANGUAGES.find((l) => l.code === locale)?.name ?? locale

  return (
    <V2Page bar={{ type: 'page', title: k('nav.settings') }}>
      <div className="mx-auto flex w-full max-w-[720px] flex-col">
        <h1 className="mb-[var(--space-2)] type-display-h1 max-lg:hidden">{k('nav.settings')}</h1>
        {user ? (
          <>
            <h2 className={heading}>{k('profile.settings.account.heading')}</h2>
            <ul className="border-t border-ui-border">
              <ListItem title={t('CD1597')} secondary={profile.data?.name} chevron onClick={() => { setName(profile.data?.name ?? ''); setNameSheet(true) }} />
              <ListItem title={k('profile.settings.changePassword')} secondary={t('CD1598')} chevron onClick={() => setPwSheet(true)} />
            </ul>
          </>
        ) : (
          <ul className="border-t border-ui-border"><ListItem title={k('nav.signIn')} secondary={t('CD1450')} chevron onClick={() => router.push('/login')} /></ul>
        )}

        <h2 className={heading}>{k('profile.settings.preferences.heading')}</h2>
        <ul className="border-t border-ui-border">
          <ListItem title={k('profile.settings.preferences.language')} trailing={<span lang={locale}>{langName}</span>} chevron onClick={openLanguage} />
          {phone ? (
            <ListItem title={k('profile.settings.preferences.appearance')} trailing={themeOptions.find((o) => o.id === theme)?.label} chevron onClick={() => setThemeSheet(true)} />
          ) : (
            <ListItem title={k('profile.settings.preferences.appearance')} trailing={<SegmentedControl label={k('profile.settings.preferences.appearance')} options={themeOptions} value={theme} onValueChange={(v) => chooseTheme(v as ThemeChoice)} className="w-[360px]" />} />
          )}
          {user ? <ListItem title={t('CD1599')} chevron onClick={() => router.push('/?interests=1')} /> : null}
        </ul>

        {user ? (
          <>
            <h2 className={heading}>{k('profile.settings.notifications.heading')}</h2>
            <ul className="border-t border-ui-border">
              {([['badge_earned', 'CD1600'], ['event_drop', 'CD1602'], ['editorial_pick', 'CD0971']] as const).map(([type, cd]) => (
                <ListItem key={type} title={t(cd)} trailing={<Toggle label={t(cd)} hideLabel checked={!optOut(type)} onCheckedChange={(on) => toggleNotif(type, on)} />} />
              ))}
            </ul>
          </>
        ) : null}

        <h2 className={heading}>{k('profile.settings.privacy.heading')}</h2>
        <ul className="border-t border-ui-border">
          <ListItem title={t('CD1603')} chevron onClick={() => router.push('/legal/cookies')} />
          {user && profile.data ? (
            <>
              <ListItem title={k('profile.settings.privacy.trips')} secondary={k('profile.settings.privacy.tripsNote')} trailing={<Toggle label={k('profile.settings.privacy.trips')} hideLabel checked={profile.data.trips_public} onCheckedChange={async (v) => { await send('/api/account/profile', 'PATCH', { trips_public: v }).catch(() => {}); profile.mutate() }} />} />
              <ListItem title={k('profile.settings.privacy.saved')} secondary={k('profile.settings.privacy.savedNote')} trailing={<Toggle label={k('profile.settings.privacy.saved')} hideLabel checked={profile.data.saved_public} onCheckedChange={async (v) => { await send('/api/account/profile', 'PATCH', { saved_public: v }).catch(() => {}); profile.mutate() }} />} />
            </>
          ) : null}
        </ul>

        {user ? (
          <div className="flex flex-col items-start gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-8)]">
            <Button variant="secondary" onClick={signOut}>{k('profile.settings.signOut')}</Button>
            <Button variant="ghost" onClick={async () => { await send('/api/account/signout-all', 'POST').catch(() => toast({ type: 'critical', message: k('profile.settings.signOutAllError') })); signOut() }}>{t('CD1604')}</Button>
            <Button variant="ghost" className="text-ui-danger" onClick={() => setDeleting(true)}>{k('profile.settings.deleteAccount')}</Button>
          </div>
        ) : null}
      </div>

      <Modal open={themeSheet} onClose={() => setThemeSheet(false)} size="sm" title={k('profile.settings.preferences.appearance')} closeLabel={k('badges.detail.close')}>
        <SegmentedControl label={k('profile.settings.preferences.appearance')} options={themeOptions} value={theme} onValueChange={(v) => { chooseTheme(v as ThemeChoice); setThemeSheet(false) }} className="mb-[var(--space-4)]" />
      </Modal>
      <Modal open={nameSheet} onClose={() => setNameSheet(false)} size="sm" title={t('CD1597')} closeLabel={k('badges.detail.close')}
        secondaryAction={<Button variant="ghost" onClick={() => setNameSheet(false)}>{k('saved.folder.cancel')}</Button>}
        primaryAction={<Button disabled={!name.trim()} onClick={async () => { await send('/api/account/profile', 'PATCH', { display_name: name.trim() }).catch(() => toast({ type: 'critical', message: k('profile.settings.identity.error') })); setNameSheet(false); profile.mutate() }}>{k('profile.settings.identity.save')}</Button>}>
        <TextInput label={k('profile.settings.identity.displayName')} showLabel value={name} onChange={(e) => setName(e.target.value)} data-autofocus />
      </Modal>
      <Modal open={pwSheet} onClose={() => setPwSheet(false)} size="sm" title={k('profile.settings.password.heading')} closeLabel={k('badges.detail.close')}
        secondaryAction={<Button variant="ghost" onClick={() => setPwSheet(false)}>{k('saved.folder.cancel')}</Button>}
        primaryAction={<Button disabled={pw.next.length < 8 || !pw.current} onClick={async () => { try { await send('/api/account/password', 'POST', { currentPassword: pw.current, newPassword: pw.next }); toast({ type: 'success', message: k('profile.settings.password.success') }); setPwSheet(false) } catch { toast({ type: 'critical', message: k('profile.settings.passwordError') }) } }}>{k('profile.settings.password.submit')}</Button>}>
        <div className="flex flex-col gap-[var(--space-4)]">
          <TextInput label={k('profile.settings.password.current')} showLabel type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} data-autofocus />
          <TextInput label={k('profile.settings.password.new')} showLabel type="password" autoComplete="new-password" help={k('profile.settings.password.hint')} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        </div>
      </Modal>
      <Dialog
        open={deleting}
        onCancel={() => setDeleting(false)}
        title={t('CD1605')}
        body={t('CD1606')}
        cancel={<Button variant="ghost" data-autofocus onClick={() => setDeleting(false)}>{k('profile.settings.deleteCancel')}</Button>}
        confirm={<Button variant="danger" onClick={async () => { try { await send('/api/account/delete', 'DELETE'); signOut() } catch { toast({ type: 'critical', message: k('profile.settings.deleteError') }) } }}>{k('profile.settings.deleteAccount')}</Button>}
      />
    </V2Page>
  )
}
