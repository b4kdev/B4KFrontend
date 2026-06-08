import { useTranslations } from 'next-intl';
import { Film } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function Page() {
  const t = useTranslations('routes.contentsKdrama');

  return (
    <main className="px-3.5 md:px-8 pt-7 pb-16 max-w-[1200px]" aria-label={t('title')}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted mb-5">
        <Link href="/" className="text-muted-2 hover:text-fg">B4K</Link>
        <span>›</span>
        <Link href="/explore" className="text-muted-2 hover:text-fg">{t('crumb.explore')}</Link>
        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>
      <h1 className="text-fg font-display font-black text-[clamp(20px,2.5vw,32px)] mb-7">{t('title')}</h1>
      <div
        className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-lg"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      >
        <Film size={40} strokeWidth={2} className="text-muted-2 mb-4" />
        <p className="text-[16px] font-semibold text-fg mb-2">{t('empty.title')}</p>
        <p className="text-[13px] text-muted max-w-[320px]">{t('empty.desc')}</p>
      </div>
    </main>
  );
}
