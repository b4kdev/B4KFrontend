'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from '@/i18n/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { getConsent, setConsent } from '@/lib/consent'
import { v2Area } from '@/lib/v2-live'
import {
  CookieBanner,
  Drawer,
  Header,
  NavigationBar,
  NavigationRail,
  SearchPill,
  SkipLink,
  Toast,
  type Destination,
  type ShellLabels,
  type ShellUser,
} from '@/components/library'
import { useCd } from './cd'
import { V2DraftMigration } from './V2Gates'
import V2QuickPlan from './V2QuickPlan'
import { LanguageSheet } from './V2Settings'
import { SignInGate, type GateRequest } from './V2SignInGate'

// Shell of the preview (original layout with the Header, UI-101 still open): desktop Header + rail,
// phones Top app bar (per page) + Navigation bar + Drawer. Quick plan, Drawer and the language
// sheet are opened from anywhere through useV2Shell().

type ShellCtx = {
  openDrawer: () => void
  openQuickPlan: () => void
  openLanguage: () => void
  user: ShellUser
  labels: ShellLabels
  toast: (t: { type?: 'info' | 'success' | 'warning' | 'critical'; message: string }) => void
  /** Runs `run` now when signed in; a guest gets the sign-in gate and `run` after the sign-in. */
  requireSignIn: (r: GateRequest) => void
}

/** SWR key of the unread notification count (shared with the Notifications screen). */
export const UNREAD_KEY = '/api/notifications/unread-count'

const Ctx = createContext<ShellCtx | null>(null)
export const useV2Shell = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useV2Shell outside V2Shell')
  return c
}

function activeFrom(path: string): Destination | null {
  const seg = v2Area(path)
  if (seg === '') return 'home'
  if (seg === 'map' || seg === 'plan' || seg === 'place') return 'map'
  if (seg === 'explore') return 'explore'
  if (seg === 'saved') return 'saved'
  return null
}

export default function V2Shell({ children }: { children: ReactNode }) {
  const t = useCd()
  const locale = useLocale()
  const pathname = usePathname() ?? ''
  const { user: authUser } = useAuth()
  const [drawer, setDrawer] = useState(false)
  const [quick, setQuick] = useState(false)
  const [language, setLanguage] = useState(false)
  const [cookie, setCookie] = useState<string | null>('unknown')
  const [online, setOnline] = useState(true)
  const [gate, setGate] = useState<GateRequest | null>(null)
  const router = useRouter()
  const [toastMsg, setToastMsg] = useState<{ type?: 'info' | 'success' | 'warning' | 'critical'; message: string } | null>(null)

  useEffect(() => {
    try {
      setCookie(getConsent())
    } catch {
      setCookie('declined')
    }
    const on = () => setOnline(navigator.onLine)
    on()
    window.addEventListener('online', on)
    window.addEventListener('offline', on)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', on)
    }
  }, [])
  useEffect(() => {
    if (!toastMsg || toastMsg.type === 'critical') return
    const id = setTimeout(() => setToastMsg(null), 4000)
    return () => clearTimeout(id)
  }, [toastMsg])

  // Unread notifications for the rail bell and the Drawer; Notifications refreshes it after Mark all read.
  const unread = useSWR<{ count: number }>(authUser ? UNREAD_KEY : null, (u: string) => fetch(u).then((r) => (r.ok ? r.json() : { count: 0 })))
  const unreadCount = unread.data?.count ?? 0
  const labels: ShellLabels = useMemo(
    () => ({
      main: t('CD0814'), home: t('CD0807'), map: t('CD0815'), explore: t('CD0804'), saved: t('CD0822'),
      quickPlan: t('CD1361'), notifications: t('CD0818'), account: t('CD0821'), signIn: t('CD0825'),
      search: t('CD1383'), language: t('CD0808'), help: t('CD0806'), menu: t('CD0817'), close: t('CD0816'),
      back: t('CD0121'), settings: t('CD0823'), legal: t('CD0809'), viewProfile: t('CD1447'), signOut: t('CD1015'),
      signInHint: t('CD1450'), quickPlanHint: t('CD1448'), homeLink: t('CD0813'),
      notificationsUnread: `${t('CD0818')}, ${t('CD0840', { count: unreadCount })}`,
    }),
    [t, unreadCount],
  )
  const meta = authUser?.user_metadata as { full_name?: string; name?: string; avatar_url?: string } | undefined
  const user: ShellUser = authUser ? { name: meta?.full_name ?? meta?.name ?? authUser.email?.split('@')[0] ?? '', avatarSrc: meta?.avatar_url ?? null, unread: unreadCount } : null
  const active = activeFrom(pathname)
  const onMap = ['map', 'plan', 'place'].includes(v2Area(pathname))
  // The live consent (DEC-16): updates GA4 consent mode and lets Analytics load Clarity.
  const choose = (v: 'accepted' | 'declined') => {
    try {
      setConsent(v)
    } catch {}
    setCookie(v)
  }
  const ctx: ShellCtx = {
    openDrawer: () => setDrawer(true),
    openQuickPlan: () => setQuick(true),
    openLanguage: () => setLanguage(true),
    user,
    labels,
    toast: setToastMsg,
    requireSignIn: (r) => (authUser ? r.run() : setGate(r)),
  }
  const LANG_NAMES: Record<string, string> = { en: 'English', ko: '한국어', ja: '日本語', 'zh-TW': '繁體中文', 'pt-BR': 'Português (Brasil)' }

  return (
    <Ctx.Provider value={ctx}>
      <SkipLink>{t('CD1377')}</SkipLink>
      <div className="b4k-v2 flex min-h-dvh flex-col bg-ui-bg text-ui-fg type-body-base lg:h-dvh lg:overflow-hidden">
        <Header
          className="max-lg:hidden"
          labels={labels}
          signedIn={!!user}
          search={<SearchPill label={labels.search} href="/search" />}
          onLanguage={() => setLanguage(true)}
          helpHref="/help"
        />
        <div className="flex min-h-0 flex-1">
          <NavigationRail className="max-lg:hidden" active={active} labels={labels} user={user} onQuickPlan={() => setQuick(true)} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-y-auto">{children}</div>
        </div>
        {onMap ? null : <NavigationBar className="sticky bottom-0 z-30 lg:hidden" active={active} labels={labels} onQuickPlan={() => setQuick(true)} />}
      </div>
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        labels={labels}
        user={user}
        onQuickPlan={() => setQuick(true)}
        language={{ current: LANG_NAMES[locale] ?? locale, onOpen: () => { setDrawer(false); setLanguage(true) } }}
        links={{ notifications: '/notifications', settings: '/settings', help: '/help', legal: '/legal/terms', profile: '/profile', signIn: '/login' }}
      />
      <V2QuickPlan open={quick} onClose={() => setQuick(false)} />
      <V2DraftMigration />
      <SignInGate request={gate} onClose={() => setGate(null)} onConsent={(next) => router.push(`/consent?next=${encodeURIComponent(next)}`)} />
      <LanguageSheet open={language} onClose={() => setLanguage(false)} />
      {cookie === null ? (
        <CookieBanner
          label={t('CD0131')}
          message={t('CD0130')}
          learnMore={{ href: '/legal/cookies', label: t('CD0129') }}
          acceptLabel={t('CD0126')}
          declineLabel={t('CD0127')}
          onAccept={() => choose('accepted')}
          onDecline={() => choose('declined')}
        />
      ) : null}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--fab-size)+var(--space-4))] z-50 flex flex-col items-center gap-[var(--space-2)] px-[var(--space-4)] lg:bottom-auto lg:right-[var(--space-6)] lg:top-[calc(var(--layout-header-height)+var(--space-4))] lg:items-end">
        {!online ? <Toast type="warning" message={onMap ? t('CD0120') : t('CD0119')} className="pointer-events-auto" /> : null}
        {toastMsg ? <Toast type={toastMsg.type} message={toastMsg.message} onClose={() => setToastMsg(null)} closeLabel={labels.close} className="pointer-events-auto" /> : null}
      </div>
    </Ctx.Provider>
  )
}

/** Sign out for the preview (same Supabase session as the live site). */
export function useV2SignOut() {
  return async () => {
    await createSupabaseBrowserClient().auth.signOut()
    // Home of the current locale.
    window.location.assign(window.location.pathname.replace(/^(\/[^/]+).*/, '$1'))
  }
}
