import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

function isoWeek(d = new Date()): number {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const jan4 = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const dayDiff = (target.getTime() - jan4.getTime()) / 86400000;
  return 1 + Math.round((dayDiff - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
}

export default function LeaderboardStrip() {
  const t = useTranslations('home.leaderboard');
  const week = isoWeek();

  return (
    <Link
      href="/leaderboard"
      className="flex items-center gap-5 rounded-lg px-6 py-[18px] mb-11 cursor-pointer transition-colors hover:bg-bg-3"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      aria-label={t('cta')}
    >
      <span className="text-[28px] shrink-0" aria-hidden>
        🏆
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-f-base font-bold text-fg mb-[3px]">
          {t('title', { week })}
        </p>
        <p className="text-f-sm text-muted leading-[1.5]">{t('desc')}</p>
      </div>
      <div className="hidden md:flex items-center gap-1 text-muted text-f-xs font-semibold tracking-[0.05em] shrink-0">
        {t('cta')}
        <ArrowRight size={12} strokeWidth={2} />
      </div>
    </Link>
  );
}
