import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Music, Tv, Sparkles, Globe } from 'lucide-react'

const CATEGORIES = [
  { id: 'k-pop',     href: '/explore/k-pop',     icon: Music,    tKey: 'kpop',     color: 'text-lav' },
  { id: 'k-drama',   href: '/explore/k-drama',   icon: Tv,       tKey: 'kdrama',   color: 'text-info' },
  { id: 'k-beauty',  href: '/explore/k-beauty',  icon: Sparkles, tKey: 'kbeauty',  color: 'text-warning' },
  { id: 'k-culture', href: '/explore/k-culture', icon: Globe,    tKey: 'kculture', color: 'text-success' },
] as const

export default function ExploreHubPage() {
  const t = useTranslations('explore')

  return (
    <main
      className="max-w-[1200px] mx-auto px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-20"
      aria-label={t('title')}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg transition-colors">B4K</Link>
        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>

      <h1 className="font-display font-black text-fg text-[clamp(22px,2.5vw,34px)] mb-sp-2">
        {t('hub.title')}
      </h1>
      <p className="text-[14px] text-muted mb-sp-8">{t('hub.subtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sp-4">
        {CATEGORIES.map(({ id, href, icon: Icon, tKey, color }) => (
          <Link
            key={id}
            href={href}
            className="flex items-start gap-sp-4 p-sp-5 rounded-xl transition-colors group"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
            aria-label={t(`${tKey}.title`)}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-[2px]"
              style={{ background: 'var(--bg-3)' }}
            >
              <Icon size={20} strokeWidth={2} className={color} />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-fg mb-[3px] group-hover:text-lav transition-colors">
                {t(`${tKey}.title`)}
              </p>
              <p className="text-[13px] text-muted leading-relaxed">
                {t(`hub.${tKey}.desc`)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
