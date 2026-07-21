'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getConsent, setConsent } from '@/lib/consent'

// DEC-16 — soft banner, dismiss (X) = accept. Shown once per device until a choice is made.
export default function CookieBanner() {
  const t = useTranslations('cookieConsent.banner')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(getConsent() === null)
  }, [])

  function accept() {
    setConsent('accepted')
    setVisible(false)
  }

  function decline() {
    setConsent('declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label={t('title')}
      className="fixed bottom-0 inset-x-0 z-[210] px-sp-4 py-sp-4 md:px-sp-6"
      style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--bdr)' }}
    >
      <div className="max-w-[960px] mx-auto flex flex-col md:flex-row md:items-center gap-sp-3 md:gap-sp-5">
        <p className="flex-1 text-f-sm text-muted leading-snug">
          {t('message')}{' '}
          <Link href="/legal/cookies" className="text-lav underline underline-offset-2 hover:opacity-80">
            {t('learnMore')}
          </Link>
        </p>
        <div className="flex items-center gap-sp-3 shrink-0">
          <button
            type="button"
            onClick={decline}
            className="min-h-touch px-sp-4 text-f-sm font-semibold text-muted hover:text-fg transition-colors"
          >
            {t('decline')}
          </button>
          <button
            type="button"
            onClick={accept}
            className="min-h-touch px-sp-5 text-f-sm font-semibold rounded-full bg-lav text-bg hover:opacity-90 active:opacity-75 transition-opacity"
          >
            {t('accept')}
          </button>
          <button
            type="button"
            onClick={accept}
            aria-label={t('dismiss')}
            className="min-h-touch min-w-touch flex items-center justify-center text-muted hover:text-fg transition-colors"
          >
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
