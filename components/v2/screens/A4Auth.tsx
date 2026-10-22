'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { ConsentStep, EmptyState, Modal, Scrim, SignInCard, Spinner, usePhone, type SignInView } from '@/components/library'
import { termsSections } from '@/content/legal/terms-content'
import { privacyPolicySections } from '@/content/legal/privacy-policy-content'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { afterSignIn } from '@/lib/terms-consent'
import { safePath } from '@/lib/safe-path'
import { track } from '@/lib/analytics'
import { GAMIFICATION } from '@/lib/features'
import { useCd, useCdKey } from '../cd'
import { V2Page } from '../V2Page'
import { useV2Shell } from '../V2Shell'
import { useSignInFlow } from '../V2SignInGate'

// A4 auth screens (UI-82, PD-04, PD-12, PD-37): Sign in (SCR-023), Reset password (SCR-024),
// Consent step (SCR-025). Same auth calls as the live AuthForm.

const post = (url: string, body: unknown) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })


export function LoginScreen() {
  const t = useCd()
  const router = useRouter()
  const next = safePath(useSearchParams()?.get('next'))
  const flow = useSignInFlow(next, (user) => router.push(afterSignIn(user, next)))
  return (
    <V2Page bar={{ type: 'page', title: t('CD0050') }} noFooter="phone" className="flex items-center justify-center">
      {/* The drawn value line names leaderboards and badges: shown only while those are on. */}
      <SignInCard {...flow} title={t('CD0054')} subtitle={GAMIFICATION ? t('CD0056') : undefined} />
    </V2Page>
  )
}

export function ResetPasswordScreen() {
  const t = useCd()
  const router = useRouter()
  const { toast } = useV2Shell()
  // The reset link carries the page the person asked from (same site only).
  const next = safePath(useSearchParams()?.get('next'))
  // An expired or missing link: the card asks for the email to send a new one (Forgot view).
  const flow = useSignInFlow(next, () => {})
  const [token, setToken] = useState<string | null | undefined>(undefined)
  const [expired, setExpired] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [confirmError, setConfirmError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.slice(1) || window.location.search)
    const tk = p.get('access_token') ?? p.get('code')
    setToken(tk)
    if (!tk) setExpired(true)
  }, [])
  const save = async (_v: SignInView, values: Record<string, string>) => {
    const pw = values.password ?? ''
    setError(undefined)
    setConfirmError(undefined)
    if (pw.length < 8) return setError(t('CD0063'))
    if (pw !== (values.confirm ?? '')) return setConfirmError(t('CD0062'))
    if (!token) return setExpired(true)
    setBusy(true)
    const res = await post('/api/auth/reset-password', { token, password: pw }).catch(() => null)
    setBusy(false)
    if (!res?.ok) {
      const body = await res?.json().catch(() => ({}))
      return body?.code === 'expired' ? setExpired(true) : setError(t('CD0061'))
    }
    toast({ type: 'success', message: t('CD0072') })
    router.push(next)
  }
  const toSignIn = () => router.push(next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`)
  return (
    <V2Page bar={{ type: 'page', title: t('CD1500') }} noFooter="phone" className="flex items-center justify-center">
      {expired ? (
        <SignInCard
          {...flow}
          view={flow.view === 'providers' ? 'forgot' : flow.view}
          title={t('CD0042')}
          error={flow.error ?? (flow.view === 'providers' ? t('CD0060') : undefined)}
          onViewChange={(v) => (v === 'sign-in' || v === 'providers' ? toSignIn() : flow.onViewChange(v))}
        />
      ) : token === undefined ? null : (
        <SignInCard view="new-password" onViewChange={() => {}} title={t('CD1500')} onGoogle={() => {}} onSubmit={save} busy={busy} error={error} confirmError={confirmError} labels={flow.labels} />
      )}
    </V2Page>
  )
}

export function ConsentScreen() {
  const t = useCd()
  const router = useRouter()
  const next = safePath(useSearchParams()?.get('next'))
  const { toast } = useV2Shell()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  // View opens the document over the step (sheet on phones) so the person never leaves it.
  const [doc, setDoc] = useState<'terms' | 'privacy' | null>(null)
  const phone = usePhone()
  const cancel = async () => {
    await createSupabaseBrowserClient().auth.signOut()
    router.push(next)
  }
  return (
    <V2Page bar={{ type: 'none' }} noFooter className="flex items-center justify-center">
      {/* The step sits over the screen: centered over the scrim on desktop, a sheet from the bottom on phones. */}
      <Scrim kind="blocking" className="z-40" />
      <div className={phone ? 'fixed inset-x-0 bottom-0 z-40 max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-ui-bg-elevated pb-[env(safe-area-inset-bottom)]' : 'fixed left-1/2 top-1/2 z-40 max-h-[90dvh] w-[calc(100%-var(--space-8))] max-w-[480px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto'}>
      <ConsentStep
        title={t('CD1504')}
        items={[
          { id: 'age', label: t('CD1464'), required: true },
          { id: 'terms', label: t('CD0812'), required: true, viewHref: '/legal/terms' },
          { id: 'privacy', label: t('CD0811'), required: true, viewHref: '/legal/privacy' },
        ]}
        checked={checked}
        onCheckedChange={setChecked}
        onView={(i) => setDoc(i.id === 'terms' ? 'terms' : 'privacy')}
        onContinue={async () => {
          const res = await post('/api/account/consent', { age: !!checked.age, marketing: false }).catch(() => null)
          if (!res?.ok) return toast({ type: 'critical', message: t('CD0061') })
          // Pick up the new consent record in the session before moving on.
          await createSupabaseBrowserClient().auth.refreshSession()
          router.push(next)
        }}
        onCancel={cancel}
        subtitle={t('CD1505')}
        labels={{ agreeAll: t('CD1506'), required: t('CD1507'), optional: t('CD1509'), view: t('CD0271'), continue: t('CD0409'), cancel: t('CD0505'), back: t('CD0121'), legend: t('CD1505') }}
        footnote={t('CD1511')}
      />
      </div>
      <Modal open={!!doc} onClose={() => setDoc(null)} size="lg" title={doc === 'terms' ? t('CD0812') : t('CD0811')} closeLabel={t('CD0758')}>
        {(doc === 'terms' ? termsSections : privacyPolicySections).map((sec) => (
          <section key={sec.id} className="flex flex-col gap-[var(--space-2)] [&_a]:underline [&_li]:ml-[var(--space-4)] [&_li]:list-disc [&_table]:w-full">
            <h2 className="type-title-card">{sec.heading}</h2>
            <div className="type-body-base text-ui-fg-muted">{sec.body}</div>
          </section>
        ))}
      </Modal>
    </V2Page>
  )
}

// ── Sign-in landing (/auth/callback): OAuth code and email link, no screen of its own ──

/** Exchanges the OAuth code or email token for a session, then returns to returnTo (same origin only). */
export function AuthCallbackScreen() {
  const k = useCdKey()
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const safe = safePath(searchParams.get('returnTo'))

    async function completeAuth() {
      const supabase = createSupabaseBrowserClient()
      const code = searchParams.get('code')
      const tokenHash = searchParams.get('token_hash')
      const otpType = searchParams.get('type')

      let error = null
      let user = null
      if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code)
        error = result.error
        user = result.data.session?.user ?? null
      } else if (tokenHash && otpType) {
        // Email confirmation / magic link: Supabase's older non-PKCE param scheme
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType as any })
        error = result.error
        user = result.data.session?.user ?? null
      }

      if (error) {
        setFailed(true)
        return
      }

      // 'recovery' only verifies password-reset ownership, not a sign-in. is_new_user is a
      // created_at / last_sign_in_at proximity heuristic (Supabase has no "just created" flag).
      if (user && otpType !== 'recovery') {
        const createdAt = new Date(user.created_at).getTime()
        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : createdAt
        track('sign_in', {
          method: user.app_metadata?.provider ?? 'email',
          is_new_user: lastSignIn - createdAt < 10_000,
          locale,
          screen_id: 'AG_01',
        })
      }

      router.replace(otpType === 'recovery' ? safe : afterSignIn(user, safe))
    }

    completeAuth()
  }, [searchParams, router, locale])

  return (
    <V2Page bar={{ type: 'none' }} noFooter className="flex items-center justify-center">
      <div role="status" aria-live="polite">
        <EmptyState
          type={failed ? 'error' : 'empty'}
          icon={failed ? undefined : <Spinner size="lg" />}
          title={failed ? k('auth.callback.error') : k('auth.callback.verifying')}
        >
          {failed ? k('auth.callback.errorRetry') : k('auth.callback.redirecting')}
        </EmptyState>
      </div>
    </V2Page>
  )
}
