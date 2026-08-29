'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { hasAcceptedTerms, acceptTerms } from '@/lib/terms-consent'

// BLK-14 item 1 — blocking acceptance gate, shown once per device until accepted.
// No decline/dismiss path: using the Service requires accepting Terms + Privacy Policy.
export default function TermsGate() {
  const t = useTranslations('legalGate')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!hasAcceptedTerms())
  }, [])

  function accept() {
    acceptTerms()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end lg:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('ariaLabel')}
    >
      <div className="absolute inset-0 bg-backdrop-50" aria-hidden="true" />
      <div
        className="relative w-full lg:w-[420px] rounded-none p-sp-6 outline-none"
        style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--bdr)' }}
      >
        <h2 className="text-fg font-display text-f-2xl mb-sp-3">{t('title')}</h2>
        <p className="text-muted text-f-base leading-relaxed mb-sp-5">
          {t.rich('message', {
            terms: chunks => (
              <Link href="/legal/terms" target="_blank" className="underline text-fg hover:opacity-80">
                {chunks}
              </Link>
            ),
            privacy: chunks => (
              <Link href="/legal/privacy" target="_blank" className="underline text-fg hover:opacity-80">
                {chunks}
              </Link>
            ),
          })}
        </p>
        <button
          type="button"
          onClick={accept}
          className="w-full min-h-touch flex items-center justify-center bg-fg text-bg rounded-none font-semibold text-f-base transition-[background,color] duration-[80ms] hover:bg-royal-600 hover:text-fg active:opacity-75"
        >
          {t('accept')}
        </button>
      </div>
    </div>
  )
}
