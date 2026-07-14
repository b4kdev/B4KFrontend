'use client';

import { useState } from 'react';
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

function ShellInner({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOpen, close } = useAuthGate();
  const { conflict, resolveKeepDevice, resolveKeepAccount } = useDraftMigration();

  return (
    <>
      <Sidebar />
      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <TopNav onMobileMenuOpen={() => setMobileMenuOpen(true)} />
      <MobileBottomNav />
      <PageLayout>{children}</PageLayout>
      <OfflineBanner />
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

export default function ShellClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGateProvider>
        <ToastProvider>
          <ShellInner>{children}</ShellInner>
        </ToastProvider>
      </AuthGateProvider>
    </AuthProvider>
  );
}
