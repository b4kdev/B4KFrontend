import { useTranslations } from 'next-intl';
import MainCarousel from './_components/home/MainCarousel';
import TopPlans from './_components/home/TopPlans';
import LeaderboardStrip from './_components/home/LeaderboardStrip';
import SeasonalPois from './_components/home/SeasonalPois';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div className="px-3.5 md:px-8 pt-7 pb-16 max-w-[1200px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted mb-5">
        <span className="text-muted-2">B4K</span>
        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>

      <MainCarousel />
      <TopPlans />
      <LeaderboardStrip />
      <SeasonalPois />
    </div>
  );
}
