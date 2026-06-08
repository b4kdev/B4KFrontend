'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { X, Route } from 'lucide-react';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useState } from 'react';

interface Props {
  open:      boolean;
  onDismiss: () => void;
}

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function AuthGateModal({ open, onDismiss }: Props) {
  const t = useTranslations('auth.gate');
  const { reason } = useAuthGate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const panelRef  = useRef<HTMLDivElement>(null);

  const showPlanNotice = reason === 'plan' || reason === 'save';

  // Focus first element on open
  useEffect(() => {
    if (!open) return;
    setStatus('idle');
    const id = setTimeout(() => {
      const el = panelRef.current
      if (!el) return
      const first = el.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? el).focus()
    }, 50);
    return () => clearTimeout(id);
  }, [open]);

  // Keyboard: Escape + focus trap
  useEffect(() => {
    if (!open) return;

    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') { onDismiss(); return; }

      if (e.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;
        const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!focusable.length) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onDismiss]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function handleGoogleSignIn() {
    setStatus('loading');
    try {
      await signIn('google');
      setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('ariaLabel')}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-backdrop-50"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Panel — mobile: full-width bottom sheet / desktop: centred card */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full lg:w-[420px] bg-bg-2 rounded-t-2xl lg:rounded-2xl p-sp-6 outline-none auth-gate-panel"
        style={{ borderTop: '1px solid var(--bdr)' }}
      >
        {/* Drag handle — AG_02 mobile */}
        <div className="lg:hidden flex justify-center mb-sp-4" aria-hidden="true">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--muted-2)' }} />
        </div>

        {/* Close button */}
        <button
          onClick={onDismiss}
          aria-label={t('close')}
          className="absolute top-sp-3 right-sp-3 min-w-touch min-h-touch flex items-center justify-center text-muted hover:text-fg transition-colors rounded-full"
        >
          <X size={20} strokeWidth={2} />
        </button>

        {/* Body */}
        <div className="flex flex-col items-center text-center gap-sp-4 pt-sp-2 pb-sp-4">

          {/* Brand mark */}
          <span className="text-lav font-display font-bold text-2xl tracking-tight select-none">
            B4K
          </span>

          {/* Title + value prop — AG_01 */}
          <div>
            <h2 className="text-fg font-display font-bold text-xl mb-sp-2">
              {t('title')}
            </h2>
            <p className="text-muted text-sm leading-relaxed">
              {t('valueProp')}
            </p>
          </div>

          {/* Contextual plan-preserved notice — AG_04 */}
          {showPlanNotice && (
            <div
              className="w-full flex items-center gap-sp-3 px-sp-3 py-sp-2 rounded-lg text-left"
              style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
            >
              <Route size={15} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
              <p className="text-sm text-fg leading-snug">
                {t('planPreserved')}
              </p>
            </div>
          )}

          {/* Error alert */}
          {status === 'error' && (
            <p role="alert" className="text-danger text-sm">
              {t('error')}
            </p>
          )}

          {/* Google sign-in — AG_03 */}
          <button
            onClick={handleGoogleSignIn}
            disabled={status === 'loading'}
            className="w-full min-h-touch flex items-center justify-center gap-sp-3 bg-fg text-bg rounded-xl font-body font-semibold text-sm transition-opacity disabled:opacity-60 hover:opacity-90 active:opacity-75"
          >
            {status === 'loading' ? (
              <span
                className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
            )}
            <span>{status === 'loading' ? t('loading') : t('google')}</span>
          </button>

          {/* Dismiss — AG_04 */}
          <button
            onClick={onDismiss}
            className="min-h-touch flex items-center text-muted text-sm hover:text-fg transition-colors"
          >
            {t('dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}
