'use client'

import { ArrowRight } from 'lucide-react'
import { useLocale } from 'next-intl'
import { Link as IntlLink } from '@/i18n/navigation'
import { categoryStyle, Image } from '@/components/library'
import { cn } from '@/lib/cn'
import type { HomeTrendingPoi } from '@/app/api/home/trending/route'
import { useCd } from '../cd'
import { regionName } from '../map/areaName'
import h from './home.module.css'

/** Home, Trending now: the live trending places as photo tiles with their category's color square. */
export function HomeTrending({ places, name }: { places: HomeTrendingPoi[]; name: (p: HomeTrendingPoi) => string }) {
  const t = useCd()
  const locale = useLocale()
  return (
    <section className={h.trend} aria-labelledby="home-trending">
      <header className={h.trendHead}>
        <h2 id="home-trending">{t('CD0313')}</h2>
        <IntlLink href="/explore/trending" className={cn(h.allL, 'b4k-press')}>{t('CD1309')}<ArrowRight aria-hidden size={18} /></IntlLink>
      </header>
      <ol className={h.tps}>
        {places.map((p) => (
          <li key={p.poi_id}>
            <IntlLink href={`/map?poi=${p.poi_id}`} className={cn(h.tp, 'b4k-press')} style={{ '--c': categoryStyle(p.display_domain)?.color ?? 'var(--field-hero)' } as React.CSSProperties}>
              <span className={h.tpDot} aria-hidden />
              <Image src={p.primary_image_url ?? undefined} alt="" ratio="1:1" sizes="(max-width: 600px) 150px, 260px" className={h.tpImg} />
              <b>{name(p)}</b>
              <span>{regionName(p.display_region ?? '', locale)}</span>
            </IntlLink>
          </li>
        ))}
      </ol>
    </section>
  )
}
