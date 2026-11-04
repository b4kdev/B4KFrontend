'use client';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/library/Button';
import { EmptyState } from '@/components/library/Feedback';
import { getStoredTheme, type Theme } from '@/lib/theme';
import { fontVariables } from './fonts';
// This file replaces the ENTIRE root layout when the root layout itself
// throws — Next.js renders it as its own <html>/<body>, bypassing
// app/layout.tsx. Those imports never run here, so the tokens and base
// styles must be imported directly in this file too.
import './tokens.css';
import './globals.css';

const LOCALES = ['en', 'ko', 'ja', 'zh-TW', 'pt-BR'];
type Texts = { title: string; body: string; retry: string; home: string };
const pick = (cd: Record<string, string>): Texts => ({ title: cd.CD0113, body: cd.CD0111, retry: cd.CD0110, home: cd.CD0112 });

// The last-resort error page: the same error page as the one inside the site (state, then Try again
// and Back to Home below it), without the header and footer, which belong to the layout that failed.
// The root layout can throw before locale routing resolves, so next-intl has no context here: the
// page reads its Copy Deck rows from the exported message file of the address's language (English
// when the address has none), loaded only when this page shows. Its own <html> drops the theme the
// layout had set, so the visitor's theme is set again here.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState<Theme | undefined>();
  const [texts, setTexts] = useState<Texts | null>(null);
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  useEffect(() => {
    try {
      setTheme(getStoredTheme());
    } catch {
      setTheme('light');
    }
    const first = window.location.pathname.split('/')[1];
    const locale = LOCALES.includes(first) ? first : 'en';
    setLang(locale);
    import(`@/messages/v2/${locale}.json`)
      .then((m: { default: { cd: Record<string, string> } }) => setTexts(pick(m.default.cd)))
      .catch(() => import('@/messages/v2/en.json').then((m) => setTexts(pick(m.default.cd))));
  }, []);

  return (
    <html lang={lang} className={fontVariables} data-theme={theme} style={theme ? { colorScheme: theme } : undefined}>
      <body className="m-0 bg-ui-bg text-ui-fg antialiased">
        <main className="flex min-h-dvh flex-col items-center justify-center gap-[var(--space-4)] px-[var(--grid-gutter-mobile)] lg:gap-[var(--space-6)]">
          {texts ? (
            <>
              <EmptyState type="error" titleAs="h1" title={texts.title} className="w-full lg:w-[400px]">{texts.body}</EmptyState>
              <div className="flex flex-wrap justify-center gap-[var(--gap-sm)]">
                <Button onClick={reset}>{texts.retry}</Button>
                <a href={`/${lang}`} className="inline-flex h-[var(--control-height-lg)] items-center border border-ui-border-strong px-[var(--button-padding-x)] type-label-button text-ui-fg hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none">{texts.home}</a>
              </div>
            </>
          ) : null}
        </main>
      </body>
    </html>
  );
}
