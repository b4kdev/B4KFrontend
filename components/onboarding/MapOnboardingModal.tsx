'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useMapOnboarding } from '@/contexts/MapOnboardingContext';
import { useInterests } from '@/hooks/useInterests';
import { apiFetch } from '@/lib/api';
import { useRouter } from '@/i18n/navigation';
import {
  MAX_INTEREST_CHIPS, RESULT_LIMIT, cityToApiRegion, labelOf, placeName, readDraftTags, saveCourseHandoff, saveDraftTags,
  type Companion, type OnboardingCity, type OnboardingPlace,
} from '@/lib/onboarding';
import StepWhere from './StepWhere';
import StepTaste from './StepTaste';
import StepConfirm from './StepConfirm';
import type { DateRange } from './RangeCalendar';
import { buildCourse, courseDayCount } from '@/lib/onboarding-course';

type Step = 1 | 2 | 3;
const STEPS: Step[] = [1, 2, 3];
const STEP_KEYS = { 1: 'where', 2: 'taste', 3: 'confirm' } as const;

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
  const router    = useRouter();
  const { user }  = useAuth();
  const { showToast } = useToast();
  const { categories, isLoading, isError, retry } = useInterests(true);

  const [step, setStep]           = useState<Step>(1);
  const [city, setCity]           = useState<OnboardingCity | null>(null);
  const [range, setRange]         = useState<DateRange>({ start: null, end: null });
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [tags, setTags]           = useState<string[]>(() => readDraftTags() ?? []);
  const [saving, setSaving]       = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [showTasteError, setShowTasteError] = useState(false);
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

  // 확인 → "내 일정으로 저장": 코스를 만들어 지도 "내 플랜"(기존 플랜 프리뷰 패널)로 넘기고 모달을 닫는다.
  // 플랜 게시(저장)는 거기서 "내 플랜으로 저장" 으로. 취향은 로그인이면 PUT /me/interests (실패해도 진행),
  // 게스트면 로컬 보관(로그인 시 컨텍스트가 동기화).
  async function saveAndGo() {
    if (saving) return;
    setSaving(true);
    try {
      if (user) {
        await apiFetch('/me/interests', { method: 'PUT', body: JSON.stringify({ tags, completed: true }) })
          .catch(() => showToast(t('saveFailed'), 'error'));
      } else {
        saveDraftTags(tags);
      }

      const params = new URLSearchParams({ limit: String(RESULT_LIMIT) });
      if (city) params.set('region', cityToApiRegion(city));
      if (tags.length > 0) { params.set('tags', tags.join(',')); params.set('sort', 'match'); }
      const places = await apiFetch<OnboardingPlace[]>(`/places?${params.toString()}`);
      const course = buildCourse(places ?? [], courseDayCount(range.start, range.end));
      const stops  = course.flatMap((day, i) => day.map(p => ({
        poi_id:            String(p.poi_id),
        name_ko:           p.name_ko,
        name_preferred:    placeName(p, lang),
        coords_lat:        p.coords_lat,
        coords_lng:        p.coords_lng,
        display_region:    p.display_region,
        primary_image_url: p.primary_image_url ?? undefined,
        day:               i + 1,
      })));
      if (stops.length === 0) {
        showToast(t('result.emptyDesc'), 'error');
        return;
      }
      saveCourseHandoff(stops);
      close();
      router.push('/map?from=onboarding');
    } catch {
      showToast(t('result.error'), 'error');
    } finally {
      setSaving(false);
    }
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

  // 1단계는 어디·언제·누구와 모두 필수. 빠진 채로 "다음" 을 누르면 해당 라벨을 빨간색으로 표시하고 막는다.
  const missing = { city: city === null, range: !range.start || !range.end, companion: companion === null };
  const step1Done = !missing.city && !missing.range && !missing.companion;
  // 2단계도 취향을 하나 이상 골라야 넘어간다.
  const canNext = step === 1 ? step1Done : step === 2 ? tags.length > 0 : true;

  function next() {
    if (step === 1 && !step1Done) { setShowErrors(true); return; }
    if (step === 2 && tags.length === 0) { setShowTasteError(true); return; }
    setStep((step + 1) as Step);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center" role="dialog" aria-modal="true" aria-label={t('ariaLabel')}>
      <div className="absolute inset-0 bg-backdrop-50" onClick={close} aria-hidden="true" />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full lg:w-[864px] lg:h-[595px] max-w-[calc(100vw-32px)] max-h-[92vh] flex flex-col bg-bg-2 outline-none rounded-none"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
      >
        {/* 상단 바 — 진행 단계(현재만 굵게·검은 원) + 닫기. 본문과 옅은 선으로 구분 */}
        <div className="shrink-0 flex items-center justify-between gap-sp-3 pl-sp-4 pr-sp-1 border-b border-line">
          <ol className="flex items-center gap-sp-2 text-f-sm whitespace-nowrap overflow-x-auto scrollbar-hide">
            {STEPS.map((s, i) => {
              const on = s === step;
              return (
                <li key={s} aria-current={on ? 'step' : undefined} className="flex items-center gap-sp-2">
                  {i > 0 && <span className="text-muted-2" aria-hidden="true">›</span>}
                  <span className={`flex items-center gap-sp-1 ${on ? 'text-fg font-bold' : 'text-muted-2'}`}>
                    <span className={`w-5 h-5 shrink-0 flex items-center justify-center rounded-full border text-f-xxs ${on ? 'bg-fg text-bg border-fg' : 'border-current'}`}>{s}</span>
                    {t(`steps.${STEP_KEYS[s]}`)}
                  </span>
                </li>
              );
            })}
          </ol>
          <button type="button" onClick={close} aria-label={t('close')} className="min-w-touch min-h-touch flex items-center justify-center text-fg hover:bg-muted-3 rounded-none shrink-0">
            <X size={20} strokeWidth={2} style={{ opacity: 0.5 }} />
          </button>
        </div>

        {/* 본문 — 데스크톱은 모든 단계를 같은 크기 864×595 로 고정해 스크롤 없이 한 화면.
            화면이 그보다 낮거나 모바일이면 본문만 스크롤(스크롤바 숨김) */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col p-sp-4 gap-sp-3 overflow-y-auto scrollbar-hide">
          <header className="flex items-start justify-between gap-sp-3">
            <div>
              <h3 className="text-f-xl font-semibold text-fg">{t(`${STEP_KEYS[step]}.title`)}</h3>
              <p className="text-f-sm text-muted mt-sp-1">{t(`${STEP_KEYS[step]}.subtitle`)}</p>
            </div>
          </header>

          <div className="flex-1 min-h-0 flex flex-col">
            {step === 1 && <StepWhere city={city} range={range} companion={companion} onCity={setCity} onRange={setRange} onCompanion={setCompanion} errors={showErrors ? missing : undefined} />}
            {step === 2 && <StepTaste categories={categories} isLoading={isLoading} isError={isError} onRetry={retry} tags={tags} onToggle={toggleTag} error={showTasteError && tags.length === 0} />}
            {step === 3 && <StepConfirm city={city} range={range} companion={companion} tagLabels={tags.map(labelFor)} onEdit={setStep} />}
          </div>
        </div>

        {/* 하단 버튼 — 스크롤 밖에 고정 (모바일에선 시트 하단 = 화면 맨 아래, 홈 인디케이터 여백 포함) */}
        <footer className="shrink-0 flex items-center justify-between gap-sp-3 border-t border-line px-sp-4 pt-sp-2"
          style={{ paddingBottom: 'calc(var(--sp-2) + env(safe-area-inset-bottom))' }}>
          {step === 1 && <span />}
          {step > 1 && <button type="button" onClick={() => setStep((step - 1) as Step)} className="min-h-touch text-f-sm text-muted hover:text-fg">{t('prev')}</button>}

          <div className="flex items-center gap-sp-4">
            {step < 3 && (
              <button type="button" onClick={next} aria-disabled={!canNext}
                className={`min-h-touch px-sp-6 bg-fg text-bg text-f-sm font-semibold rounded-none ${canNext ? '' : 'opacity-30'}`}>
                {t('next')}
              </button>
            )}
            {step === 3 && (
              <button type="button" disabled={saving} onClick={saveAndGo}
                className="min-h-touch px-sp-6 bg-fg text-bg text-f-sm font-semibold rounded-none disabled:opacity-50">
                {saving ? t('saving') : t('confirm.save')}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
