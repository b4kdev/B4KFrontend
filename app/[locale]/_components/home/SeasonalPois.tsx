import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { MapPin } from 'lucide-react';
import SectionHead from './SectionHead';

export default function SeasonalPois() {
  const t = useTranslations('home.seasonalPois');

  return (
    <section className="mb-11" aria-label={t('title')}>
      <SectionHead
        title={t('title')}
        subtitle={t('subtitle')}
        seeAllLabel={t('seeAll')}
      />
      <div
        className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-lg"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      >
        <MapPin size={32} strokeWidth={2} className="text-muted-2 mb-3" />
        <p className="text-[14px] font-semibold text-fg mb-1">{t('empty.title')}</p>
        <p className="text-[12px] text-muted mb-4 max-w-[280px]">{t('empty.desc')}</p>
        <Link
          href="/map"
          className="inline-flex items-center min-h-touch px-4 rounded-full text-[12px] font-semibold text-lav"
          style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
        >
          {t('empty.cta')}
        </Link>
      </div>
    </section>
  );
}
