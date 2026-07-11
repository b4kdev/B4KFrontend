'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

export type GateReason =
  | 'save_poi'         // save a POI
  | 'like'             // like a POI or plan
  | 'save_plan'        // publish own plan
  | 'save_plan_other'  // save someone else's plan
  | 'saved_tab'        // /saved nav or FL2 entry
  | 'profile_nav'      // profile / notifications nav
  | 'fl3_cap'          // FL3 6th request cap (in-overlay)
  | null;

interface AuthGateContextValue {
  isOpen:               boolean;
  reason:               GateReason;
  open:                 (reason?: GateReason, pendingAction?: () => void | Promise<void>) => void;
  close:                () => void;
  executePendingAction: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const [isOpen,  setIsOpen]  = useState(false);
  const [reason,  setReason]  = useState<GateReason>(null);
  const pendingRef            = useRef<(() => void | Promise<void>) | null>(null);

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

  return (
    <AuthGateContext.Provider value={{ isOpen, reason, open, close, executePendingAction }}>
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useAuthGate must be used within AuthGateProvider');
  return ctx;
}
