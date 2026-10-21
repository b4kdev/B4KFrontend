'use client'

import { useLocale } from 'next-intl'
import { Button, Modal } from '@/components/library'
import { useDraftMigration } from '@/hooks/useDraftMigration'
import { useCd } from './cd'

// What the shell runs on every page: the post-login draft migration with its "keep which draft"
// choice. Terms are agreed in the Consent step after sign-in, so there is no first-visit gate.

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
