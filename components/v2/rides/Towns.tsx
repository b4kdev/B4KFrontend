'use client'

import { Link as IntlLink } from '@/i18n/navigation'
import { Image } from '@/components/library'
import type { Ride } from '@/lib/explore-rides-types'
import { Cta, koName, placeHref, s, Swap, useCol, useColWords, usePick, useRideText } from './shared'

const LABEL: Record<string, string> = { towns: 'ui.pickTown', walk: 'ui.pickShow' }

/** Chips (a town, a show, a route, a run); the chosen one shows one big photo, its stops and its line. */
export function TownsRide({ ride }: { ride: Ride }) {
  const col = useCol()
  const w = useColWords()
  const r = useRideText()
  const [on, setOn] = usePick()
  if (ride.kind !== 'towns') return null
  const options = ride.options.filter((o) => col(o.slug))
  return (
    <>
      <div className={s.chips} role="group" aria-label={r(LABEL[ride.id] ?? 'ui.pickOne')}>
        {options.map((o, i) => (
          <button key={o.slug} type="button" className="b4k-press" aria-pressed={i === on} onClick={() => setOn(i)}>
            {w.label(o.label)}
          </button>
        ))}
      </div>
      <Swap on={on}>
        {options.map((o) => {
          const c = col(o.slug)!
          return (
            <div key={o.slug} className={s.tw}>
              <Image src={(c.places[0]?.img ?? c.hero) || undefined} alt={c.places[0]?.name ?? ''} ratio="4:3" sizes="(max-width: 880px) 92vw, 640px" className={s.twBig} />
              <div className={s.txt}>
                <h3 className={s.h3}>{c.head}</h3>
                {c.sub ? <p>{c.sub}</p> : null}
                <ol className={s.stops}>
                  {c.places.slice(0, 6).map((p) => (
                    <li key={p.id}>
                      <IntlLink href={placeHref(p)} className="b4k-press">
                        <Image src={p.img ?? undefined} alt="" ratio="4:3" sizes="56px" className={s.th} />
                        <span>
                          <b>{p.name}</b>
                          {koName(p) ? <i lang="ko">{koName(p)}</i> : null}
                        </span>
                      </IntlLink>
                    </li>
                  ))}
                </ol>
                <Cta c={c} />
              </div>
            </div>
          )
        })}
      </Swap>
    </>
  )
}
