'use client';

import { createContext, useContext, useState, useCallback } from 'react';

export type GateReason = 'plan' | 'save' | 'like' | 'save_poi' | 'saved_tab' | null;

interface AuthGateContextValue {
  isOpen:  boolean;
  reason:  GateReason;
  open:    (reason?: GateReason) => void;
  close:   () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen]   = useState(false);
  const [reason, setReason]   = useState<GateReason>(null);

  const open  = useCallback((r: GateReason = null) => { setReason(r); setIsOpen(true); }, []);
  const close = useCallback(() => { setIsOpen(false); setReason(null); }, []);

  return (
    <AuthGateContext.Provider value={{ isOpen, reason, open, close }}>
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useAuthGate must be used within AuthGateProvider');
  return ctx;
}
