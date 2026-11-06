'use client'

import { useState } from 'react'
import { Image } from '@/components/library'
import type { Ride } from '@/lib/explore-rides-types'
import { ColCard, Cta, koName, s, useCol, useRideText } from './shared'

/** A haul: the Collection's shops as a list to tick off while out (kept on this screen only), the
 * count beside it, other shopping Collections at the side (Album run). */
export function ChecklistRide({ ride }: { ride: Ride }) {
  const col = useCol()
  const r = useRideText()
  const [done, setDone] = useState<Set<string>>(() => new Set())
  if (ride.kind !== 'checklist') return null
  const c = col(ride.slug)
  if (!c) return null
  const places = c.places.slice(0, 9)
  const toggle = (id: string) => setDone((d) => {
    const n = new Set(d)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  return (
    <div className={s.sc}>
      <div className={s.ck}>
        <h3 className={s.h3}>{c.head}</h3>
        {c.sub ? <p>{c.sub}</p> : null}
        <ul className={s.ckList}>
          {places.map((p) => (
            <li key={p.id}>
              <label>
                <Image src={p.img ?? undefined} alt="" ratio="1:1" sizes="48px" className="rounded-[var(--radius-xs)]" />
                <span>
                  <b>{p.name}</b>
                  {koName(p) ? <i lang="ko">{koName(p)}</i> : null}
                </span>
                <input type="checkbox" checked={done.has(p.id)} onChange={() => toggle(p.id)} />
              </label>
            </li>
          ))}
        </ul>
        <p className={`${s.ckProg} tabular-nums`} aria-live="polite">{r('ui.done', { done: done.size, n: places.length })}</p>
        <Cta c={c} />
      </div>
      <div className={s.side}>
        {ride.side.map((slug) => {
          const o = col(slug)
          return o ? <ColCard key={slug} c={o} /> : null
        })}
      </div>
    </div>
  )
}
