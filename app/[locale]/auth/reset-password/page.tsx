'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error-mismatch' | 'error-weak' | 'error-expired' | 'error-generic'

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword')

  const [token,       setToken]       = useState<string | null>(null)
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status,      setStatus]      = useState<Status>('idle')

  // Extract token from URL hash (Supabase recovery: #access_token=...&type=recovery)
  // or from query param (PKCE: ?code=...)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash   = window.location.hash.slice(1)
    const params = new URLSearchParams(hash || window.location.search)
    const t      = params.get('access_token') ?? params.get('code')
    if (t) setToken(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setStatus('error-weak'); return }
    if (password !== confirm) { setStatus('error-mismatch'); return }
    if (!token)               { setStatus('error-expired'); return }

    setStatus('loading')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setStatus(body.code === 'expired' ? 'error-expired' : 'error-generic')
        return
      }
      setStatus('success')
      // Auto-redirect after short delay
      setTimeout(() => { window.location.href = '/' }, 2000)
    } catch {
      setStatus('error-generic')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-sp-4 bg-bg">
        <div className="w-full max-w-[400px] text-center flex flex-col items-center gap-sp-4">
          <CheckCircle size={48} strokeWidth={2} className="text-success" aria-hidden="true" />
          <p className="text-fg font-display text-f-2xl">{t('success')}</p>
          <p className="text-muted text-f-base">{t('redirecting')}</p>
        </div>
      </div>
    )
  }

  function errorMessage(): string | null {
    switch (status) {
      case 'error-mismatch': return t('errorMismatch')
      case 'error-weak':     return t('errorWeak')
      case 'error-expired':  return t('errorExpired')
      case 'error-generic':  return t('errorGeneric')
      default:               return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-sp-4 bg-bg">
      <div className="w-full max-w-[400px]">
        <div className="mb-sp-8 text-center">
          <span className="text-lav font-display text-f-2xl tracking-tight select-none">B4K</span>
        </div>

        <div className="bg-bg-2 rounded-none p-sp-6" style={{ border: '1px solid var(--bdr)' }}>
          <h1 className="text-fg font-display text-f-2xl mb-sp-2">{t('title')}</h1>
          <p className="text-muted text-f-base mb-sp-5">{t('subtitle')}</p>

          {errorMessage() && (
            <p role="alert" className="text-danger text-f-base mb-sp-4">{errorMessage()}</p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
            <div>
              <label htmlFor="rp-password" className="block text-f-sm font-semibold text-muted mb-sp-2">
                {t('passwordLabel')}
              </label>
              <div className="relative">
                <input
                  id="rp-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  required
                  autoComplete="new-password"
                  className="w-full min-h-touch px-sp-4 pr-12 bg-bg-3 text-fg text-f-base rounded-none outline-none focus:ring-2 focus:ring-lav"
                  style={{ border: '1px solid var(--bdr)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? t('hidePw') : t('showPw')}
                  className="absolute right-sp-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition-colors"
                >
                  {showPw ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="rp-confirm" className="block text-f-sm font-semibold text-muted mb-sp-2">
                {t('confirmLabel')}
              </label>
              <div className="relative">
                <input
                  id="rp-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder={t('confirmPlaceholder')}
                  required
                  autoComplete="new-password"
                  className="w-full min-h-touch px-sp-4 pr-12 bg-bg-3 text-fg text-f-base rounded-none outline-none focus:ring-2 focus:ring-lav"
                  style={{ border: '1px solid var(--bdr)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? t('hidePw') : t('showPw')}
                  className="absolute right-sp-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !password || !confirm}
              className="w-full min-h-touch flex items-center justify-center bg-lav text-bg rounded-none font-semibold text-f-base transition-opacity disabled:opacity-60 hover:opacity-90 active:opacity-75 mt-sp-2"
            >
              {status === 'loading'
                ? <><span className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin mr-sp-2" aria-hidden="true" />{t('loading')}</>
                : t('submit')
              }
            </button>
          </form>
        </div>

        <p className="text-center mt-sp-5">
          <Link href="/" className="text-muted text-f-base hover:text-fg transition-colors">
            {t('backToHome')}
          </Link>
        </p>
      </div>
    </div>
  )
}
