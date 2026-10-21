'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { ConsentStep, EmptyState, SignInCard, Spinner, type SignInView } from '@/components/library'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { afterSignIn } from '@/lib/terms-consent'
import { safePath } from '@/lib/safe-path'
import { track } from '@/lib/analytics'
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
    <V2Page bar={{ type: 'page', title: t('CD0050') }} className="flex items-center justify-center">
      <SignInCard {...flow} title={t('CD0054')} />
    </V2Page>
  )
}

export function ResetPasswordScreen() {
  const t = useCd()
  const router = useRouter()
  const { toast } = useV2Shell()
  // The reset link carries the page the person asked from (same site only).
  const next = safePath(useSearchParams()?.get('next'))
  const { labels } = useSignInFlow(next, () => {})
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.slice(1) || window.location.search)
    setToken(p.get('access_token') ?? p.get('code'))
  }, [])
  const save = async (_v: SignInView, values: Record<string, string>) => {
    const pw = values.password ?? ''
    if (pw.length < 8) return setError(t('CD0063'))
    if (pw !== (values.confirm ?? '')) return setError(t('CD0062'))
    if (!token) return setError(t('CD0060'))
    setError(undefined)
    setBusy(true)
    const res = await post('/api/auth/reset-password', { token, password: pw }).catch(() => null)
    setBusy(false)
    if (!res?.ok) {
      const body = await res?.json().catch(() => ({}))
      return setError(body?.code === 'expired' ? t('CD0060') : t('CD0061'))
    }
    toast({ type: 'success', message: t('CD0072') })
    router.push(next)
  }
  return (
    <V2Page bar={{ type: 'page', title: t('CD1500') }} className="flex items-center justify-center">
      <SignInCard view="new-password" onViewChange={() => {}} title={t('CD1500')} onGoogle={() => {}} onSubmit={save} busy={busy} error={error} labels={labels} />
    </V2Page>
  )
}

export function ConsentScreen() {
  const t = useCd()
  const router = useRouter()
  const next = safePath(useSearchParams()?.get('next'))
  const { toast } = useV2Shell()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const cancel = async () => {
    await createSupabaseBrowserClient().auth.signOut()
    router.push(next)
  }
  return (
    <V2Page bar={{ type: 'none' }} noFooter className="flex items-center justify-center">
      <ConsentStep
        title={t('CD1504')}
        items={[
          { id: 'age', label: t('CD1464'), required: true },
          { id: 'terms', label: t('CD0812'), required: true, viewHref: '/legal/terms' },
          { id: 'privacy', label: t('CD0811'), required: true, viewHref: '/legal/privacy' },
          { id: 'marketing', label: t('CD1508'), required: false },
        ]}
        checked={checked}
        onCheckedChange={setChecked}
        onView={(i) => window.open(`/${document.documentElement.lang}${i.viewHref}`, '_blank', 'noopener')}
        onContinue={async () => {
          const res = await post('/api/account/consent', { age: !!checked.age, marketing: !!checked.marketing }).catch(() => null)
          if (!res?.ok) return toast({ type: 'critical', message: t('CD0061') })
          // Pick up the new consent record in the session before moving on.
          await createSupabaseBrowserClient().auth.refreshSession()
          router.push(next)
        }}
        onCancel={cancel}
        labels={{ agreeAll: t('CD1506'), required: t('CD1507'), optional: t('CD1509'), view: t('CD0760'), continue: t('CD0768'), cancel: t('CD1510'), back: t('CD0121'), legend: t('CD1505') }}
        footnote={t('CD1511')}
      />
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
