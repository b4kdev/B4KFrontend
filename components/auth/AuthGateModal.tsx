'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onDismiss: () => void;
}

export default function AuthGateModal({ open, onDismiss }: Props) {
  const t = useTranslations('auth.gate');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setStatus('idle');
      // Defer focus so animation has started
      const id = setTimeout(() => panelRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onDismiss]);

  // Prevent scroll on body while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function handleGoogleSignIn() {
    setStatus('loading');
    try {
      await signIn('google');
      // Only reached if signIn doesn't redirect (error scenario)
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

      {/* Panel — mobile: bottom sheet / desktop: centered modal */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full lg:w-[420px] bg-bg-2 rounded-t-2xl lg:rounded-2xl p-sp-6 outline-none auth-gate-panel"
      >
        {/* Drag handle — mobile only */}
        <div className="lg:hidden flex justify-center mb-sp-4">
          <div className="w-10 h-1 rounded-full bg-muted-2" aria-hidden="true" />
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
          {/* Brand */}
          <span className="text-lav font-display font-bold text-2xl tracking-tight select-none">
            B4K
          </span>

          <div>
            <h2 className="text-fg font-display font-bold text-xl mb-sp-2">
              {t('title')}
            </h2>
            <p className="text-muted text-sm leading-relaxed">
              {t('valueProp')}
            </p>
          </div>

          {/* Error message */}
          {status === 'error' && (
            <p role="alert" className="text-danger text-sm">
              {t('error')}
            </p>
          )}

          {/* Google sign-in */}
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
            <span>
              {status === 'loading' ? t('loading') : t('google')}
            </span>
          </button>

          {/* Dismiss */}
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
