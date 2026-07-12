'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from '@/i18n/navigation';

export type GateReason =
  | 'save_poi'         // save a POI
  | 'like'             // like a POI or plan
  | 'save_plan'        // publish own plan
  | 'save_plan_other'  // save someone else's plan
  | 'saved_tab'        // /saved nav or FL2 entry
  | 'profile_nav'      // profile / notifications nav
  | 'fl3_cap'          // FL3 6th request cap (in-overlay)
  | null;

// L9 — return-to-action across OAuth redirects. The pending action is a
// closure and cannot be serialized, so we persist the gate reason + return
// path as best effort: nav-type reasons resume exactly (tab/profile opens),
// write-type reasons return the user to the screen they were on to retap.
const PENDING_KEY    = 'b4k_auth_pending';
const PENDING_TTL_MS = 10 * 60 * 1000;

interface PersistedPending {
  reason:   Exclude<GateReason, null>;
  returnTo: string; // locale-less pathname
  ts:       number;
}

interface AuthGateContextValue {
  isOpen:               boolean;
  reason:               GateReason;
  open:                 (reason?: GateReason, pendingAction?: () => void | Promise<void>) => void;
  close:                () => void;
  executePendingAction: () => void;
  persistPendingAction: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const [isOpen,  setIsOpen]  = useState(false);
  const [reason,  setReason]  = useState<GateReason>(null);
  const pendingRef            = useRef<(() => void | Promise<void>) | null>(null);

  const { status } = useSession();
  const pathname   = usePathname();
  const router     = useRouter();
  const resumed    = useRef(false);

  const open = useCallback((
    r: GateReason = null,
    pendingAction?: () => void | Promise<void>,
  ) => {
    setReason(r);
    pendingRef.current = pendingAction ?? null;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setReason(null);
    pendingRef.current = null;
  }, []);

  const executePendingAction = useCallback(() => {
    if (pendingRef.current) {
      pendingRef.current();
      pendingRef.current = null;
    }
  }, []);

  // Called before an OAuth redirect leaves the page (L9).
  const persistPendingAction = useCallback(() => {
    if (!reason) return;
    try {
      const pending: PersistedPending = { reason, returnTo: pathname, ts: Date.now() };
      localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    } catch { /* storage unavailable — OAuth proceeds, action just won't resume */ }
  }, [reason, pathname]);

  // On return from OAuth: read the persisted descriptor, resume, clear.
  useEffect(() => {
    if (status !== 'authenticated' || resumed.current) return;
    resumed.current = true;

    let pending: PersistedPending | null = null;
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return;
      pending = JSON.parse(raw);
      localStorage.removeItem(PENDING_KEY);
    } catch { return; }

    if (!pending || Date.now() - pending.ts > PENDING_TTL_MS) return;

    const target =
      pending.reason === 'saved_tab'   ? '/saved'   :
      pending.reason === 'profile_nav' ? '/profile' :
      pending.returnTo;

    if (target && target !== pathname) router.push(target);
  }, [status, pathname, router]);

  return (
    <AuthGateContext.Provider value={{ isOpen, reason, open, close, executePendingAction, persistPendingAction }}>
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useAuthGate must be used within AuthGateProvider');
  return ctx;
}
