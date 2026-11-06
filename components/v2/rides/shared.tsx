'use client'

import { createContext, useContext, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { Image } from '@/components/library'
import { cn } from '@/lib/cn'
import type { RideCollection, RideLabel, RidePage, RidePlace } from '@/lib/explore-rides-types'
import { useCd } from '../cd'
import { regionName } from '../map/areaName'
import s from './rides.module.css'

export { s }

/** The page's Collections by slug, for every ride below it. */
export const ColsContext = createContext<RidePage['cols']>({})
export const useCol = () => {
  const cols = useContext(ColsContext)
  return (slug: string) => cols[slug] as RideCollection | undefined
}

/** Ride words (gap.rides): title, line, choice labels and the shared button and count texts. */
export const useRideText = () => useTranslations('gap.rides')

export const colHref = (c: RideCollection) => `/explore/collections/${c.slug}`
export const placeHref = (p: RidePlace) => `/map?poi=${p.id}`

const KIND_CD: Record<string, string> = { STORY: 'CD1338', SHOPPING: 'CD1282', EXPERIENCE: 'CD0168', HUB: 'CD1792' }
const KIND_RIDE: Record<string, string> = { FAN_THEME: 'ui.kindFan', CHALLENGE: 'ui.kindChallenge', MOMENT: 'ui.kindMoment' }

/** A Collection's words: its kind, where its places are (two regions at most) and how many there are. */
export function useColWords() {
  const t = useCd()
  const r = useRideText()
  const locale = useLocale()
  return {
    kind: (c: RideCollection) => (KIND_CD[c.type] ? t(KIND_CD[c.type]) : KIND_RIDE[c.type] ? r(KIND_RIDE[c.type]) : c.ordered ? t('CD1336') : r('ui.kindDayTrip')),
    where: (c: RideCollection) => {
      const [a, b] = c.regions.slice(0, 2).map((x) => regionName(x, locale))
      return a ? (b ? r('ui.and', { a, b }) : a) : r('ui.korea')
    },
    count: (c: RideCollection) => (c.ordered ? t('CD0473', { n: c.count }) : t('CD0160', { count: c.count })),
    region: (p: RidePlace) => regionName(p.region, locale),
    label: (l: RideLabel) => ('key' in l ? r(`opt.${l.key}`) : 'region' in l ? regionName(l.region, locale) : l.text),
  }
}

/** Korean name under the locale name, when it differs. */
export const koName = (p: RidePlace) => (p.ko && p.ko !== p.name ? p.ko : '')

export function Cta({ c, label }: { c: RideCollection; label?: string }) {
  const r = useRideText()
  return (
    <IntlLink href={colHref(c)} className={cn(s.cta, 'b4k-press')}>
      {label ?? r('ui.open')}
      <ArrowRight aria-hidden size={18} />
    </IntlLink>
  )
}

/** A place as a photo card; ordered Collections number their stops. Opens the place on the map. */
export function PlaceCard({ p, n, tall }: { p: RidePlace; n?: number; tall?: boolean }) {
  const w = useColWords()
  return (
    <IntlLink href={placeHref(p)} className={cn(s.pc, 'b4k-press')}>
      {n ? <b className={cn(s.pcN, 'tabular-nums')}>{n}</b> : null}
      <Image src={p.img ?? undefined} alt={p.name} ratio="1:1" sizes="(max-width: 600px) 46vw, 220px" className={cn(s.pcImg, tall ? 'aspect-[4/5]' : 'aspect-[3/4]')} />
      <span className={s.pcCap}>
        <b>{p.name}</b>
        {koName(p) ? <i lang="ko">{koName(p)}</i> : null}
        {p.region ? <span>{w.region(p)}</span> : null}
      </span>
    </IntlLink>
  )
}

/** A Collection as a card: its photo, its kind, its title and line, where and how many. */
export function ColCard({ c }: { c: RideCollection }) {
  const w = useColWords()
  return (
    <IntlLink href={colHref(c)} className={cn(s.cc, 'b4k-press')}>
      <Image src={(c.hero ?? c.places[0]?.img) || undefined} alt="" ratio="16:9" sizes="(max-width: 600px) 92vw, 360px" className={cn(s.ccImg, 'aspect-[16/10]')} />
      <span className={s.ccK}>{w.kind(c)}</span>
      <span className={s.ccT}>{c.head}</span>
      {c.sub ? <span className={s.ccS}>{c.sub}</span> : null}
      <span className={s.ccM}>{w.where(c)} · {w.count(c)}</span>
    </IntlLink>
  )
}

/** The chosen Collection: its words on the left, its places as photo cards on the right. */
export function ColPanel({ c, limit = 5 }: { c: RideCollection; limit?: number }) {
  const w = useColWords()
  const r = useRideText()
  const more = c.count - limit
  return (
    <div className={s.cp}>
      <div className={s.txt}>
        <h3 className={s.h3}>{c.head}</h3>
        {c.sub ? <p>{c.sub}</p> : null}
        <p className={s.meta}>{w.kind(c)} · {w.where(c)} · {w.count(c)}</p>
        <Cta c={c} />
      </div>
      <div className={s.cpPlaces}>
        {c.places.slice(0, limit).map((p, i) => <PlaceCard key={p.id} p={p} n={c.ordered ? i + 1 : undefined} />)}
        {more > 0 ? <p className={s.cpMore}>{r('ui.more', { n: more })}</p> : null}
      </div>
    </div>
  )
}

/** One state per ride: the index of the open choice. */
export const usePick = () => useState(0)

/** Panels a pick swaps, stacked in one grid cell so the tallest sets the height (no layout shift);
 * the ones not chosen are invisible and inert. */
export function Swap({ on, children }: { on: number; children: React.ReactNode[] }) {
  return (
    <div className={s.swap}>
      {children.map((child, i) => (
        <div key={i} data-on={i === on ? 'true' : 'false'} aria-hidden={i === on ? undefined : true} inert={i !== on}>
          {child}
        </div>
      ))}
    </div>
  )
}
