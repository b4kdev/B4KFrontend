'use client'

import { Image } from '@/components/library'
import { cn } from '@/lib/cn'
import type { Ride } from '@/lib/explore-rides-types'
import { ColCard, s, Swap, useCol, useColWords, usePick, useRideText } from './shared'

/** Photo tiles with a city or region name and its count; the chosen one lists up to three of its
 * Collections as cards (Food trips by city, Start from a region). */
export function CitiesRide({ ride }: { ride: Ride }) {
  const col = useCol()
  const w = useColWords()
  const r = useRideText()
  const [on, setOn] = usePick()
  if (ride.kind !== 'cities') return null
  const groups = ride.groups.filter((g) => g.slugs.some((x) => col(x)))
  return (
    <>
      <div className={s.ctiles} role="group" aria-label={r('ui.pickOne')}>
        {groups.map((g, i) => (
          <button key={i} type="button" className={cn(s.ctile, 'b4k-press')} aria-pressed={i === on} onClick={() => setOn(i)}>
            <Image src={g.img ?? undefined} alt="" ratio="1:1" sizes="(max-width: 600px) 132px, 160px" className={s.ctImg} />
            <b>{w.label(g.label)}</b>
            <span>{r('ui.collections', { n: g.count })}</span>
          </button>
        ))}
      </div>
      <Swap on={on}>
        {groups.map((g, i) => (
          <div key={i} className={s.cards3}>
            {g.slugs.map((slug) => {
              const c = col(slug)
              return c ? <ColCard key={slug} c={c} /> : null
            })}
          </div>
        ))}
      </Swap>
    </>
  )
}
