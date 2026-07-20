'use client'

import { createContext, useContext, useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastAction {
  label:   string
  onClick: () => void
}

interface Toast {
  id:      number
  message: string
  type:    ToastType
  action?: ToastAction
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, action?: ToastAction) => void
  dismissToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // UF-13 (G11.2) — toasts with an action (e.g. badge unlock's "View badge")
  // stay until the user explicitly dismisses or acts, instead of auto-closing —
  // an action worth noticing shouldn't vanish in 3s. `warning` toasts are
  // persistent for the same reason (shared/states.md Toast System: "never
  // (persistent warning)") — error gets a longer 5s window, success/info 3s.
  const showToast = useCallback((message: string, type: ToastType = 'success', action?: ToastAction) => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type, action }])
    if (!action && type !== 'warning') {
      const duration = type === 'error' ? 5000 : 3000
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
