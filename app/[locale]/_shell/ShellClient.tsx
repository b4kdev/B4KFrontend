'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGateProvider } from '@/contexts/AuthGateContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Analytics from '@/components/analytics/Analytics';
import { QuickPlanProvider } from '@/contexts/QuickPlanContext';

// Every page is on the new design (PD-53 update 2): the v2 pages bring their own shell from
// components/library (V2Shell: terms gate, cookie banner, post-login draft migration), so this
// only adds the providers and analytics.
export default function ShellClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGateProvider>
        <ToastProvider>
          <QuickPlanProvider>
            {children}
            <Analytics />
          </QuickPlanProvider>
        </ToastProvider>
      </AuthGateProvider>
    </AuthProvider>
  );
}
