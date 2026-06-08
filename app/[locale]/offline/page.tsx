import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  const t = useTranslations('boundary.offline');

  return (
    <main className="px-3.5 md:px-8 pt-7 pb-16 max-w-[1200px]" aria-label={t('title')}>
      <div
        className="flex flex-col items-center justify-center text-center py-20 px-6 rounded-lg"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      >
        <WifiOff size={48} strokeWidth={2} className="text-muted-2 mb-4" />
        <p className="text-[20px] font-bold text-fg mb-2">{t('title')}</p>
        <p className="text-[13px] text-muted max-w-[320px]">{t('desc')}</p>
      </div>
    </main>
  );
}
