'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, MapPin } from 'lucide-react'

interface Props {
  open:          boolean
  stopCount:     number
  onResume:      () => void
  onStartFresh:  () => void
}

export default function DraftResumeFreshModal({ open, stopCount, onResume, onStartFresh }: Props) {
  const t      = useTranslations('map.draftResume')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('button')?.focus()
    }, 50)
    return () => clearTimeout(id)
  }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('ariaLabel')}
    >
      <div className="absolute inset-0 bg-backdrop-50" aria-hidden="true" />
      <div
        ref={panelRef}
        className="relative w-full lg:w-[400px] bg-bg-2 rounded-none p-sp-6"
        style={{ borderTop: '1px solid var(--bdr)' }}
      >
        {/* Drag handle (mobile) */}
        <div className="lg:hidden flex justify-center mb-sp-4" aria-hidden="true">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--muted-2)' }} />
        </div>

        <div className="flex items-start gap-sp-3 mb-sp-5">
          <AlertCircle size={20} strokeWidth={2} className="text-lav shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="text-fg font-semibold text-f-base mb-sp-1">{t('title')}</h2>
            <div className="flex items-center gap-sp-1 text-muted text-f-sm">
              <MapPin size={12} strokeWidth={2} aria-hidden="true" />
              <span>{t('stopCount', { count: stopCount })}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-sp-3">
          <button
            onClick={onResume}
            className="w-full min-h-touch rounded-none text-f-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--lav)', color: 'var(--bg)' }}
          >
            {t('resume')}
          </button>
          <button
            onClick={onStartFresh}
            className="w-full min-h-touch rounded-none text-f-sm font-semibold text-muted hover:text-fg transition-colors"
            style={{ border: '1px solid var(--bdr)' }}
          >
            {t('startFresh')}
          </button>
        </div>
      </div>
    </div>
  )
}
