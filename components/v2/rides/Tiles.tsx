'use client'

import { ArrowRight } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { Image } from '@/components/library'
import { cn } from '@/lib/cn'
import type { Ride } from '@/lib/explore-rides-types'
import { colHref, ColPanel, s, Swap, useCol, useColWords, usePick, useRideText } from './shared'

const LABEL: Record<string, string> = { dish: 'ui.pickDish', bias: 'ui.pickArtist' }

/** Photo tiles as the way in (a dish, an artist, a treatment); the chosen one opens its Collection
 * below, with any other Collections for the same choice as rows under it. */
export function TilesRide({ ride }: { ride: Ride }) {
  const col = useCol()
  const w = useColWords()
  const r = useRideText()
  const [on, setOn] = usePick()
  if (ride.kind !== 'tiles') return null
  const options = ride.options.filter((o) => col(o.slug))
  return (
    <>
      <div className={s.tps} role="group" aria-label={r(LABEL[ride.id] ?? 'ui.pickOne')}>
        {options.map((o, i) => {
          const c = col(o.slug)!
          return (
            <button key={o.slug} type="button" className={cn(s.tp, 'b4k-press')} aria-pressed={i === on} onClick={() => setOn(i)}>
              <Image src={(c.places[0]?.img ?? c.hero) || undefined} alt="" ratio="1:1" sizes="(max-width: 600px) 104px, 120px" className={s.tpImg} />
              <span>{w.label(o.label)}</span>
            </button>
          )
        })}
      </div>
      <Swap on={on}>
        {options.map((o) => {
          const c = col(o.slug)!
          const also = (o.also ?? []).map(col).filter((x) => x !== undefined)
          return (
            <div key={o.slug}>
              <ColPanel c={c} />
              {also.length ? (
                <div className={s.also}>
                  {also.map((a) => (
                    <IntlLink key={a.slug} href={colHref(a)} className={cn(s.alsoRow, 'b4k-press')}>
                      <Image src={(a.hero ?? a.places[0]?.img) || undefined} alt="" ratio="1:1" sizes="64px" className="rounded-[var(--radius-sm)]" />
                      <span>
                        <span className={s.alsoK}>{r('ui.also', { kind: w.kind(a) })}</span>
                        <b>{a.head}</b>
                        <span className={s.meta}>{[a.sub, w.where(a), w.count(a)].filter(Boolean).join(' · ')}</span>
                      </span>
                      <ArrowRight aria-hidden size={18} />
                    </IntlLink>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </Swap>
    </>
  )
}
