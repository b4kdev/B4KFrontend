'use client';

// Shared auth form — the provider/email/forgot/check-email flow itself, extracted from
// AuthGateModal so a dedicated full-page /login route (Figma "Login / Signup — Auth")
// can reuse the exact same logic instead of forking it. AuthGateModal keeps everything
// gate-specific (AuthGateContext reason, draft-preserved notice, dismiss/backdrop chrome)
// and passes title/subtitle/draftNotice/onSuccess down as props.

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Mail, MailCheck, Route } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { track } from '@/lib/analytics';

type View      = 'providers' | 'email' | 'forgot' | 'check_email';
type EmailMode = 'signin' | 'signup';
const RESEND_COOLDOWN_S = 60;

interface Props {
  title: string;
  subtitle: string;
  draftNotice?: string;
  onSuccess: () => void;
  /** Called synchronously before the OAuth redirect fires — AuthGateModal uses this to
   *  persist the pending gated action (L9) so it survives the round-trip. */
  onOAuthStart?: () => void;
}

export default function AuthForm({ title, subtitle, draftNotice, onSuccess, onOAuthStart }: Props) {
  const t = useTranslations('auth.gate');
  const locale = useLocale();

  const [status,     setStatus]     = useState<'idle' | 'loading'>('idle');
  const [error,      setError]      = useState<string | null>(null);
  const [view,       setView]       = useState<View>('providers');
  const [mode,       setMode]       = useState<EmailMode>('signin');
  const [checkKind,  setCheckKind]  = useState<'signup' | 'reset'>('signup');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [resendLeft, setResendLeft] = useState(0);

  function viewTitle(): string {
    switch (view) {
      case 'forgot':      return t('forgotTitle');
      case 'check_email': return t('checkEmailTitle');
      default:            return title;
    }
  }

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
      if (!ageConfirmed) { return; }
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
        track('sign_in', { method: 'email', is_new_user: false, locale, screen_id: 'AG_01' });
        onSuccess();
      } else {
        setError('errorCredentials');
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

  async function handleOAuth(provider: 'google') {
    setError(null);
    setStatus('loading');
    try {
      onOAuthStart?.();
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      await supabase.auth.signInWithOAuth({ provider, options: { scopes: 'email profile', redirectTo } });
    } catch {
      setError('error');
      setStatus('idle');
    }
  }

  return (
    <div className="flex flex-col items-center text-center gap-sp-4 pt-sp-2">
      <Image
        src="/brand/B4K_BrandLogo_Horizontal_White.svg"
        alt="B4K"
        width={108}
        height={24}
        className="select-none"
      />

      <div>
        <h2 className="text-fg font-display text-f-2xl mb-sp-2">{viewTitle()}</h2>
        {(view === 'providers' || view === 'email') && (
          <p className="text-muted text-f-base leading-relaxed">{subtitle}</p>
        )}
        {view === 'forgot' && (
          <p className="text-muted text-f-base leading-relaxed">{t('forgotSubtitle')}</p>
        )}
        {view === 'check_email' && (
          <p className="text-muted text-f-base leading-relaxed">
            {checkKind === 'signup'
              ? t('checkEmailBodySignup', { email })
              : t('checkEmailBodyReset',  { email })}
          </p>
        )}
      </div>

      {draftNotice && (view === 'providers' || view === 'email') && (
        <div
          className="w-full flex items-center gap-sp-3 px-sp-3 py-sp-2 rounded-none text-left"
          style={{ background: 'var(--bg-3)', border: '1px solid var(--bdr)' }}
        >
          <Route size={15} strokeWidth={2} className="text-fg shrink-0" aria-hidden="true" />
          <p className="text-f-base text-fg leading-snug">{draftNotice}</p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-danger text-f-base">{t(error)}</p>
      )}

      {view === 'providers' && (
        <>
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
          <div className="w-full flex" style={{ borderBottom: '1px solid var(--bdr)' }}>
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                aria-pressed={mode === m}
                className={`flex-1 min-h-touch text-f-base font-semibold transition-colors ${
                  mode === m ? 'text-fg' : 'text-muted hover:text-fg'
                }`}
                style={mode === m ? { boxShadow: 'inset 0 -2px 0 var(--fg)' } : undefined}
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
            className="w-full min-h-touch px-sp-4 bg-bg-3 text-fg text-f-base rounded-none outline-none focus:ring-2 focus:ring-fg"
            style={{ border: '1px solid var(--bdr)' }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('passwordPlaceholder')}
            required
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full min-h-touch px-sp-4 bg-bg-3 text-fg text-f-base rounded-none outline-none focus:ring-2 focus:ring-fg"
            style={{ border: '1px solid var(--bdr)' }}
          />
          {mode === 'signup' && (
            <label className="w-full flex items-center gap-sp-3 min-h-touch cursor-pointer text-left">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={e => setAgeConfirmed(e.target.checked)}
                className="w-5 h-5 shrink-0"
                style={{ accentColor: 'var(--fg)' }}
              />
              <span className="text-f-sm text-muted">{t('ageConfirm')}</span>
            </label>
          )}
          <button
            type="submit"
            disabled={status === 'loading' || !email || !password || (mode === 'signup' && !ageConfirmed)}
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
            className="w-full min-h-touch px-sp-4 bg-bg-3 text-fg text-f-base rounded-none outline-none focus:ring-2 focus:ring-fg"
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
          <MailCheck size={32} strokeWidth={2} className="text-fg" aria-hidden="true" />
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
  );
}
