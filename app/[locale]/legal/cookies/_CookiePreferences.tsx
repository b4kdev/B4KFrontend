'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { getConsent, setConsent, type ConsentState } from '@/lib/consent';

export default function CookiePreferences() {
  const t = useTranslations('cookieConsent.preferences');
  const [consent, setConsentState] = useState<ConsentState>(null);

  useEffect(() => {
    setConsentState(getConsent());
  }, []);

  function choose(value: 'accepted' | 'declined') {
    setConsent(value);
    setConsentState(value);
  }

  return (
    <div className="rounded-none p-sp-6" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
      <div className="flex items-center justify-between gap-sp-4 mb-sp-4">
        <div>
          <p className="text-f-lg font-semibold text-fg mb-1">{t('title')}</p>
          <p className="text-f-sm text-muted">{t('desc')}</p>
        </div>
        {consent && (
          <div
            className="shrink-0 flex items-center gap-1.5 px-sp-3 py-1.5 rounded-full text-f-xs font-semibold"
            style={
              consent === 'accepted'
                ? { background: 'var(--lav-dim)', color: 'var(--lav)' }
                : { background: 'var(--muted-3)', color: 'var(--muted)' }
            }
          >
            {consent === 'accepted' ? (
              <Check size={14} strokeWidth={2} aria-hidden="true" />
            ) : (
              <X size={14} strokeWidth={2} aria-hidden="true" />
            )}
            {consent === 'accepted' ? t('statusAccepted') : t('statusDeclined')}
          </div>
        )}
      </div>
      <div className="flex items-center gap-sp-3">
        <button
          type="button"
          onClick={() => choose('declined')}
          className="min-h-touch px-sp-5 text-f-sm font-semibold text-muted hover:text-fg transition-colors"
        >
          {t('decline')}
        </button>
        <button
          type="button"
          onClick={() => choose('accepted')}
          className="min-h-touch px-sp-5 text-f-sm font-semibold rounded-full bg-lav text-bg hover:opacity-90 active:opacity-75 transition-opacity"
        >
          {t('accept')}
        </button>
      </div>
    </div>
  );
}
