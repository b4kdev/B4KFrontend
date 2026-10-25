'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Scrim, SignInCard, useFocusTrap, usePhone, type SignInView } from '@/components/library'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { needsConsent as needsConsentFor } from '@/lib/terms-consent'
import { useLocale } from 'next-intl'
import { useCd } from './cd'
import { useV2Shell } from './V2Shell'

// Sign-in gate: the Sign-in card over the screen when a guest taps
// an action that needs an account, and the action finished after the sign-in. Email sign-in runs
// the action in place; Google and the Consent step leave the page, so the action is kept as a
// pending action (localStorage, 10 minutes, so a sign-up confirmed from the email in another tab
// finds it too) and the screen finishes it when the visitor is back; the first tab to read it takes it.

const post = (url: string, body: unknown) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

/** An action a guest started: what it was, on which item, on which page. */
export type PendingAction = { type: 'save_poi' | 'like_poi' | 'save_plan' | 'like_plan' | 'save_own_plan'; id?: string }

const PENDING_KEY = 'b4k_v2_pending_action'
const PENDING_TTL_MS = 10 * 60 * 1000
/** The current page without its locale, as next and returnTo expect: /map?poi=12. */
const here = () => (window.location.pathname.replace(/^\/[^/]+/, '') || '/') + window.location.search

export function savePendingAction(a: PendingAction) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ ...a, path: window.location.pathname, ts: Date.now() }))
  } catch {}
}

/** The pending action of this type for this page, removed once read; null when none or too old. */
export function takePendingAction(type: PendingAction['type']): PendingAction | null {
  try {
    // Older pages kept it per tab (sessionStorage); read either.
    const raw = localStorage.getItem(PENDING_KEY) ?? sessionStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as PendingAction & { path: string; ts: number }
    if (p.type !== type || p.path !== window.location.pathname) return null
    localStorage.removeItem(PENDING_KEY)
    sessionStorage.removeItem(PENDING_KEY)
    return Date.now() - p.ts < PENDING_TTL_MS ? { type: p.type, id: p.id } : null
  } catch {
    return null
  }
}

/** Runs `run(id)` once when a signed-in visitor lands back on the page with this pending action. */
export function usePendingAction(type: PendingAction['type'], signedIn: boolean, run: (id?: string) => void) {
  useEffect(() => {
    if (!signedIn) return
    const p = takePendingAction(type)
    if (p) run(p.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, type])
}

/**
 * Sign-in card state and calls (email sign in, sign up, forgot, Google), shared by the sign-in
 * page and the sign-in gate. `next` is where Google and email links come back to; `onSignedIn`
 * runs after an email sign-in; `beforeRedirect` runs before Google leaves the page.
 */
export function useSignInFlow(next: string, onSignedIn: (user: User) => void, beforeRedirect?: () => void) {
  const t = useCd()
  const [view, setView] = useState<SignInView>('providers')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [email, setEmail] = useState('')
  const [kind, setKind] = useState<'signup' | 'reset'>('signup')
  // An account set to be deleted that signs in: the date it goes, and the user to continue with.
  const [pending, setPending] = useState<{ user: User; date: string } | null>(null)
  const locale = useLocale()
  const { toast } = useV2Shell()
  // After a sign-in: an account set to be deleted gets the Pending deletion view first.
  const signedIn = async (user: User) => {
    const d = await fetch('/api/account/deletion').then((r) => (r.ok ? r.json() : null)).catch(() => null) as { deleted_at: string | null } | null
    if (!d?.deleted_at) return onSignedIn(user)
    const goes = new Date(new Date(d.deleted_at).getTime() + 30 * 24 * 3600 * 1000)
    setPending({ user, date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(goes) })
    setView('pending-deletion')
  }
  // Check email: Resend waits 60 s after each email sent.
  const [resendLeft, setResendLeft] = useState(0)
  useEffect(() => {
    if (resendLeft <= 0) return
    const id = setTimeout(() => setResendLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [resendLeft])

  const onSubmit = async (v: SignInView, values: Record<string, string>) => {
    setError(undefined)
    setEmail(values.email ?? '')
    setBusy(true)
    try {
      if (v === 'sign-in') {
        const { data, error: e } = await createSupabaseBrowserClient().auth.signInWithPassword({ email: values.email ?? '', password: values.password ?? '' })
        if (e) setError(t('CD0034'))
        else await signedIn(data.user)
      } else if (v === 'pending-deletion' && pending) {
        if (values.action === 'keep') {
          const res = await fetch('/api/account/restore', { method: 'POST' })
          if (!res.ok) return setError(t('CD0061'))
          toast({ type: 'success', message: t('CD1780') })
          setPending(null)
          onSignedIn(pending.user)
        } else {
          await createSupabaseBrowserClient().auth.signOut()
          window.location.assign('/')
        }
      } else if (v === 'sign-up') {
        if ((values.password ?? '').length < 8) return setError(t('CD0037'))
        const res = await post('/api/auth/signup', { email: values.email, password: values.password, next })
        if (res.ok) {
          setKind('signup')
          setView('check-email')
          setResendLeft(60)
        } else setError(t('CD0036'))
      } else if (v === 'forgot') {
        if (view === 'check-email' && resendLeft > 0) return
        const res = await post(kind === 'signup' && view === 'check-email' ? '/api/auth/signup/resend' : '/api/auth/forgot-password', { email: values.email ?? email, next })
        if (res.ok) {
          if (view !== 'check-email') setKind('reset')
          setView('check-email')
          setResendLeft(60)
        } else setError(t('CD0035'))
      }
    } catch {
      setError(t('CD0033'))
    } finally {
      setBusy(false)
    }
  }

  const onGoogle = async () => {
    setBusy(true)
    setError(undefined)
    beforeRedirect?.()
    // A start that fails (network, provider off) leaves the page here: stop the spinner and say so.
    const failed = await createSupabaseBrowserClient().auth
      .signInWithOAuth({ provider: 'google', options: { scopes: 'email profile', redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(next)}` } })
      .then(({ error: e }) => !!e, () => true)
    if (failed) {
      setBusy(false)
      setError(t('CD0033'))
    }
  }

  return {
    /** Runs the after-sign-in check for a user already signed in (back from Google). */
    check: signedIn,
    view,
    onViewChange: (v: SignInView) => { setError(undefined); setView(v) },
    onGoogle,
    onSubmit,
    busy,
    error,
    email,
    labels: {
      close: t('CD0021'), google: t('CD0043'), email: t('CD0031'), signIn: t('CD0051'), signUp: t('CD0052'),
      password: t('CD0046'), newPassword: t('CD0066'), confirmPassword: t('CD0058'), passwordHint: t('CD1468'),
      forgot: t('CD0039'), sendLink: t('CD0040'), checkEmailTitle: t('CD0020'),
      checkEmailBody: (e: string) => (kind === 'signup' ? t('CD0019', { email: e }) : t('CD0018', { email: e })),
      resend: resendLeft > 0 ? t('CD0049', { seconds: resendLeft }) : t('CD0048'), savePassword: t('CD1503'), newPasswordBody: t('CD1501'), back: t('CD1493'), guest: t('CD0029'),
      or: t('CD1376'), tabs: t('CD0054'), backToSignIn: t('CD1498'),
      signInTitle: t('CD1490'), signInBody: t('CD1491'), signUpTitle: t('CD1494'), signUpBody: t('CD1495'),
      forgotTitle: t('CD0042'), forgotBody: t('CD1497'), emailField: t('CD0921'),
      passwordPlaceholder: t('CD1492'), newPasswordPlaceholder: t('CD0978'), confirmPlaceholder: t('CD1502'),
      pendingTitle: t('CD1776'), pendingBody: pending ? t('CD1777', { date: pending.date }) : undefined,
      keepAccount: t('CD1778'), continueDeletion: t('CD1779'),
    },
  }
}


export type GateRequest = {
  /** Card title, e.g. "Sign in to save places". */
  title: string
  /** Save plan: the line that the plan is kept. */
  draftNotice?: string
  /** What to finish after the sign-in (also kept for Google and the Consent step). */
  pending?: PendingAction
  /** Finishes the action in place after an email sign-in. */
  run: () => void
}

/** The gate overlay: Modal-style card on desktop, bottom sheet style on phones. */
export function SignInGate({ request, onClose, onConsent }: { request: GateRequest | null; onClose: () => void; onConsent: (next: string) => void }) {
  const phone = usePhone()
  const ref = useFocusTrap<HTMLDivElement>(!!request, onClose)
  const flow = useSignInFlow(
    typeof window === 'undefined' ? '/' : here(),
    (user: User) => {
      const r = request
      onClose()
      if (!r) return
      if (needsConsentFor(user)) {
        if (r.pending) savePendingAction(r.pending)
        onConsent(here())
      } else r.run()
    },
    () => { if (request?.pending) savePendingAction(request.pending) },
  )
  if (!request) return null
  return (
    <>
      <Scrim onClick={onClose} className="z-50" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={request.title}
        className={phone
          ? 'fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-ui-bg-elevated pb-[env(safe-area-inset-bottom)]'
          : 'fixed left-1/2 top-1/2 z-50 w-[calc(100%-var(--space-8))] max-w-[420px] -translate-x-1/2 -translate-y-1/2'}
      >
        <SignInCard {...flow} title={request.title} draftNotice={request.draftNotice} onClose={onClose} onGuest={onClose} />
      </div>
    </>
  )
}
