'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const t = useTranslations('boundary.offline');
  const pathname = usePathname();
  // SC-26 (OFF_01) — map page gets a context-specific line (cached view note).
  const isMapPage = pathname?.includes('/map');
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[200] flex items-center justify-center gap-sp-2 py-[6px] px-sp-4 text-f-sm font-semibold text-fg"
      style={{ background: 'var(--warning)', color: 'var(--bg)' }}
    >
      <WifiOff size={13} strokeWidth={2} aria-hidden="true" />
      {t(isMapPage ? 'titleMap' : 'title')}
    </div>
  );
}
