'use client'

import { createContext, Suspense, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from '@/i18n/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { getConsent, setConsent } from '@/lib/consent'
import { v2Area } from '@/lib/v2-live'
import { cn } from '@/lib/cn'
import { barePath, lastExplore, markExploreReturn, scrollPageTop, useExploreReturnListener } from '@/lib/explore-return'
import { applyTheme, getStoredTheme } from '@/lib/theme'
import {
  AccountMenu,
  CookieBanner,
  Drawer,
  Header,
  NavigationBar,
  NavigationRail,
  SearchPill,
  ImageMissingLabel,
  SkipLink,
  Toast,
  type Destination,
  type ShellLabels,
  type ShellUser,
} from '@/components/library'
import { useCd } from './cd'
import { V2DraftMigration } from './V2Gates'
import V2QuickPlan from './V2QuickPlan'
import { LanguageMenu, LanguageSheet } from './V2Settings'
import { SignInGate, type GateRequest } from './V2SignInGate'
import { V2HeaderSearch } from './V2Search'
import { rememberPath } from '@/lib/place-source'
import { SESSION_EXPIRED_EVENT } from '@/lib/session-expired'

// Shell of the preview (original layout with the Header, the shell layout still open): desktop Header + rail,
// phones Top app bar (per page) + Navigation bar + Drawer. Quick plan, Drawer and the language
// sheet are opened from anywhere through useV2Shell().

type ShellCtx = {
  openDrawer: () => void
  openQuickPlan: () => void
  openLanguage: () => void
  user: ShellUser
  labels: ShellLabels
  /** action: one text button (Undo); the toast then stays 8 s instead of 4. */
  toast: (t: { type?: 'info' | 'success' | 'warning' | 'critical'; message: string; action?: { label: string; onClick: () => void } }) => void
  /** Runs `run` now when signed in; a guest gets the sign-in gate and `run` after the sign-in. */
  requireSignIn: (r: GateRequest) => void
  /** Phones: height of the open toast (0 when none), so map controls on its line move above it. */
  toastHeight: number
  /** While an account set to be deleted decides (Pending deletion), the chrome shows it signed out. */
  holdAccount: (on: boolean) => void
  /** Phones: the Navigation bar floats over the page (map pages), so page content needs room under it. */
  navOverlays: boolean
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
  // Home's See all lists belong to Home.
  if (/^\/[^/]+(\/v2)?\/explore\/(trending|popular-plans)(\/|$)/.test(path)) return 'home'
  if (seg === 'explore') return 'explore'
  if (seg === 'saved') return 'saved'
  return null
}

/** Height covered at the bottom of the screen by the highest part marked data-toast-floor, or null. */
function useToastFloor() {
  const [floor, setFloor] = useState<number | null>(null)
  useEffect(() => {
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const tops = Array.from(document.querySelectorAll('[data-toast-floor]')).map((e) => e.getBoundingClientRect().top)
        setFloor(tops.length ? Math.max(0, Math.round(window.innerHeight - Math.min(...tops))) : null)
      })
    }
    // Height changes (snaps, drags, the sheet's height transition) and parts coming and going.
    const sizes = new ResizeObserver(measure)
    const watch = () => {
      sizes.disconnect()
      document.querySelectorAll('[data-toast-floor]').forEach((e) => sizes.observe(e))
      measure()
    }
    const parts = new MutationObserver(watch)
    parts.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-toast-floor'] })
    window.addEventListener('resize', measure)
    watch()
    return () => {
      cancelAnimationFrame(frame)
      sizes.disconnect()
      parts.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])
  return floor
}

export default function V2Shell({ children }: { children: ReactNode }) {
  const t = useCd()
  const locale = useLocale()
  const pathname = usePathname() ?? ''
  // The screen before the current one, for where a place in a plan was found.
  useEffect(() => { rememberPath(pathname) }, [pathname])
  // The root layout sets <html lang> on the first load only; a language switch in the page keeps the
  // same document, so the page language is set here too (screen readers read by it).
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  const { user: authUser } = useAuth()
  const [drawer, setDrawer] = useState(false)
  const [quick, setQuick] = useState(false)
  const [language, setLanguage] = useState(false)
  const [cookie, setCookie] = useState<string | null>('unknown')
  const [online, setOnline] = useState(true)
  const [gate, setGate] = useState<GateRequest | null>(null)
  // The server answered a signed-in action with 401 (the session ended): sign in over the page, then
  // carry on there (lib/session-expired). An open gate stays as it is.
  useEffect(() => {
    const onExpired = () => setGate((g) => g ?? { title: t('CD0054'), run: () => {} })
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [t])
  const [held, setHeld] = useState(false)
  const router = useRouter()
  const signOut = useV2SignOut()
  const [toastMsg, setToastMsg] = useState<{ type?: 'info' | 'success' | 'warning' | 'critical'; message: string; action?: { label: string; onClick: () => void } } | null>(null)

  // A Page not found render can replace the document after the boot script ran: set the theme again.
  useEffect(() => {
    if (!document.documentElement.getAttribute('data-theme')) applyTheme(getStoredTheme())
  }, [])
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
  // Phones: a toast sits 12 above whatever is at the bottom. Parts marked data-toast-floor (the map
  // sheet as it moves, a full-screen flow's action bar) report their top edge; without one it is the
  // Navigation bar, or the screen's bottom edge in a flow without the bar.
  const floor = useToastFloor()

  useEffect(() => {
    if (!toastMsg || toastMsg.type === 'critical') return
    // A toast with an action stays longer, so the action can be reached in time.
    const id = setTimeout(() => setToastMsg(null), toastMsg.action ? 8000 : 4000)
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
  // During the Consent step the person counts as signed out until Continue (Back signs them out);
  // so do accounts set to be deleted until they keep the account, as drawn.
  const user: ShellUser = authUser && !held && v2Area(pathname) !== 'consent' ? { name: meta?.full_name ?? meta?.name ?? authUser.email?.split('@')[0] ?? '', avatarSrc: meta?.avatar_url ?? null, unread: unreadCount } : null
  const active = activeFrom(pathname)
  // Explore in the nav returns to the last Explore page and spot; tapped on that page, back to its top.
  useExploreReturnListener()
  const [exploreHref, setExploreHref] = useState('/explore')
  useEffect(() => { setExploreHref(lastExplore()?.path ?? '/explore') }, [pathname])
  const navHrefs = useMemo(() => ({ explore: exploreHref }), [exploreHref])
  const onNavigate = (id: Destination, e: MouseEvent<HTMLAnchorElement>) => {
    if (id !== 'explore') return
    if (barePath(pathname) === exploreHref) {
      e.preventDefault()
      scrollPageTop()
    } else markExploreReturn()
  }
  const onMap = ['map', 'plan', 'place'].includes(v2Area(pathname))
  // Sign-in, reset and consent are full-screen flows on phones: no Navigation bar.
  const inFlow = ['login', 'auth', 'consent'].includes(v2Area(pathname))
  // Full-screen flows draw their own Flow bar (logo and close) instead of the Header and rails.
  const fullFlow = /\/saved\/plan\/?$/.test(pathname)
  const toastFloor = floor !== null ? `${floor}px` : inFlow || fullFlow ? 'env(safe-area-inset-bottom)' : 'calc(var(--fab-size) + env(safe-area-inset-bottom))'
  // The live consent: updates GA4 consent mode and lets Analytics load Clarity.
  const choose = (v: 'accepted' | 'declined') => {
    try {
      setConsent(v)
    } catch {}
    setCookie(v)
  }
  const toastBox = useRef<HTMLDivElement>(null)
  const [toastHeight, setToastHeight] = useState(0)
  useEffect(() => {
    const el = toastBox.current
    if (!el) return
    const sizes = new ResizeObserver(() => setToastHeight(window.matchMedia('(min-width: 1024px)').matches ? 0 : el.offsetHeight))
    sizes.observe(el)
    return () => sizes.disconnect()
  }, [])
  // Desktop: the page scrolls in the content column beside the rail, not the window. A wheel over the
  // header or the rail, and the scroll keys while nothing is focused, scroll that column too, as they
  // would scroll a window.
  const page = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)')
    // After a click in the column the browser scrolls it with the keys itself; only fill in otherwise.
    let clickedIn = false
    const onDown = (e: PointerEvent) => { clickedIn = !!page.current?.contains(e.target as Node) }
    const onWheel = (e: WheelEvent) => {
      const box = page.current
      if (!wide.matches || !box || e.ctrlKey || box.contains(e.target as Node) || (e.target as Element).closest?.('[role="dialog"], [role="menu"]')) return
      box.scrollBy({ top: e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * box.clientHeight : e.deltaY })
    }
    const onKey = (e: KeyboardEvent) => {
      const box = page.current
      const at = document.activeElement
      if (!wide.matches || !box || clickedIn || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || (at && at !== document.body && !(at as HTMLElement).closest?.('header, nav'))) return
      if (at && at !== document.body && (e.key === ' ' || e.key.startsWith('Arrow'))) return
      if (document.querySelector('[role="dialog"]')) return
      const step = box.clientHeight * 0.875
      const by: Record<string, number> = { PageDown: step, PageUp: -step, ' ': e.shiftKey ? -step : step, ArrowDown: 40, ArrowUp: -40 }
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      if (e.key === 'Home') box.scrollTo({ top: 0, behavior })
      else if (e.key === 'End') box.scrollTo({ top: box.scrollHeight, behavior })
      else if (e.key in by) box.scrollBy({ top: by[e.key], behavior })
      else return
      e.preventDefault()
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown, true)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown, true)
    }
  }, [])
  const ctx: ShellCtx = {
    openDrawer: () => setDrawer(true),
    openQuickPlan: () => setQuick(true),
    openLanguage: () => setLanguage(true),
    user,
    labels,
    toast: setToastMsg,
    requireSignIn: (r) => (authUser ? r.run() : setGate(r)),
    toastHeight,
    holdAccount: setHeld,
    navOverlays: onMap && !inFlow && !fullFlow,
  }
  const LANG_NAMES: Record<string, string> = { en: 'English', ko: '한국어', ja: '日本語', 'zh-TW': '繁體中文', 'pt-BR': 'Português (BR)' }

  return (
    <Ctx.Provider value={ctx}>
      <ImageMissingLabel.Provider value={t('CD1680')}>
      <SkipLink>{t('CD1377')}</SkipLink>
      <div className="b4k-v2 flex min-h-dvh flex-col bg-ui-bg text-ui-fg type-body-base lg:h-dvh lg:overflow-hidden">
        <Header
          className={cn('max-lg:hidden', fullFlow && 'lg:hidden')}
          labels={labels}
          signedIn={!!user}
          search={<Suspense fallback={<SearchPill label={labels.search} href="/search" className="h-[var(--control-height-xl)] rounded-sq-lg pl-[var(--space-2)]" />}><V2HeaderSearch label={labels.search} /></Suspense>}
          onLanguage={() => setLanguage(true)}
          languageMenu={<LanguageMenu />}
          helpHref="/help"
        />
        <div className="flex min-h-0 flex-1">
          <NavigationRail
            className={cn('max-lg:hidden', fullFlow && 'lg:hidden')}
            active={active}
            labels={labels}
            user={user}
            onQuickPlan={() => setQuick(true)}
            hrefs={navHrefs}
            onNavigate={onNavigate}
            accountMenu={<AccountMenu labels={labels} user={user} onSignOut={signOut} links={{ profile: `/${locale}/profile`, settings: `/${locale}/settings`, signIn: `/${locale}/login` }} />}
          />
          <div ref={page} data-page-scroll className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-y-auto"><PageSlot>{children}</PageSlot></div>
        </div>
        {inFlow || fullFlow ? null : <NavigationBar className={cn(onMap ? 'fixed inset-x-0 bottom-0 z-[45]' : 'sticky bottom-0 z-30', 'lg:hidden')} active={active} labels={labels} hrefs={navHrefs} onNavigate={onNavigate} onQuickPlan={() => setQuick(true)} />}
      </div>
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        labels={labels}
        user={user}
        onQuickPlan={() => setQuick(true)}
        language={{ current: LANG_NAMES[locale] ?? locale, onOpen: () => { setDrawer(false); setLanguage(true) } }}
        links={{ notifications: '/notifications', settings: '/settings', help: '/help', legal: '/legal/terms', profile: '/profile', signIn: '/login' }}
        legalLinks={[{ label: t('CD0811'), href: '/legal/privacy' }, { label: t('CD0812'), href: '/legal/terms' }, { label: t('CD0810'), href: '/legal/cookies' }]}
        unreadLabel={(n) => t('CD0840', { count: n })}
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
          // Phones: 12 above the Navigation bar; desktop: 12 above the page bottom, centred on the content beside the Navigation rail.
          className={cn(!inFlow && 'max-lg:bottom-[calc(var(--fab-size)+var(--space-3))]', !fullFlow && 'lg:left-[calc(50%+var(--layout-nav-rail)/2)] lg:max-w-[min(var(--container-md),calc(100%-var(--layout-nav-rail)-var(--space-3)*2))]')}
        />
      ) : null}
      {/* Phones: the offline notice and the toasts rise above the floor by a transform, so a sheet moving under them does not move the page. */}
      {/* Offline notice: bottom center on every screen (above the Navigation bar on phones), as drawn. Desktop:
          centred on the content beside the rail; on the map centred on the window. */}
      <div aria-live="polite" style={{ '--toast-floor': toastFloor } as CSSProperties} className={cn('pointer-events-none fixed inset-x-0 bottom-[var(--space-3)] -translate-y-[var(--toast-floor)] lg:translate-y-0 z-50 flex justify-center px-[var(--space-4)] lg:bottom-[var(--space-6)] lg:px-0', fullFlow || onMap ? null : 'lg:pl-[var(--layout-nav-rail)]')}>
        {!online ? <Toast type="warning" message={onMap ? t('CD0120') : t('CD1865')} className="pointer-events-auto" /> : null}
      </div>
      {/* Toasts: on phones 12 above whatever is at the bottom (above the offline notice while offline);
          desktop bottom center, 24 up, centred on the content beside the rail (on the map beside the
          left panel, so its plan bar and the zoom buttons stay clear), above the cookie banner and the
          offline notice while they show. A timed toast has no close button in the design: it leaves on
          its own after 4 s. */}
      <div aria-live="polite" style={{ '--toast-floor': toastFloor } as CSSProperties} className={cn('pointer-events-none fixed inset-x-0 bottom-[var(--space-3)] -translate-y-[var(--toast-floor)] lg:translate-y-0 z-[60] flex flex-col items-center gap-[var(--space-2)] px-[var(--space-4)] lg:bottom-[var(--space-6)] lg:px-0', fullFlow ? null : onMap ? 'lg:pl-[calc(var(--layout-nav-rail)+var(--layout-left-panel))]' : 'lg:pl-[var(--layout-nav-rail)]', !online && 'max-lg:bottom-[calc(var(--space-3)+var(--space-16))] lg:bottom-[calc(var(--space-6)+var(--space-16))]', cookie === null && 'lg:bottom-[var(--space-24)]')}>
        <div ref={toastBox} className="flex w-full flex-col items-center">
        {toastMsg ? (
          <Toast
            type={toastMsg.type}
            message={toastMsg.message}
            action={toastMsg.action ? { label: toastMsg.action.label, onClick: () => { const run = toastMsg.action?.onClick; setToastMsg(null); run?.() } } : undefined}
            // A Critical toast stays until closed, so it keeps its close button.
            {...(toastMsg.type === 'critical' ? { onClose: () => setToastMsg(null), closeLabel: t('CD0082') } : {})}
            className="pointer-events-auto w-[360px] max-w-full"
          />
        ) : null}
        </div>
      </div>
      </ImageMissingLabel.Provider>
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

// The page sits under a plain component instead of directly under the wrapper <div>. With the
// React copy bundled in Next 15, a page whose code arrived after the shell's (parallel loads, slow
// networks) made hydration lose its place under a host element and re-render the whole page on
// the client. A Suspense boundary also avoids it but turns not-found pages into 200s.
function PageSlot({ children }: { children: ReactNode }) {
  return <>{children}</>
}
