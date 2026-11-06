'use client'

import type { Ride } from '@/lib/explore-rides-types'
import { ColPanel, s, useCol } from './shared'

/** One Collection, open: its words and its first five places (First time?). */
export function PanelRide({ ride }: { ride: Ride }) {
  const col = useCol()
  const c = ride.kind === 'panel' ? col(ride.slug) : undefined
  return c ? <ColPanel c={c} /> : null
}

/** Two Collections side by side, three places each (Live like a lead). */
export function PairRide({ ride }: { ride: Ride }) {
  const col = useCol()
  if (ride.kind !== 'pair') return null
  return (
    <div className={s.pair}>
      {ride.slugs.map((slug) => {
        const c = col(slug)
        return c ? <ColPanel key={slug} c={c} limit={3} /> : null
      })}
    </div>
  )
}
