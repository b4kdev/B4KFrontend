'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

// Landing page for both OAuth sign-in (signInWithOAuth redirectTo) and the
// signup email verification link (emailRedirectTo — see app/api/auth/signup/route.ts).
//
// This used to just redirect after a setTimeout with zero Supabase interaction
// (leftover from the pre-DEC-37 NextAuth handler) — the PKCE `code` Supabase
// appends to the URL was never exchanged for a session, so the redirect back
// after a real login never actually established one. That's the "keeps
// asking me to log in" bug: every OAuth sign-in silently failed to persist.
export default function AuthCallbackPage() {
  const t = useTranslations('auth.callback')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    // Only honour a same-origin relative path (guards against open redirect).
    const returnTo = searchParams.get('returnTo')
    const safe =
      returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
        ? returnTo
        : '/'

    async function completeAuth() {
      const supabase = createSupabaseBrowserClient()
      const code = searchParams.get('code')
      const tokenHash = searchParams.get('token_hash')
      const otpType = searchParams.get('type')

      let error = null
      if (code) {
        ;({ error } = await supabase.auth.exchangeCodeForSession(code))
      } else if (tokenHash && otpType) {
        // Email confirmation / magic link — Supabase's older non-PKCE param scheme
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType as any }))
      }

      if (error) { setFailed(true); return }
      router.replace(safe)
    }

    completeAuth()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-sp-4 bg-bg">
      <div
        className="w-full max-w-[400px] text-center flex flex-col items-center gap-sp-2"
        role="status"
        aria-live="polite"
      >
        <p className="text-f-lg font-semibold text-fg font-mono tracking-wide">
          {failed ? t('error') : t('verifying')}
        </p>
        <p className="text-f-md text-muted">
          {failed ? t('errorRetry') : t('redirecting')}
        </p>
      </div>
    </div>
  )
}
