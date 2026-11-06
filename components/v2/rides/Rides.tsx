'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { track } from '@/lib/analytics'
import { categoryStyle } from '@/components/library'
import { cn } from '@/lib/cn'
import type { Ride, RideKind, RidePage } from '@/lib/explore-rides-types'
import { PairRide, PanelRide } from './Panel'
import { SwitchRide } from './Switch'
import { ColsContext, s, useRideText } from './shared'

// Explore rides (category page): every section below the hero. One ride = one section with its
// title and line; the pick happens inside it. Renderers by kind; a kind not built yet renders
// nothing, so a page shows the rides that are done.

type Renderer = (props: { ride: Ride; category: string }) => React.ReactNode
const RENDERERS: Partial<Record<RideKind, Renderer>> = {
  switch: SwitchRide,
  panel: PanelRide,
  pair: PairRide,
}

/** Rides drawn on a tinted ground (alternating rhythm, as in the samples). */
const TINT = new Set(['pick', 'season', 'kids', 'haul', 'lead', 'runs'])

/** The rides this page can draw now, in order: the Index and the phone chips list these. */
export const shownRides = (page: RidePage) => page.rides.filter((r) => RENDERERS[r.kind])

/** Ride id → its short name for the Index and the chips. */
export function useRideNames() {
  const r = useRideText()
  return (id: string) => (r.has(`${id}.short`) ? r(`${id}.short`) : r(`${id}.title`))
}

// An open of a Collection from a ride counts as an Explore card open (its place among the ride's links).
const cardOpen = (locale: string) => (e: React.MouseEvent<HTMLElement>) => {
  const a = (e.target as HTMLElement).closest('a')
  if (!a || !a.pathname.includes('/explore/collections/')) return
  const hrefs = Array.from(e.currentTarget.querySelectorAll('a')).filter((x) => x.pathname.includes('/explore/collections/')).map((x) => x.href).filter((h, i, all) => all.indexOf(h) === i)
  track('explore_card_open', { card_type: 'collection', position: hrefs.indexOf(a.href) + 1, locale, screen_id: 'explore' })
}

export function Rides({ page }: { page: RidePage }) {
  const r = useRideText()
  const locale = useLocale()
  const color = categoryStyle(page.category)?.color
  return (
    <ColsContext.Provider value={page.cols}>
      <div className={s.rides} style={{ '--c': color } as React.CSSProperties}>
        {shownRides(page).map((ride) => {
          const Body = RENDERERS[ride.kind]!
          return (
            <section
              key={ride.id}
              id={`row-${ride.id}`}
              data-explore-row={ride.id}
              aria-labelledby={`row-${ride.id}-h`}
              onClickCapture={cardOpen(locale)}
              className={cn(s.ride, TINT.has(ride.id) && s.tint, 'scroll-mt-[var(--space-6)] max-lg:scroll-mt-[calc(var(--fab-size)+env(safe-area-inset-top)+var(--space-24)+var(--space-6))]')}
            >
              <header className={s.head}>
                <h2 id={`row-${ride.id}-h`}>{r(`${ride.id}.title`)}</h2>
                <p>{r(`${ride.id}.line`)}</p>
              </header>
              <Body ride={ride} category={page.category} />
            </section>
          )
        })}
      </div>
    </ColsContext.Provider>
  )
}

/** The ride in view: the last one whose top has passed 40% of the screen (the first before that). */
export function useRideInView(ids: string[]) {
  const [inView, setInView] = useState(ids[0])
  const key = ids.join()
  useEffect(() => {
    const rows = key.split(',').map((id) => document.getElementById(`row-${id}`)).filter((x): x is HTMLElement => !!x)
    if (!rows.length) return
    let frame = 0
    const pick = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const line = window.innerHeight * 0.4
        let row = rows[0]
        for (const el of rows) if (el.getBoundingClientRect().top <= line) row = el
        setInView(row.dataset.exploreRow ?? '')
      })
    }
    document.addEventListener('scroll', pick, { capture: true, passive: true })
    pick()
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', pick, { capture: true })
    }
  }, [key])
  return inView
}

/** Phone: the page's rides as a chip row under the category tabs; the ride in view is selected and
 * its chip scrolls into the row. A tap jumps to the ride. */
export function RideChips({ page }: { page: RidePage }) {
  const r = useRideText()
  const name = useRideNames()
  const rides = shownRides(page)
  const inView = useRideInView(rides.map((x) => x.id))
  useEffect(() => {
    const chip = document.querySelector<HTMLElement>(`[data-ride-chip="${inView}"]`)
    const bar = chip?.parentElement
    if (chip && bar) bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [inView])
  if (!rides.length) return null
  return (
    <nav aria-label={r('ui.onThisPage')} className={s.bar} style={{ '--c': categoryStyle(page.category)?.color } as React.CSSProperties}>
      {rides.map((ride) => (
        <a
          key={ride.id}
          href={`#row-${ride.id}`}
          data-ride-chip={ride.id}
          aria-current={inView === ride.id ? 'true' : undefined}
          className="b4k-press"
          onClick={(e) => {
            const el = document.getElementById(`row-${ride.id}`)
            if (!el) return
            e.preventDefault()
            el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
          }}
        >
          {name(ride.id)}
        </a>
      ))}
    </nav>
  )
}
