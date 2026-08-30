'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useAuthGate } from '@/contexts/AuthGateContext';
import AuthForm from './AuthForm';

interface Props {
  open:      boolean;
  onDismiss: () => void;
}

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function AuthGateModal({ open, onDismiss }: Props) {
  const t = useTranslations('auth.gate');
  const { reason, executePendingAction, persistPendingAction } = useAuthGate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Context-specific first-line copy (DEC-34)
  function contextTitle(): string {
    switch (reason) {
      case 'save_poi':         return t('context.save_poi');
      case 'like':             return t('context.like');
      case 'save_plan':        return t('context.save_plan');
      case 'save_plan_other':  return t('context.save_plan_other');
      case 'saved_tab':        return t('context.saved_tab');
      case 'profile_nav':      return t('context.profile_nav');
      case 'fl3_cap':          return t('context.fl3_cap');
      default:                 return t('title');
    }
  }

  // Show plan-preserved notice for save_plan and fl3_cap
  const showDraftNotice = reason === 'save_plan' || reason === 'fl3_cap';
  const draftNotice = showDraftNotice ? t(reason === 'fl3_cap' ? 'fl3Preserved' : 'planPreserved') : undefined;

  // Focus first focusable element on open
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (el ?? panelRef.current)?.focus();
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

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleSuccess() {
    executePendingAction();
    onDismiss();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('ariaLabel')}
    >
      <div
        className="absolute inset-0 bg-backdrop-50"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Panel — mobile: bottom sheet / desktop: centred card */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full lg:w-[420px] rounded-none p-sp-6 outline-none"
        style={{ background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Drag handle — mobile only */}
        <div className="lg:hidden flex justify-center mb-sp-4" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-muted-2" />
        </div>

        {/* Close */}
        <button
          onClick={onDismiss}
          aria-label={t('close')}
          className="absolute top-sp-3 right-sp-3 min-w-touch min-h-touch flex items-center justify-center text-fg hover:bg-muted-3 transition-colors rounded-none"
        >
          <X size={20} strokeWidth={2} style={{ opacity: 0.35 }} />
        </button>

        <AuthForm
          title={contextTitle()}
          subtitle={t('valueProp')}
          draftNotice={draftNotice}
          onSuccess={handleSuccess}
          onOAuthStart={persistPendingAction}
          logoVariant="white"
        />

        {/* Dismiss */}
        <div className="flex justify-center">
          <button
            onClick={onDismiss}
            className="min-h-touch flex items-center text-muted text-f-base hover:text-fg transition-colors"
          >
            {t('dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}
