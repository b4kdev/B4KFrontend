'use client'

import type { Ride } from '@/lib/explore-rides-types'
import { Cta, PlaceCard, s, Swap, useCol, useColWords, usePick, useRideText } from './shared'

const LABEL: Record<string, string> = { season: 'ui.pickSeason' }

/** A segmented switch (season, who is coming, this week); each state shows its Collection's title
 * and three big photos. */
export function SwitchRide({ ride }: { ride: Ride }) {
  const col = useCol()
  const w = useColWords()
  const r = useRideText()
  const [on, setOn] = usePick()
  if (ride.kind !== 'switch') return null
  const options = ride.options.filter((o) => col(o.slug))
  return (
    <>
      <div className={s.seg} role="group" aria-label={r(LABEL[ride.id] ?? 'ui.pickOne')}>
        {options.map((o, i) => (
          <button key={o.slug} type="button" aria-pressed={i === on} onClick={() => setOn(i)}>
            {w.label(o.label)}
          </button>
        ))}
      </div>
      <Swap on={on}>
        {options.map((o) => {
          const c = col(o.slug)!
          return (
            <div key={o.slug} className={s.swP}>
              <div className={s.txt}>
                <h3 className={s.h3}>{c.head}</h3>
                {c.sub ? <p>{c.sub}</p> : null}
                <p className={s.meta}>{w.where(c)} · {w.count(c)}</p>
                <Cta c={c} />
              </div>
              <div className={s.swRow}>
                {c.places.slice(0, 3).map((p) => <PlaceCard key={p.id} p={p} tall />)}
              </div>
            </div>
          )
        })}
      </Swap>
    </>
  )
}
