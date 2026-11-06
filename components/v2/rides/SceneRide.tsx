'use client'

import { useRef } from 'react'
import { Link as IntlLink } from '@/i18n/navigation'
import { Image } from '@/components/library'
import { cn } from '@/lib/cn'
import type { Ride } from '@/lib/explore-rides-types'
import { Cta, koName, placeHref, s, Swap, useCol, useColWords, usePick, useRideText } from './shared'
import sc from './scene.module.css'

/** Scene finder (K-Drama): pick a show on the call sheet (arrow keys move and pick); its title card
 * shows beside it. */
export function SceneRide({ ride }: { ride: Ride }) {
  const col = useCol()
  const w = useColWords()
  const r = useRideText()
  const [on, setOn] = usePick()
  const sheet = useRef<HTMLDivElement>(null)
  if (ride.kind !== 'scene') return null
  const options = ride.options.filter((o) => col(o.slug))
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key
    const n = k === 'ArrowRight' || k === 'ArrowDown' ? on + 1 : k === 'ArrowLeft' || k === 'ArrowUp' ? on - 1 : k === 'Home' ? 0 : k === 'End' ? options.length - 1 : null
    if (n === null) return
    e.preventDefault()
    const i = (n + options.length) % options.length
    setOn(i)
    sheet.current?.querySelectorAll<HTMLButtonElement>('button')[i]?.focus()
  }
  return (
    <div className={sc.sc}>
      <div ref={sheet} className={sc.sheet} role="group" aria-label={r('ui.pickShow')} onKeyDown={onKey}>
        {options.map((o, i) => (
          <button key={o.slug} type="button" className={sc.show} aria-pressed={i === on} tabIndex={i === on ? 0 : -1} onClick={() => setOn(i)}>
            {w.label(o.label)}
          </button>
        ))}
      </div>
      <Swap on={on}>
        {options.map((o) => {
          const c = col(o.slug)!
          const List = c.ordered ? 'ol' : 'ul'
          return (
            <article key={o.slug} className={sc.card}>
              <Image src={(c.hero ?? c.places[0]?.img) || undefined} alt="" ratio="16:9" sizes="(max-width: 980px) 92vw, 640px" className={cn(sc.lead, 'lg:aspect-[21/9]')} />
              <div className={sc.title}>
                <h3 className={s.h3}>{c.head}</h3>
                {c.sub ? <p>{c.sub}</p> : null}
                <p className={sc.metaRow}><span>{w.kind(c)}</span><span>{w.where(c)}</span><span>{w.count(c)}</span></p>
                <Cta c={c} />
              </div>
              <List className={sc.strip}>
                {c.places.slice(0, 6).map((p, j) => (
                  <li key={p.id} style={{ '--i': j } as React.CSSProperties}>
                    <IntlLink href={placeHref(p)} className="b4k-press">
                      <Image src={p.img ?? undefined} alt="" ratio="1:1" sizes="160px" className={sc.frame} />
                      <b>{c.ordered ? `${j + 1}. ` : ''}{p.name}</b>
                      {koName(p) ? <span lang="ko">{koName(p)}</span> : null}
                      <span>{w.region(p)}</span>
                    </IntlLink>
                  </li>
                ))}
              </List>
            </article>
          )
        })}
      </Swap>
    </div>
  )
}
