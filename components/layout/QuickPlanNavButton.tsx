'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { useQuickPlanOptional } from '@/contexts/QuickPlanContext';

// 퀵플랜 진입 버튼 — 로그인/인증 상태와 무관하게 항상 렌더링된다.
// (useAuth·useAuthGate 등 인증 훅을 의도적으로 쓰지 않는다. 이 컴포넌트에 로그인 분기를 넣지 말 것.)
interface Props {
  className:  string;
  style?:     CSSProperties;
  iconStyle?: CSSProperties;
  iconSize?:  number;
}

export default function QuickPlanNavButton({ className, style, iconStyle, iconSize = 24 }: Props) {
  const t   = useTranslations('nav');
  const ctx = useQuickPlanOptional();
  const isOpen = ctx?.isOpen ?? false;

  return (
    <button
      type="button"
      aria-label={t('quickPlan')}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      onClick={() => ctx?.open()}
      className={className}
      style={style}
    >
      <Sparkles size={iconSize} strokeWidth={2} className="shrink-0" style={iconStyle} />
    </button>
  );
}
