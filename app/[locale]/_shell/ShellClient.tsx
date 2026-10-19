'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import MobileDrawer from '@/components/layout/MobileDrawer';
import TopNav from '@/components/layout/TopNav';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import PageLayout from '@/components/layout/PageLayout';
import { AuthGateProvider, useAuthGate } from '@/contexts/AuthGateContext';
import { ToastProvider } from '@/contexts/ToastContext';
import AuthGateModal from '@/components/auth/AuthGateModal';
import DraftConflictModal from '@/components/auth/DraftConflictModal';
import ToastStack from '@/components/ui/Toast';
import { useDraftMigration } from '@/hooks/useDraftMigration';
import OfflineBanner from '@/components/layout/OfflineBanner';
import Analytics from '@/components/analytics/Analytics';
import CookieBanner from '@/components/analytics/CookieBanner';
import TermsGate from '@/components/legal/TermsGate';
import { QuickPlanProvider } from '@/contexts/QuickPlanContext';
import { isV2Live } from '@/lib/v2-live';
import QuickPlanModal from '@/components/quickplan/QuickPlanModal';

function ShellInner({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOpen, close } = useAuthGate();
  const { conflict, resolveKeepDevice, resolveKeepAccount } = useDraftMigration();

  return (
    <>
      <TermsGate />
      <Sidebar />
      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <TopNav onMobileMenuOpen={() => setMobileMenuOpen(true)} />
      <MobileBottomNav />
      <PageLayout>{children}</PageLayout>
      <OfflineBanner />
      <Analytics />
      <CookieBanner />
      <QuickPlanModal />
      <AuthGateModal open={isOpen} onDismiss={close} />
      {/* DEC-33 T3 — post-login draft collision (device draft vs. existing account draft) */}
      <DraftConflictModal
        open={!!conflict}
        deviceDraft={conflict?.deviceDraft  ?? { stopCount: 0, lastModified: new Date().toISOString() }}
        accountDraft={conflict?.accountDraft ?? { stopCount: 0, lastModified: new Date().toISOString() }}
        onKeepDevice={resolveKeepDevice}
        onKeepAccount={resolveKeepAccount}
      />
      <ToastStack />
    </>
  );
}

// New design (PD-53 update 2): /[locale]/v2/... preview pages, and the live areas listed in
// lib/v2-live.ts (served by the same v2 screens), bring their own shell from components/library,
// so they get the providers and analytics but none of the live chrome. V2Shell carries the terms
// gate, cookie banner and post-login draft migration in the new design.
const V2_PREVIEW = /^\/[^/]+\/v2(\/|$)/;
const isV2Page = (pathname: string) =>
  V2_PREVIEW.test(pathname) || isV2Live(pathname.replace(/^\/[^/]+/, ''));

export default function ShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname && isV2Page(pathname)) {
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
  return (
    <AuthProvider>
      <AuthGateProvider>
        <ToastProvider>
          <QuickPlanProvider>
            <ShellInner>{children}</ShellInner>
          </QuickPlanProvider>
        </ToastProvider>
      </AuthGateProvider>
    </AuthProvider>
  );
}
