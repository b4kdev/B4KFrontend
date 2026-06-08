'use client';

import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import PageLayout from '@/components/layout/PageLayout';
import { AuthGateProvider, useAuthGate } from '@/contexts/AuthGateContext';
import { ToastProvider } from '@/contexts/ToastContext';
import AuthGateModal from '@/components/auth/AuthGateModal';
import ToastStack from '@/components/ui/Toast';

function ShellInner({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOpen, close } = useAuthGate();

  return (
    <>
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <TopNav
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
        notifCount={3}
      />
      <MobileBottomNav />
      <PageLayout>{children}</PageLayout>
      <AuthGateModal open={isOpen} onDismiss={close} />
      <ToastStack />
    </>
  );
}

export default function ShellClient({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthGateProvider>
        <ToastProvider>
          <ShellInner>{children}</ShellInner>
        </ToastProvider>
      </AuthGateProvider>
    </SessionProvider>
  );
}
