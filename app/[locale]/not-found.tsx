import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Compass } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('boundary.notFound');

  return (
    <main className="px-3.5 md:px-8 pt-7 pb-16 max-w-[1200px]" aria-label={t('title')}>
      <div
        className="flex flex-col items-center justify-center text-center py-20 px-6 rounded-none"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      >
        <Compass size={48} strokeWidth={2} className="text-muted-2 mb-4" />
        <p className="text-f-2xl font-bold text-fg mb-2">{t('title')}</p>
        <p className="text-f-md text-muted mb-5 max-w-[320px]">{t('desc')}</p>
        <Link
          href="/"
          className="inline-flex items-center min-h-touch px-4 rounded-full text-f-sm font-semibold text-lav"
          style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
        >
          {t('cta')}
        </Link>
      </div>
    </main>
  );
}
