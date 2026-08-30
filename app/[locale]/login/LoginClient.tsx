'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import AuthForm from '@/components/auth/AuthForm'

// Figma "Login / Signup — Auth" — a dedicated full-page entry point, distinct from
// AuthGateModal's mid-action gate. Same AuthForm underneath so sign-in/sign-up logic
// isn't forked. Redirects to `redirect` query param (or home) on success.
export default function LoginClient() {
  const t = useTranslations('auth.gate')
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSuccess() {
    router.push(searchParams.get('redirect') || '/')
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-sp-4 py-sp-10">
      <div className="w-full max-w-[420px]">
        <AuthForm title={t('title')} subtitle={t('valueProp')} onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
