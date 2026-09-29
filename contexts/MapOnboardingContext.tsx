'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from '@/i18n/navigation';
import { apiFetch } from '@/lib/api';
import type { BffItinerary } from '@/lib/itinerary';
import {
  clearDraftTags, clearPendingPlan, readDraftTags, readPendingPlan, savePendingPlan,
  type NewItineraryBody,
} from '@/lib/onboarding';

export type PlanSavePhase = 'idle' | 'saving' | 'saved';

// 맞춤 지도 온보딩 모달의 전역 진입점. 사이드바 버튼은 호출자 중 하나일 뿐 —
// 어느 페이지/컴포넌트에서든 `useMapOnboarding().open()` 으로 열 수 있다.
interface MapOnboardingContextValue {
  isOpen:   boolean;
  open:     () => void;
  close:    () => void;
  /** 코스를 내 일정으로 저장. 로그인 상태면 바로 저장, 아니면 로그인 유도 후 로그인 직후 자동 저장. */
  savePlan: (body: NewItineraryBody) => void;
  planSave: PlanSavePhase;
}

const MapOnboardingContext = createContext<MapOnboardingContextValue | null>(null);

export function MapOnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen]     = useState(false);
  const [planSave, setPlanSave] = useState<PlanSavePhase>('idle');
  const { user, loading }       = useAuth();
  const { open: openAuthGate }  = useAuthGate();
  const { showToast }           = useToast();
  const router                  = useRouter();
  const t                       = useTranslations('mapOnboarding');
  const syncingTags             = useRef(false);
  const savingPlan              = useRef(false);

  const open  = useCallback(() => { setPlanSave('idle'); setIsOpen(true); }, []);
  const close = useCallback(() => setIsOpen(false), []);

  const postPlan = useCallback(async (body: NewItineraryBody) => {
    if (savingPlan.current) return;
    savingPlan.current = true;
    clearPendingPlan();
    setPlanSave('saving');
    try {
      const created = await apiFetch<BffItinerary>('/itineraries', { method: 'POST', body: JSON.stringify(body) });
      setPlanSave('saved');
      showToast(t('result.planSaved'), 'success', {
        label: t('result.planSavedView'),
        onClick: () => { setIsOpen(false); router.push(`/plan/${created.itinerary_id}`); },
      });
    } catch {
      setPlanSave('idle');
      showToast(t('result.planSaveFailed'), 'error');
    } finally {
      savingPlan.current = false;
    }
  }, [showToast, t, router]);

  const savePlan = useCallback((body: NewItineraryBody) => {
    if (user) { void postPlan(body); return; }
    // 게스트 — 로컬에 보관하고 로그인 유도. 로그인(OAuth 리다이렉트 포함) 되면 아래 effect 가 전송한다.
    savePendingPlan(body);
    openAuthGate('onboarding_save');
  }, [user, postPlan, openAuthGate]);

  // 게스트가 고른 칩은 로컬에 보관돼 있다 → 로그인되면 서버에 저장.
  useEffect(() => {
    if (loading || !user || syncingTags.current) return;
    const tags = readDraftTags();
    if (!tags) return;
    syncingTags.current = true;
    apiFetch('/me/interests', { method: 'PUT', body: JSON.stringify({ tags, completed: true }) })
      .then(() => { clearDraftTags(); showToast(t('savedToast'), 'success'); })
      .catch(() => showToast(t('saveFailed'), 'error'))
      .finally(() => { syncingTags.current = false; });
  }, [user, loading, showToast, t]);

  // 로그인 전에 눌러 둔 "일정으로 저장" 이 있으면 로그인 직후 저장.
  useEffect(() => {
    if (loading || !user) return;
    const pending = readPendingPlan();
    if (pending) void postPlan(pending);
  }, [user, loading, postPlan]);

  const value = useMemo(() => ({ isOpen, open, close, savePlan, planSave }), [isOpen, open, close, savePlan, planSave]);
  return <MapOnboardingContext.Provider value={value}>{children}</MapOnboardingContext.Provider>;
}

/** 컨텍스트가 없어도 throw 하지 않는 버전 — 사이드바 버튼처럼 "항상 보여야 하는" UI 용. */
export function useMapOnboardingOptional() {
  return useContext(MapOnboardingContext);
}

export function useMapOnboarding() {
  const ctx = useContext(MapOnboardingContext);
  if (!ctx) throw new Error('useMapOnboarding must be used within MapOnboardingProvider');
  return ctx;
}
