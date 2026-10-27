'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/lib/api';
import { clearDraftAnswers, clearDraftTags, readDraftAnswers, readDraftTags } from '@/lib/quickplan';

// 퀵플랜 모달의 전역 진입점. 사이드바 버튼은 호출자 중 하나일 뿐 —
// 어느 페이지/컴포넌트에서든 `useQuickPlan().open()` 으로 열 수 있다.
// 플랜 저장은 모달이 아니라 지도 "내 플랜" 패널("내 플랜으로 저장")이 담당한다.
interface QuickPlanContextValue {
  isOpen: boolean;
  open:   () => void;
  close:  () => void;
}

const QuickPlanContext = createContext<QuickPlanContextValue | null>(null);

export function QuickPlanProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading }   = useAuth();
  const { showToast }       = useToast();
  const t                   = useTranslations('quickPlan');
  const syncingTags         = useRef(false);

  const open  = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // 게스트가 고른 칩은 로컬에 보관돼 있다 → 로그인되면 서버에 저장.
  // Quick plan 답변(목적지·날짜·동행)도 같이 올린다 — 조용히, 실패하면 다음 로그인 때 다시.
  useEffect(() => {
    if (loading || !user) return;
    const answers = readDraftAnswers();
    if (answers) apiFetch('/me/quick-plan', { method: 'PUT', body: JSON.stringify(answers) }).then(clearDraftAnswers).catch(() => {});
  }, [user, loading]);

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

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);
  return <QuickPlanContext.Provider value={value}>{children}</QuickPlanContext.Provider>;
}

/** 컨텍스트가 없어도 throw 하지 않는 버전 — 사이드바 버튼처럼 "항상 보여야 하는" UI 용. */
export function useQuickPlanOptional() {
  return useContext(QuickPlanContext);
}

export function useQuickPlan() {
  const ctx = useContext(QuickPlanContext);
  if (!ctx) throw new Error('useQuickPlan must be used within QuickPlanProvider');
  return ctx;
}
