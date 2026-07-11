'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Smartphone, Cloud, MapPin } from 'lucide-react';

export interface DraftMeta {
  stopCount:    number;
  lastModified: string;  // ISO string
}

interface Props {
  open:          boolean;
  deviceDraft:   DraftMeta;
  accountDraft:  DraftMeta;
  onKeepDevice:  () => void;
  onKeepAccount: () => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DraftConflictModal({
  open, deviceDraft, accountDraft, onKeepDevice, onKeepAccount,
}: Props) {
  const t       = useTranslations('auth.conflict');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    }, 50);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('ariaLabel')}
    >
      <div className="absolute inset-0 bg-backdrop-50" aria-hidden="true" />

      <div
        ref={panelRef}
        className="relative w-full lg:w-[480px] bg-bg-2 rounded-t-2xl lg:rounded-2xl p-sp-6 outline-none"
        style={{ borderTop: '1px solid var(--bdr)' }}
      >
        {/* Drag handle */}
        <div className="lg:hidden flex justify-center mb-sp-4" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-muted-2" />
        </div>

        <h2 className="text-fg font-display font-bold text-lg text-center mb-sp-5 leading-snug">
          {t('title')}
        </h2>

        <div className="grid grid-cols-2 gap-sp-3 mb-sp-5">
          {/* Device draft */}
          <div
            className="flex flex-col gap-sp-3 p-sp-4 rounded-xl"
            style={{ background: 'var(--bg-3)', border: '1px solid var(--bdr)' }}
          >
            <div className="flex items-center gap-sp-2 text-muted text-f-xs font-semibold uppercase tracking-widest">
              <Smartphone size={12} strokeWidth={2} aria-hidden="true" />
              {t('deviceDraft')}
            </div>
            <div className="flex items-center gap-sp-2 text-fg text-f-base font-semibold">
              <MapPin size={14} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
              {t('stops', { count: deviceDraft.stopCount })}
            </div>
            <p className="text-muted text-f-xs">{t('lastModified', { time: relativeTime(deviceDraft.lastModified) })}</p>
            <button
              onClick={onKeepDevice}
              className="w-full min-h-touch flex items-center justify-center bg-lav text-bg rounded-lg text-f-sm font-semibold transition-opacity hover:opacity-90 active:opacity-75"
            >
              {t('keep')}
            </button>
          </div>

          {/* Account draft */}
          <div
            className="flex flex-col gap-sp-3 p-sp-4 rounded-xl"
            style={{ background: 'var(--bg-3)', border: '1px solid var(--bdr)' }}
          >
            <div className="flex items-center gap-sp-2 text-muted text-f-xs font-semibold uppercase tracking-widest">
              <Cloud size={12} strokeWidth={2} aria-hidden="true" />
              {t('accountDraft')}
            </div>
            <div className="flex items-center gap-sp-2 text-fg text-f-base font-semibold">
              <MapPin size={14} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
              {t('stops', { count: accountDraft.stopCount })}
            </div>
            <p className="text-muted text-f-xs">{t('lastModified', { time: relativeTime(accountDraft.lastModified) })}</p>
            <button
              onClick={onKeepAccount}
              className="w-full min-h-touch flex items-center justify-center rounded-lg text-f-sm font-semibold transition-colors hover:text-fg"
              style={{ border: '1px solid var(--lav-border)', color: 'var(--lav)' }}
            >
              {t('keep')}
            </button>
          </div>
        </div>

        <p className="text-center text-muted text-f-sm">
          {t('discardNote')}
        </p>
      </div>
    </div>
  );
}
