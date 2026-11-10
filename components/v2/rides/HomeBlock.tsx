'use client'

import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { categoryStyle, CreditLine, Glyph, Image } from '@/components/library'
import { cn } from '@/lib/cn'
import type { Ride, RidePage } from '@/lib/explore-rides-types'
import { colHasAi, colHasKto } from '@/lib/explore-rides-credits'
import { useCd } from '../cd'
import { CATEGORIES } from '../categories'
import { ColsContext, koName, placeHref, s, Swap, useColWords, usePick, useRideText } from './shared'
import h from './home.module.css'

/** The Collection a ride opens on; Start from a region opens on the page's lead Collection. */
function firstSlug(ride: Ride, page: RidePage) {
  if (ride.id === 'region') return page.hero.slug
  if ('options' in ride) return ride.options[0]?.slug
  if ('groups' in ride) return ride.groups[0]?.slugs[0]
  if ('slugs' in ride) return ride.slugs[0]
  return ride.slug
}

/** Home: one category's rides on its color field, the chosen ride's first Collection beside it.
 * `flip` puts the field on the right (K-Culture). Arrow keys move between the rides. */
export function HomeRideBlock({ page, flip }: { page: RidePage; flip?: boolean }) {
  const t = useCd()
  const r = useRideText()
  const w = useColWords()
  const [on, setOn] = usePick()
  const list = useRef<HTMLDivElement>(null)
  const cat = CATEGORIES.find((c) => c.slug === page.category)
  const style = categoryStyle(page.category)
  const rows = page.rides.map((ride) => ({ ride, c: page.cols[firstSlug(ride, page) ?? ''] })).filter((x) => x.c)
  const name = cat ? t(cat.label) : ''
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key
    const n = k === 'ArrowDown' || k === 'ArrowRight' ? on + 1 : k === 'ArrowUp' || k === 'ArrowLeft' ? on - 1 : k === 'Home' ? 0 : k === 'End' ? rows.length - 1 : null
    if (n === null) return
    e.preventDefault()
    const i = (n + rows.length) % rows.length
    setOn(i)
    list.current?.querySelectorAll<HTMLButtonElement>('button')[i]?.focus()
  }
  return (
    <ColsContext.Provider value={page.cols}>
      <section className={cn(h.lb, flip && h.flip)} aria-labelledby={`home-${page.category}`} style={{ '--c': style?.color } as React.CSSProperties}>
        <div className={h.grid}>
          <div className={h.field}>
            <div className={h.fhead}>
              {style ? <span className={h.fg} aria-hidden><Glyph name={style.glyph} size={28} /></span> : null}
              <span className={h.fl}>
                <h2 id={`home-${page.category}`}>{name}</h2>
                {cat ? <span>{t(cat.sub)}</span> : null}
              </span>
            </div>
            <div ref={list} className={h.rides} role="group" aria-label={name} onKeyDown={onKey}>
              {rows.map(({ ride }, i) => (
                <button key={ride.id} type="button" className={h.ride} aria-pressed={i === on} tabIndex={i === on ? 0 : -1} onClick={() => setOn(i)}>
                  <b>{r(`${ride.id}.title`)}</b>
                  <span>{r(`${ride.id}.line`)}</span>
                </button>
              ))}
            </div>
            <IntlLink href={`/explore/${page.category}`} className={cn(h.all, 'b4k-press')}>{t('CD1309')}<ArrowRight aria-hidden size={18} /></IntlLink>
          </div>
          <Swap on={on}>
            {rows.map(({ ride, c }) => {
              const href = `/explore/${page.category}#row-${ride.id}`
              const List = c.ordered ? 'ol' : 'ul'
              return (
                <article key={ride.id} className={h.card}>
                  <IntlLink href={href} className={cn(h.lead, 'b4k-press')}>
                    <Image src={(c.hero ?? c.places[0]?.img) || undefined} alt={c.head} ratio="16:9" sizes="(max-width: 880px) 92vw, 760px" className="aspect-[2/1]" />
                  </IntlLink>
                  <div className={h.ct}>
                    <h3>{c.head}</h3>
                    {c.sub ? <p>{c.sub}</p> : null}
                    <p className={h.m}>{w.kind(c)} · {w.where(c)} · {w.count(c)}</p>
                  </div>
                  <List className={h.strip}>
                    {c.places.slice(0, 4).map((p, j) => (
                      <li key={p.id} style={{ '--i': j } as React.CSSProperties}>
                        <IntlLink href={placeHref(p)} className="b4k-press">
                          <Image src={p.img ?? undefined} alt="" ratio="1:1" sizes="180px" className={h.fimg} />
                          <b>{c.ordered ? `${j + 1}. ` : ''}{p.name}</b>
                          {koName(p) ? <span lang="ko">{koName(p)}</span> : null}
                        </IntlLink>
                      </li>
                    ))}
                  </List>
                  <IntlLink href={href} className={cn(s.cta, h.cardCta, 'b4k-press')}>{r('ui.open')}<ArrowRight aria-hidden size={18} /></IntlLink>
                </article>
              )
            })}
          </Swap>
        </div>
        {/* One credit line when any of the block's Collections shows a Korea Tourism Organization photo, so it stays put as rides change. */}
        {rows.some((x) => colHasKto(x.c)) ? <CreditLine className="mt-[var(--space-3)]">{t('CD1874')}</CreditLine> : null}
        {/* And one 'AI illustration' line when any of them shows an AI-made picture. */}
        {rows.some((x) => colHasAi(x.c)) ? <CreditLine className={rows.some((x) => colHasKto(x.c)) ? 'mt-[var(--space-1)]' : 'mt-[var(--space-3)]'}>{t('CD1904')}</CreditLine> : null}
      </section>
    </ColsContext.Provider>
  )
}
