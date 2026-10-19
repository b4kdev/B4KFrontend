'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { Link as IntlLink } from '@/i18n/navigation'
import { Button, Modal } from '@/components/library'
import { useDraftMigration } from '@/hooks/useDraftMigration'
import { acceptTerms, hasAcceptedTerms } from '@/lib/terms-consent'
import { useCd } from './cd'

// What the live shell runs on every page, in the new design: the terms gate (BLK-14, once per
// device, no way out but accepting) and the post-login draft migration with its "keep which
// draft" choice (DEC-33 T3). Same storage and calls as components/legal/TermsGate and
// components/auth/DraftConflictModal.

export function V2TermsGate() {
  const t = useCd()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setOpen(!hasAcceptedTerms())
  }, [])
  const accept = () => {
    acceptTerms()
    setOpen(false)
  }
  const link = (href: string) =>
    function LegalLink(chunks: React.ReactNode) {
      return (
        <IntlLink href={href} target="_blank" className="text-ui-fg underline underline-offset-2 hover:text-ui-fg-muted">
          {chunks}
        </IntlLink>
      )
    }
  return (
    <Modal
      open={open}
      onClose={() => {}}
      title={t('CD0591')}
      closeLabel=""
      size="sm"
      blocking
      hideClose
      primaryAction={<Button onClick={accept} data-autofocus>{t('CD0588')}</Button>}
    >
      <p className="text-ui-fg-muted">{t.rich('CD0590', { terms: link('/legal/terms'), privacy: link('/legal/privacy') })}</p>
    </Modal>
  )
}

function useRelativeTime() {
  const locale = useLocale()
  return (iso: string) => {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60_000)
    if (Math.abs(mins) < 60) return rtf.format(mins, 'minute')
    const hrs = Math.round(mins / 60)
    if (Math.abs(hrs) < 24) return rtf.format(hrs, 'hour')
    return rtf.format(Math.round(hrs / 24), 'day')
  }
}

export function V2DraftMigration() {
  const t = useCd()
  const ago = useRelativeTime()
  const { conflict, resolveKeepDevice, resolveKeepAccount } = useDraftMigration()
  if (!conflict) return null
  const side = (title: string, d: { stopCount: number; lastModified: string }, keep: () => void) => (
    <div className="flex flex-col gap-[var(--space-2)] rounded-xl border border-ui-border p-[var(--space-4)]">
      <p className="type-title-card">{title}</p>
      <p className="type-body-base">{t('CD0011', { count: d.stopCount })}</p>
      <p className="type-body-caption text-ui-fg-muted">{t('CD0010', { time: ago(d.lastModified) })}</p>
      <Button size="md" variant="secondary" onClick={keep} className="mt-[var(--space-2)]">{t('CD0009')}</Button>
    </div>
  )
  return (
    <Modal open onClose={() => {}} title={t('CD0012')} closeLabel="" blocking hideClose>
      <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
        {side(t('CD0007'), conflict.deviceDraft, resolveKeepDevice)}
        {side(t('CD0005'), conflict.accountDraft, resolveKeepAccount)}
      </div>
      <p className="mt-[var(--space-3)] type-body-caption text-ui-fg-muted">{t('CD0008')}</p>
    </Modal>
  )
}
