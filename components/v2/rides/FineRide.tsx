'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { Glyph, Image } from '@/components/library'
import { cn } from '@/lib/cn'
import type { Ride } from '@/lib/explore-rides-types'
import { colHref, koName, placeHref, useCol, useColWords, useRideText } from './shared'
import f from './fine.module.css'

/** B4K Pick (K-Food): the Collection's name on a butter poster; its tables as a printed menu. */
export function FineRide({ ride }: { ride: Ride }) {
  const col = useCol()
  const w = useColWords()
  const r = useRideText()
  const box = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'' | 'pre' | 'in'>('')
  useEffect(() => {
    const el = box.current
    if (!el || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < window.innerHeight) return
    setPhase('pre')
    const o = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { setPhase('in'); o.disconnect() } }, { threshold: 0.2 })
    o.observe(el)
    return () => o.disconnect()
  }, [])
  const c = ride.kind === 'fine' ? col(ride.slug) : undefined
  if (!c) return null
  const places = c.places.slice(0, 8)
  const regions = c.regions.slice(0, 2).map((x) => w.label({ region: x }))
  const where = regions.length === 2 ? r('ui.and', { a: regions[0], b: regions[1] }) : regions[0]
  return (
    <div ref={box} className={cn(f.fc, phase && f[phase])}>
      <div className={f.poster}>
        <span className={f.glyph} aria-hidden><Glyph name="bowl" size={96} /></span>
        <h3 className={f.h}>{c.head}</h3>
        <p className={f.m}>{where ? r('ui.tablesIn', { n: c.count, where }) : r('ui.tables', { n: c.count })}</p>
        <IntlLink href={colHref(c)} className={cn(f.cta, 'b4k-press')}>{r('ui.open')}<ArrowRight aria-hidden size={18} /></IntlLink>
      </div>
      <ul className={f.list} aria-label={`${c.head}: ${r('ui.tables', { n: c.count })}`}>
        {places.map((p, i) => (
          <li key={p.id} style={{ '--i': i } as React.CSSProperties}>
            <IntlLink href={placeHref(p)} className={f.n}>
              <span className={f.ph}>
                <Glyph name="bowl" size={32} />
                <Image src={p.img ?? undefined} alt="" ratio="4:3" sizes="88px" />
              </span>
              <span className={f.t}>
                <b>{p.name}</b>
                {koName(p) ? <span lang="ko">{koName(p)}</span> : null}
              </span>
            </IntlLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
