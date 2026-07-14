'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'

// Landing page for the signup email verification link
// (`emailRedirectTo: ${origin}/auth/callback` — see app/api/auth/signup/route.ts).
// Shows a brief "verifying…" state, then routes home (or to a same-origin returnTo).
// NextAuth-era handler; the DEC-37 Supabase-direct migration is a separate effort.
export default function AuthCallbackPage() {
  const t = useTranslations('auth.callback')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only honour a same-origin relative path (guards against open redirect).
    const returnTo = searchParams.get('returnTo')
    const safe =
      returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
        ? returnTo
        : '/'

    const timer = setTimeout(() => router.replace(safe), 400)
    return () => clearTimeout(timer)
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-sp-4 bg-bg">
      <div
        className="w-full max-w-[400px] text-center flex flex-col items-center gap-sp-2"
        role="status"
        aria-live="polite"
      >
        <p className="text-f-lg font-semibold text-fg font-mono tracking-wide">{t('verifying')}</p>
        <p className="text-f-md text-muted">{t('redirecting')}</p>
      </div>
    </div>
  )
}
