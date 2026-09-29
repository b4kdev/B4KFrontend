'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useMapOnboarding } from '@/contexts/MapOnboardingContext';
import { useInterests } from '@/hooks/useInterests';
import { apiFetch } from '@/lib/api';
import {
  MAX_INTEREST_CHIPS, cityToApiRegion, labelOf, readDraftTags, saveDraftTags,
  type Companion, type OnboardingCity,
} from '@/lib/onboarding';
import StepWhere from './StepWhere';
import StepTaste from './StepTaste';
import StepConfirm from './StepConfirm';
import StepResult from './StepResult';
import type { DateRange } from './RangeCalendar';

type Step = 1 | 2 | 3 | 4;
const STEPS: Step[] = [1, 2, 3, 4];
const STEP_KEYS = { 1: 'where', 2: 'taste', 3: 'confirm', 4: 'result' } as const;

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// 마운트될 때마다 상태가 초기화되도록 바깥 컴포넌트는 isOpen 일 때만 안쪽을 렌더한다.
export default function MapOnboardingModal() {
  const { isOpen } = useMapOnboarding();
  return isOpen ? <ModalBody /> : null;
}

function ModalBody() {
  const t      = useTranslations('mapOnboarding');
  const lang   = useLocale();
  const { close } = useMapOnboarding();
  const { user }  = useAuth();
  const { showToast } = useToast();
  const { categories, isLoading, isError, retry } = useInterests(true);

  const [step, setStep]           = useState<Step>(1);
  const [city, setCity]           = useState<OnboardingCity | null>(null);
  const [range, setRange]         = useState<DateRange>({ start: null, end: null });
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [tags, setTags]           = useState<string[]>(() => readDraftTags() ?? []);
  const [saving, setSaving]       = useState(false);
  const touchedTags               = useRef(false);
  const panelRef                  = useRef<HTMLDivElement>(null);

  // 로그인 사용자는 서버에 저장된 취향으로 미리 채운다 (사용자가 이미 만졌다면 덮어쓰지 않음).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiFetch<{ interest_tags: string[] }>('/me/interests')
      .then(r => { if (!cancelled && !touchedTags.current && r.interest_tags?.length) setTags(r.interest_tags); })
      .catch(() => { /* 프리필 실패는 조용히 무시 — 빈 상태로 시작 */ });
    return () => { cancelled = true; };
  }, [user]);

  const labelBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const cat of categories) for (const c of cat.chips) m.set(c.slug, labelOf(c, lang));
    return m;
  }, [categories, lang]);
  const labelFor = useCallback((slug: string) => labelBySlug.get(slug) ?? slug, [labelBySlug]);

  const toggleTag = useCallback((slug: string) => {
    touchedTags.current = true;
    setTags(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug)
        : prev.length >= MAX_INTEREST_CHIPS ? prev : [...prev, slug]);
  }, []);

  // 확인 → 결과. 로그인: PUT /me/interests (실패해도 결과는 보여준다). 게스트: 로컬에만 보관 (로그인 유도는 "일정으로 저장" 을 누를 때만).
  async function build() {
    if (saving) return;
    if (!user) {
      saveDraftTags(tags);
      setStep(4);
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/me/interests', { method: 'PUT', body: JSON.stringify({ tags, completed: true }) });
    } catch {
      showToast(t('saveFailed'), 'error');
    } finally {
      setSaving(false);
      setStep(4);
    }
  }

  // 건너뛰기 — 로그인이면 tags: [] 로 호출해도 onboarded_at 이 기록된다.
  async function skipTaste() {
    setTags([]);
    touchedTags.current = true;
    setStep(3);
  }

  // Escape · focus trap · scroll lock (AuthGateModal 과 동일 패턴)
  useEffect(() => {
    const el = panelRef.current;
    const id = setTimeout(() => (el?.querySelector<HTMLElement>(FOCUSABLE) ?? el)?.focus(), 50);
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab' || !el) return;
      const f = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { clearTimeout(id); document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [close]);

  const canNext = step === 1 ? city !== null : true;
  const railSummary = [city && t(`cities.${city}`), companion && t(`who.${companion}`)].filter(Boolean).join(' · ');

  return (
    <div className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center" role="dialog" aria-modal="true" aria-label={t('ariaLabel')}>
      <div className="absolute inset-0 bg-backdrop-50" onClick={close} aria-hidden="true" />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full ${step === 4 ? 'lg:w-[1080px]' : 'lg:w-[920px]'} max-w-[calc(100vw-32px)] max-h-[92vh] lg:max-h-[92vh] flex flex-col lg:flex-row bg-bg-2 outline-none rounded-none`}
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
      >
        {/* 진행 레일 */}
        <ol className="lg:w-[168px] shrink-0 flex lg:flex-col gap-sp-3 lg:gap-sp-4 p-sp-4 lg:p-sp-5 bg-bg-3 overflow-x-auto">
          <li className="hidden lg:block text-f-xs text-muted">{t('title')}</li>
          {STEPS.map(s => {
            const on = s === step, done = s < step;
            return (
              <li key={s} aria-current={on ? 'step' : undefined} className={`flex items-center gap-sp-2 text-f-sm whitespace-nowrap ${on ? 'text-fg font-medium' : done ? 'text-muted' : 'text-muted-2'}`}>
                <span className={`w-5 h-5 shrink-0 flex items-center justify-center rounded-full border text-f-xxs ${on ? 'bg-fg text-bg border-fg' : 'border-line'}`}>
                  {done ? <Check size={11} strokeWidth={3} aria-hidden="true" /> : s}
                </span>
                {t(`steps.${STEP_KEYS[s]}`)}
              </li>
            );
          })}
          {step > 1 && railSummary && (
            <li className="hidden lg:block mt-auto text-f-xs text-muted bg-bg-2 p-sp-2 rounded-none">{railSummary}</li>
          )}
        </ol>

        {/* 본문 */}
        <div className="flex-1 min-w-0 flex flex-col p-sp-4 lg:p-sp-5 gap-sp-4 overflow-y-auto">
          <header className="flex items-start justify-between gap-sp-3">
            <div>
              <h3 className="text-f-xl font-semibold text-fg">{t(`${STEP_KEYS[step]}.title`)}</h3>
              <p className="text-f-sm text-muted mt-sp-1">{t(`${STEP_KEYS[step]}.subtitle`)}</p>
            </div>
            {step === 2 && <span className="text-f-base font-medium text-fg shrink-0" aria-live="polite">{tags.length}/{MAX_INTEREST_CHIPS}</span>}
            <button type="button" onClick={close} aria-label={t('close')} className="min-w-touch min-h-touch -mt-sp-2 -mr-sp-2 flex items-center justify-center text-fg hover:bg-muted-3 rounded-none shrink-0">
              <X size={20} strokeWidth={2} style={{ opacity: 0.5 }} />
            </button>
          </header>

          <div className="flex-1 min-h-0">
            {step === 1 && <StepWhere city={city} range={range} companion={companion} onCity={setCity} onRange={setRange} onCompanion={setCompanion} />}
            {step === 2 && <StepTaste categories={categories} isLoading={isLoading} isError={isError} onRetry={retry} tags={tags} onToggle={toggleTag} />}
            {step === 3 && <StepConfirm city={city} range={range} companion={companion} tagLabels={tags.map(labelFor)} onEdit={setStep} />}
            {step === 4 && (
              <div className="flex flex-col gap-sp-3">
                {!user && (
                  <p className="text-f-sm text-fg bg-muted-3 px-sp-4 py-sp-3 rounded-none">{t('result.guestBanner')}</p>
                )}
                <StepResult region={city ? cityToApiRegion(city) : null} tags={tags} range={range} labelFor={labelFor} onNavigate={close} />
              </div>
            )}
          </div>

          <footer className="flex items-center justify-between border-t border-line pt-sp-3">
            {step === 1 && <button type="button" onClick={close} className="min-h-touch text-f-sm text-muted hover:text-fg">{t('later')}</button>}
            {step > 1 && step < 4 && <button type="button" onClick={() => setStep((step - 1) as Step)} className="min-h-touch text-f-sm text-muted hover:text-fg">{t('prev')}</button>}
            {step === 4 && <button type="button" onClick={() => setStep(2)} className="min-h-touch text-f-sm text-muted hover:text-fg">{t('result.editTaste')}</button>}

            <div className="flex items-center gap-sp-4">
              {step === 2 && <button type="button" onClick={skipTaste} className="min-h-touch text-f-sm text-muted hover:text-fg">{t('taste.skip')}</button>}
              {step < 3 && (
                <button type="button" disabled={!canNext} onClick={() => setStep((step + 1) as Step)}
                  className="min-h-touch px-sp-6 bg-fg text-bg text-f-sm font-semibold rounded-none disabled:opacity-30 disabled:cursor-not-allowed">
                  {t('next')}
                </button>
              )}
              {step === 3 && (
                <button type="button" disabled={saving} onClick={build}
                  className="min-h-touch px-sp-6 bg-fg text-bg text-f-sm font-semibold rounded-none disabled:opacity-50">
                  {saving ? t('saving') : t('confirm.cta')}
                </button>
              )}
              {step === 4 && (
                <button type="button" onClick={close} className="min-h-touch px-sp-6 bg-fg text-bg text-f-sm font-semibold rounded-none">{t('done')}</button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
