'use client'

import { CheckCircle, XCircle, Info } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import type { ToastType } from '@/contexts/ToastContext'

const ICON: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
}
const COLOR: Record<ToastType, string> = {
  success: 'text-success',
  error:   'text-danger',
  info:    'text-info',
}

export default function ToastStack() {
  const { toasts } = useToast()
  if (!toasts.length) return null

  return (
    <div
      className="fixed bottom-20 lg:bottom-sp-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(toast => {
        const Icon = ICON[toast.type]
        return (
          <div
            key={toast.id}
            role="status"
            className="flex items-center gap-sp-2 px-sp-4 py-sp-3 bg-bg-3 rounded-xl toast-enter"
            style={{ border: '1px solid var(--bdr)', boxShadow: '0 4px 16px var(--backdrop-50)' }}
          >
            <Icon size={16} strokeWidth={2} className={COLOR[toast.type]} aria-hidden="true" />
            <span className="text-fg text-sm font-medium whitespace-nowrap">{toast.message}</span>
          </div>
        )
      })}
    </div>
  )
}
