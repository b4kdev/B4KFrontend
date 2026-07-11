'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getDraftPlan, clearDraftPlan } from '@/lib/draft-plan';

// On first login: migrate any localStorage guest draft → DB, then clear it.
// Fires once per mount cycle; safe to re-run if draft was already cleared (getDraftPlan returns null).
export function useDraftMigration() {
  const { status } = useSession();
  const attempted = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || attempted.current) return;
    attempted.current = true;

    const draft = getDraftPlan();
    if (!draft) return;

    fetch('/api/plans/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
      .then(res => { if (res.ok) clearDraftPlan(); })
      .catch(() => { /* silent — draft stays in localStorage for next session */ });
  }, [status]);
}
