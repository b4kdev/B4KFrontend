'use client';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/library/Button';
import { EmptyState } from '@/components/library/Feedback';
import { fontVariables } from './fonts';
// This file replaces the ENTIRE root layout when the root layout itself
// throws — Next.js renders it as its own <html>/<body>, bypassing
// app/layout.tsx. Those imports never run here, so the tokens and base
// styles must be imported directly in this file too.
import './tokens.css';
import './globals.css';

const LOCALES = ['en', 'ko', 'ja', 'zh-TW', 'pt-BR'];
type Texts = { title: string; body: string; retry: string };

// The root layout can throw before locale routing resolves, so next-intl has no context here: the
// page reads its Copy Deck rows from the exported message file of the address's language (English
// when the address has none), loaded only when this page shows.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [lang, setLang] = useState('en');
  const [texts, setTexts] = useState<Texts | null>(null);
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  useEffect(() => {
    const first = window.location.pathname.split('/')[1];
    const locale = LOCALES.includes(first) ? first : 'en';
    setLang(locale);
    import(`@/messages/v2/${locale}.json`)
      .then((m: { default: { cd: Record<string, string> } }) => setTexts({ title: m.default.cd.CD0113, body: m.default.cd.CD1818, retry: m.default.cd.CD0125 }))
      .catch(() => import('@/messages/v2/en.json').then((m) => setTexts({ title: m.default.cd.CD0113, body: m.default.cd.CD1818, retry: m.default.cd.CD0125 })));
  }, []);

  return (
    <html lang={lang} className={fontVariables}>
      <body className="m-0 flex min-h-dvh items-center justify-center bg-ui-bg px-[var(--grid-gutter-mobile)] text-ui-fg type-body-base">
        {texts ? (
          <EmptyState type="error" title={texts.title} action={<Button onClick={reset}>{texts.retry}</Button>}>
            {texts.body}
          </EmptyState>
        ) : null}
      </body>
    </html>
  );
}
