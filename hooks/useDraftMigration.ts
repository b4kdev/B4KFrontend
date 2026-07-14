'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getDraftPlan, clearDraftPlan, type DraftPlan } from '@/lib/draft-plan';
import type { PlanDraft } from '@/app/api/plans/draft/route';
import type { DraftMeta } from '@/components/auth/DraftConflictModal';

export interface PostLoginConflict {
  deviceDraft:  DraftMeta;
  accountDraft: DraftMeta;
  dbDraftId:    string;
  localDraft:   DraftPlan;
}

// On first login: migrate any localStorage guest draft → DB.
// DEC-33 T3 — before migrating, check whether the account already has an
// unpublished DB draft. If not, migrate directly (safe, unchanged behavior).
// If one exists, surface the conflict instead of silently clobbering either
// side — caller renders DraftConflictModal and calls resolveKeepDevice /
// resolveKeepAccount once the user picks.
export function useDraftMigration() {
  const { status } = useSession();
  const attempted = useRef(false);
  const [conflict, setConflict] = useState<PostLoginConflict | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || attempted.current) return;
    attempted.current = true;

    const localDraft = getDraftPlan();
    if (!localDraft || localDraft.stops.length === 0) return;

    fetch('/api/plans/draft')
      .then(res => res.ok ? res.json() as Promise<PlanDraft | null> : null)
      .then(dbDraft => {
        if (!dbDraft?.id) {
          // No competing DB draft — safe to migrate directly.
          return fetch('/api/plans/draft', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(localDraft),
          }).then(res => { if (res.ok) clearDraftPlan(); });
        }

        // DEC-33 T3 — both a local and an account draft exist. Don't touch
        // either until the user picks; render the modal.
        setConflict({
          deviceDraft:  { stopCount: localDraft.stops.length, lastModified: new Date().toISOString() },
          accountDraft: { stopCount: dbDraft.stop_count,       lastModified: dbDraft.updated_at },
          dbDraftId:    dbDraft.id,
          localDraft,
        });
      })
      .catch(() => { /* silent — draft stays in localStorage for next session */ });
  }, [status]);

  // Pick local draft: hard-delete the DB draft, migrate local → DB, clear local.
  const resolveKeepDevice = useCallback(() => {
    if (!conflict) return;
    fetch(`/api/plans/${conflict.dbDraftId}`, { method: 'DELETE' })
      .then(() => fetch('/api/plans/draft', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(conflict.localDraft),
      }))
      .then(res => { if (res.ok) clearDraftPlan(); })
      .catch(() => { /* leave local draft in place on failure — retry next login */ })
      .finally(() => setConflict(null));
  }, [conflict]);

  // Pick account draft: discard the local draft. DB draft stays authoritative;
  // MapView's existing T1 flow loads it once the user visits the map.
  const resolveKeepAccount = useCallback(() => {
    clearDraftPlan();
    setConflict(null);
  }, []);

  return { conflict, resolveKeepDevice, resolveKeepAccount };
}
