'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'

interface Props {
  open:         boolean
  initialTitle?: string
  onSave:       (title: string) => void
  onCancel:     () => void
}

export default function PlanNamingSheet({ open, initialTitle = '', onSave, onCancel }: Props) {
  const t        = useTranslations('map.namingSheet')
  const [title, setTitle] = useState(initialTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle(initialTitle)
      const id = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [open, initialTitle])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSave(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('ariaLabel')}
    >
      <div className="absolute inset-0 bg-backdrop-50" aria-hidden="true" onClick={onCancel} />
      <div
        className="relative w-full lg:w-[480px] bg-bg-2 rounded-none p-sp-6"
        style={{ borderTop: '1px solid var(--bdr)' }}
      >
        {/* Drag handle (mobile) */}
        <div className="lg:hidden flex justify-center mb-sp-4" aria-hidden="true">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--muted-2)' }} />
        </div>

        <div className="flex items-center justify-between mb-sp-5">
          <h2 className="text-fg font-semibold text-f-lg">{t('title')}</h2>
          <button
            onClick={onCancel}
            className="min-h-touch min-w-touch flex items-center justify-center text-muted hover:text-fg transition-colors"
            aria-label={t('cancel')}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-sp-4">
          <div>
            <label htmlFor="plan-title" className="sr-only">{t('inputLabel')}</label>
            <input
              ref={inputRef}
              id="plan-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('placeholder')}
              maxLength={80}
              className="w-full bg-bg-3 text-fg text-f-base rounded-none px-sp-4 min-h-[48px] outline-none"
              style={{ border: '1px solid var(--bdr)' }}
            />
            <p className="text-f-xs text-muted mt-sp-2 text-right">{title.trim().length}/80</p>
          </div>

          <div className="flex gap-sp-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 min-h-touch rounded-none text-f-sm font-semibold text-muted hover:text-fg transition-colors"
              style={{ border: '1px solid var(--bdr)' }}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 min-h-touch rounded-none text-f-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: 'var(--lav)', color: 'var(--bg)' }}
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
