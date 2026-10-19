'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { Button, ConsentStep, SignInCard, TextInput, type SignInView } from '@/components/library'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { acceptTerms } from '@/lib/terms-consent'
import { useCd } from '../cd'
import { V2Page } from '../V2Page'
import { useV2Shell } from '../V2Shell'

// A4 auth screens (UI-82, PD-04, PD-12, PD-37): Sign in (SCR-023), Reset password (SCR-024),
// Consent step (SCR-025). Same auth calls as the live AuthForm.

const post = (url: string, body: unknown) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export function LoginScreen() {
  const t = useCd()
  const router = useRouter()
  const next = useSearchParams()?.get('next') ?? '/v2'
  const [view, setView] = useState<SignInView>('providers')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [email, setEmail] = useState('')
  const [kind, setKind] = useState<'signup' | 'reset'>('signup')

  const submit = async (v: SignInView, values: Record<string, string>) => {
    setError(undefined)
    setEmail(values.email ?? '')
    setBusy(true)
    try {
      if (v === 'sign-in') {
        const { error: e } = await createSupabaseBrowserClient().auth.signInWithPassword({ email: values.email ?? '', password: values.password ?? '' })
        if (e) setError(t('CD0034'))
        else router.push(next)
      } else if (v === 'sign-up') {
        if ((values.password ?? '').length < 8) return setError(t('CD0037'))
        const res = await post('/api/auth/signup', { email: values.email, password: values.password })
        if (res.ok) {
          setKind('signup')
          setView('check-email')
        } else setError(t('CD0036'))
      } else if (v === 'forgot') {
        const res = await post(kind === 'signup' && view === 'check-email' ? '/api/auth/signup/resend' : '/api/auth/forgot-password', { email: values.email ?? email })
        if (res.ok) {
          if (view !== 'check-email') setKind('reset')
          setView('check-email')
        } else setError(t('CD0035'))
      }
    } catch {
      setError(t('CD0033'))
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setBusy(true)
    await createSupabaseBrowserClient().auth.signInWithOAuth({ provider: 'google', options: { scopes: 'email profile', redirectTo: `${window.location.origin}/auth/callback` } })
  }

  return (
    <V2Page bar={{ type: 'page', title: t('CD0050') }} className="flex items-center justify-center">
      <SignInCard
        view={view}
        onViewChange={(v) => { setError(undefined); setView(v) }}
        title={t('CD0054')}
        onGoogle={google}
        onSubmit={submit}
        busy={busy}
        error={error}
        email={email}
        labels={{
          close: t('CD0021'), google: t('CD0043'), email: t('CD0031'), signIn: t('CD0051'), signUp: t('CD0053'),
          password: t('CD0046'), newPassword: t('CD0066'), confirmPassword: t('CD0058'), passwordHint: t('CD1468'),
          forgot: t('CD0039'), sendLink: t('CD0040'), checkEmailTitle: t('CD0020'),
          checkEmailBody: (e) => (kind === 'signup' ? t('CD0019', { email: e }) : t('CD0018', { email: e })),
          resend: t('CD0048'), savePassword: t('CD1503'), newPasswordBody: t('CD1501'), back: t('CD1493'), guest: t('CD0029'),
          or: t('CD1376'), tabs: t('CD0054'),
        }}
      />
    </V2Page>
  )
}

export function ResetPasswordScreen() {
  const t = useCd()
  const router = useRouter()
  const { toast } = useV2Shell()
  const [token, setToken] = useState<string | null>(null)
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<{ field: 'pw' | 'confirm' | 'form'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.slice(1) || window.location.search)
    setToken(p.get('access_token') ?? p.get('code'))
  }, [])
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.length < 8) return setError({ field: 'pw', text: t('CD0063') })
    if (pw !== confirm) return setError({ field: 'confirm', text: t('CD0062') })
    if (!token) return setError({ field: 'form', text: t('CD0060') })
    setBusy(true)
    const res = await post('/api/auth/reset-password', { token, password: pw }).catch(() => null)
    setBusy(false)
    if (!res?.ok) {
      const body = await res?.json().catch(() => ({}))
      return setError({ field: 'form', text: body?.code === 'expired' ? t('CD0060') : t('CD0061') })
    }
    toast({ type: 'success', message: t('CD0072') })
    router.push('/v2')
  }
  return (
    <V2Page bar={{ type: 'page', title: t('CD1500') }} className="flex items-center justify-center">
      <form noValidate onSubmit={save} className="flex w-full max-w-[400px] flex-col gap-[var(--space-5)] rounded-2xl border border-ui-border bg-ui-bg-elevated p-[var(--space-6)]">
        <h1 className="type-display-h4">{t('CD1500')}</h1>
        <p className="type-body-base text-ui-fg-muted">{t('CD1501')}</p>
        {error?.field === 'form' ? <p role="alert" className="type-body-caption text-ui-danger">{error.text}</p> : null}
        <TextInput label={t('CD0066')} showLabel type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} help={t('CD1468')} error={error?.field === 'pw' ? error.text : undefined} />
        <TextInput label={t('CD0058')} showLabel type="password" autoComplete="new-password" placeholder={t('CD1502')} value={confirm} onChange={(e) => setConfirm(e.target.value)} error={error?.field === 'confirm' ? error.text : undefined} />
        <Button type="submit" loading={busy} className="w-full">{t('CD1503')}</Button>
      </form>
    </V2Page>
  )
}

export function ConsentScreen() {
  const t = useCd()
  const router = useRouter()
  const next = useSearchParams()?.get('next') ?? '/v2'
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const cancel = async () => {
    await createSupabaseBrowserClient().auth.signOut()
    router.push(next)
  }
  return (
    <V2Page bar={{ type: 'none' }} noFooter className="flex items-center justify-center">
      <div className="flex w-full max-w-[400px] flex-col gap-[var(--space-3)]">
        <ConsentStep
          title={t('CD1504')}
          items={[
            { id: 'age', label: t('CD1464'), required: true },
            { id: 'terms', label: t('CD0812'), required: true, viewHref: '/v2/legal/terms' },
            { id: 'privacy', label: t('CD0811'), required: true, viewHref: '/v2/legal/privacy' },
            { id: 'marketing', label: t('CD1508'), required: false },
          ]}
          checked={checked}
          onCheckedChange={setChecked}
          onView={(i) => window.open(`/${document.documentElement.lang}${i.viewHref}`, '_blank', 'noopener')}
          onContinue={() => {
            acceptTerms()
            router.push(next)
          }}
          onCancel={cancel}
          labels={{ agreeAll: t('CD1506'), required: t('CD1507'), optional: t('CD1509'), view: t('CD0760'), continue: t('CD0768'), cancel: t('CD1510'), back: t('CD0121'), legend: t('CD1505') }}
        />
        <p className="type-body-caption text-ui-fg-muted">{t('CD1511')}</p>
      </div>
    </V2Page>
  )
}
