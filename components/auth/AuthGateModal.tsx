'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { X, Mail, MailCheck, Route } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useAuthGate } from '@/contexts/AuthGateContext';

interface Props {
  open:      boolean;
  onDismiss: () => void;
}

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

type View      = 'providers' | 'email' | 'forgot' | 'check_email';
type EmailMode = 'signin' | 'signup';
const RESEND_COOLDOWN_S = 60; // S-JNCTDV: 60s resend cooldown

export default function AuthGateModal({ open, onDismiss }: Props) {
  const t = useTranslations('auth.gate');
  const { reason, executePendingAction, persistPendingAction } = useAuthGate();

  const [status,     setStatus]     = useState<'idle' | 'loading'>('idle');
  const [error,      setError]      = useState<string | null>(null); // i18n key
  const [view,       setView]       = useState<View>('providers');
  const [mode,       setMode]       = useState<EmailMode>('signin');
  const [checkKind,  setCheckKind]  = useState<'signup' | 'reset'>('signup');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [resendLeft, setResendLeft] = useState(0);
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

  function viewTitle(): string {
    switch (view) {
      case 'forgot':      return t('forgotTitle');
      case 'check_email': return t('checkEmailTitle');
      default:            return contextTitle();
    }
  }

  // Show plan-preserved notice for save_plan and fl3_cap
  const showDraftNotice = (reason === 'save_plan' || reason === 'fl3_cap')
    && (view === 'providers' || view === 'email');

  // Reset state on open
  useEffect(() => {
    if (!open) return;
    setStatus('idle');
    setError(null);
    setView('providers');
    setMode('signin');
    setEmail('');
    setPassword('');
    setResendLeft(0);
  }, [open]);

  // Focus first focusable element on open and on view change
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (el ?? panelRef.current)?.focus();
    }, 50);
    return () => clearTimeout(id);
  }, [open, view]);

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

  // Resend cooldown countdown
  useEffect(() => {
    if (resendLeft <= 0) return;
    const id = setTimeout(() => setResendLeft(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendLeft]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (password.length < 8) { setError('errorWeak'); return; }
      setStatus('loading');
      try {
        const res = await fetch('/api/auth/signup', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password }),
        });
        if (res.ok) {
          setCheckKind('signup');
          setView('check_email');
          setResendLeft(RESEND_COOLDOWN_S);
        } else {
          setError('errorSignup');
        }
      } catch {
        setError('errorSignup');
      }
      setStatus('idle');
      return;
    }

    setStatus('loading');
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInError) {
        executePendingAction();
        onDismiss();
      } else {
        setError('errorCredentials'); // generic only — no field-level detail (S-JNCTDV)
        setStatus('idle');
      }
    } catch {
      setError('errorCredentials');
      setStatus('idle');
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      if (res.ok) {
        setCheckKind('reset');
        setView('check_email');
        setResendLeft(RESEND_COOLDOWN_S);
      } else {
        setError('errorForgot');
      }
    } catch {
      setError('errorForgot');
    }
    setStatus('idle');
  }

  async function handleResend() {
    setError(null);
    setStatus('loading');
    try {
      const url = checkKind === 'signup' ? '/api/auth/signup/resend' : '/api/auth/forgot-password';
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      if (res.ok) setResendLeft(RESEND_COOLDOWN_S);
      else        setError(checkKind === 'signup' ? 'errorSignup' : 'errorForgot');
    } catch {
      setError(checkKind === 'signup' ? 'errorSignup' : 'errorForgot');
    }
    setStatus('idle');
  }

  async function handleOAuth(provider: 'google' | 'apple' | 'azure') {
    setError(null);
    setStatus('loading');
    try {
      persistPendingAction(); // L9 — survive the OAuth redirect
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const scopes = provider === 'apple' ? 'name email' : 'email profile';
      await supabase.auth.signInWithOAuth({ provider, options: { scopes, redirectTo } });
    } catch {
      setError('error');
      setStatus('idle');
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

        <div className="flex flex-col items-center text-center gap-sp-4 pt-sp-2">

          {/* Brand mark */}
          <span className="text-lav font-display text-f-2xl tracking-tight select-none">
            B4K
          </span>

          {/* Title + subline per view */}
          <div>
            <h2 className="text-fg font-display text-f-2xl mb-sp-2">
              {viewTitle()}
            </h2>
            {(view === 'providers' || view === 'email') && (
              <p className="text-muted text-f-base leading-relaxed">
                {t('valueProp')}
              </p>
            )}
            {view === 'forgot' && (
              <p className="text-muted text-f-base leading-relaxed">
                {t('forgotSubtitle')}
              </p>
            )}
            {view === 'check_email' && (
              <p className="text-muted text-f-base leading-relaxed">
                {checkKind === 'signup'
                  ? t('checkEmailBodySignup', { email })
                  : t('checkEmailBodyReset',  { email })}
              </p>
            )}
          </div>

          {/* Draft-preserved notice (save_plan + fl3_cap) */}
          {showDraftNotice && (
            <div
              className="w-full flex items-center gap-sp-3 px-sp-3 py-sp-2 rounded-none text-left"
              style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
            >
              <Route size={15} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
              <p className="text-f-base text-fg leading-snug">
                {reason === 'fl3_cap' ? t('fl3Preserved') : t('planPreserved')}
              </p>
            </div>
          )}

          {/* Error alert */}
          {error && (
            <p role="alert" className="text-danger text-f-base">{t(error)}</p>
          )}

          {view === 'providers' && (
            <>
              {/* Google */}
              <button
                onClick={() => handleOAuth('google')}
                disabled={status === 'loading'}
                className="w-full min-h-touch flex items-center justify-center gap-sp-3 bg-fg text-bg rounded-none font-semibold text-f-base transition-[background,color] duration-[80ms] disabled:opacity-60 hover:bg-royal-600 hover:text-fg active:opacity-75"
              >
                {status === 'loading'
                  ? <span className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  : (
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                  )
                }
                <span>{t('google')}</span>
              </button>

              {/* Apple */}
              <button
                onClick={() => handleOAuth('apple')}
                disabled={status === 'loading'}
                className="w-full min-h-touch flex items-center justify-center gap-sp-3 rounded-none font-semibold text-f-base transition-opacity disabled:opacity-60 hover:opacity-90 active:opacity-75"
                style={{ background: 'var(--bg-3)', border: '1px solid var(--bdr)', color: 'var(--fg)' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                {t('apple')}
              </button>

              {/* Microsoft */}
              <button
                onClick={() => handleOAuth('azure')}
                disabled={status === 'loading'}
                className="w-full min-h-touch flex items-center justify-center gap-sp-3 rounded-none font-semibold text-f-base transition-opacity disabled:opacity-60 hover:opacity-90 active:opacity-75"
                style={{ background: 'var(--bg-3)', border: '1px solid var(--bdr)', color: 'var(--fg)' }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
                </svg>
                {t('microsoft')}
              </button>

              {/* Continue with email */}
              <button
                onClick={() => setView('email')}
                disabled={status === 'loading'}
                className="w-full min-h-touch flex items-center justify-center gap-sp-3 rounded-none font-semibold text-f-base transition-opacity disabled:opacity-60 hover:opacity-90 active:opacity-75"
                style={{ background: 'var(--bg-3)', border: '1px solid var(--bdr)', color: 'var(--fg)' }}
              >
                <Mail size={18} strokeWidth={2} aria-hidden="true" />
                {t('emailContinue')}
              </button>
            </>
          )}

          {view === 'email' && (
            <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-sp-3">
              {/* Sign in / Sign up toggle */}
              <div className="w-full flex" style={{ borderBottom: '1px solid var(--bdr)' }}>
                {(['signin', 'signup'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setError(null); }}
                    aria-pressed={mode === m}
                    className={`flex-1 min-h-touch text-f-base font-semibold transition-colors ${
                      mode === m ? 'text-lav' : 'text-muted hover:text-fg'
                    }`}
                    style={mode === m ? { boxShadow: 'inset 0 -2px 0 var(--lav)' } : undefined}
                  >
                    {m === 'signin' ? t('signInTab') : t('signUpTab')}
                  </button>
                ))}
              </div>

              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                autoComplete="email"
                className="w-full min-h-touch px-sp-4 bg-bg-3 text-fg text-f-base rounded-none outline-none focus:ring-2 focus:ring-lav"
                style={{ border: '1px solid var(--bdr)' }}
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full min-h-touch px-sp-4 bg-bg-3 text-fg text-f-base rounded-none outline-none focus:ring-2 focus:ring-lav"
                style={{ border: '1px solid var(--bdr)' }}
              />
              <button
                type="submit"
                disabled={status === 'loading' || !email || !password}
                className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-fg text-bg rounded-none font-semibold text-f-base transition-[background,color] duration-[80ms] disabled:opacity-60 hover:bg-royal-600 hover:text-fg active:opacity-75"
              >
                {status === 'loading'
                  ? <span className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  : (mode === 'signin' ? t('signIn') : t('signUp'))
                }
              </button>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setError(null); }}
                  className="text-muted text-f-base hover:text-fg transition-colors min-h-touch"
                >
                  {t('forgotPassword')}
                </button>
              )}
              <button
                type="button"
                onClick={() => { setView('providers'); setError(null); }}
                className="text-muted text-f-base hover:text-fg transition-colors min-h-touch"
              >
                {t('backToProviders')}
              </button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="w-full flex flex-col gap-sp-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                autoComplete="email"
                className="w-full min-h-touch px-sp-4 bg-bg-3 text-fg text-f-base rounded-none outline-none focus:ring-2 focus:ring-lav"
                style={{ border: '1px solid var(--bdr)' }}
              />
              <button
                type="submit"
                disabled={status === 'loading' || !email}
                className="w-full min-h-touch flex items-center justify-center gap-sp-2 bg-fg text-bg rounded-none font-semibold text-f-base transition-[background,color] duration-[80ms] disabled:opacity-60 hover:bg-royal-600 hover:text-fg active:opacity-75"
              >
                {status === 'loading'
                  ? <span className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  : t('forgotSubmit')
                }
              </button>
              <button
                type="button"
                onClick={() => { setView('email'); setMode('signin'); setError(null); }}
                className="text-muted text-f-base hover:text-fg transition-colors min-h-touch"
              >
                {t('backToSignIn')}
              </button>
            </form>
          )}

          {view === 'check_email' && (
            <div className="w-full flex flex-col items-center gap-sp-3">
              <MailCheck size={32} strokeWidth={2} className="text-lav" aria-hidden="true" />
              <button
                type="button"
                onClick={handleResend}
                disabled={status === 'loading' || resendLeft > 0}
                className="w-full min-h-touch flex items-center justify-center gap-sp-2 rounded-none font-semibold text-f-base bg-transparent text-muted transition-[border-color,color] duration-[80ms] disabled:opacity-60 hover:text-fg hover:border-muted-3 active:opacity-75"
                style={{ border: '1px solid transparent' }}
              >
                {resendLeft > 0 ? t('resendIn', { seconds: resendLeft }) : t('resend')}
              </button>
            </div>
          )}

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="min-h-touch flex items-center text-muted text-f-base hover:text-fg transition-colors"
          >
            {t('dismiss')}
          </button>

          {/* ToS / Privacy footer */}
          <p className="text-mut2 text-f-sm leading-relaxed pb-sp-2">
            {t.rich('tosFooter', {
              terms: chunks => (
                <Link href="/legal/terms" className="underline text-muted hover:text-fg transition-colors">
                  {chunks}
                </Link>
              ),
              privacy: chunks => (
                <Link href="/legal/privacy" className="underline text-muted hover:text-fg transition-colors">
                  {chunks}
                </Link>
              ),
            })}
          </p>

        </div>
      </div>
    </div>
  );
}
