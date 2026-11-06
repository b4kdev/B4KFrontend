'use client'

import { Link as IntlLink } from '@/i18n/navigation'
import { categoryStyle, Glyph, Image } from '@/components/library'
import { cn } from '@/lib/cn'
import type { Ride } from '@/lib/explore-rides-types'
import { colHref, s, useCol, useColWords } from './shared'

// Poster fields cycle through the category primitives, always with black ink and the page glyph.
const FIELDS = ['var(--butter-300)', 'var(--lime-300)', 'var(--clay-400)', 'var(--powder-300)', 'var(--pink-200)', 'var(--sage-400)', 'var(--category-pop)', 'var(--stone-300)']

/** Color posters, one per Collection (Eat like a local, Korea through history). */
export function PostersRide({ ride, category }: { ride: Ride; category?: string }) {
  const col = useCol()
  const w = useColWords()
  if (ride.kind !== 'posters') return null
  const glyph = categoryStyle(category)?.glyph
  return (
    <div className={s.psts}>
      {ride.slugs.map((slug, i) => {
        const c = col(slug)
        if (!c) return null
        const field = FIELDS[i % FIELDS.length]
        return (
          <IntlLink key={slug} href={colHref(c)} className={cn(s.pst, 'b4k-press')} style={{ background: field, '--c-pst': field } as React.CSSProperties}>
            {glyph ? <span className={s.pstG} aria-hidden><Glyph name={glyph} size={22} /></span> : null}
            <b>{c.head}</b>
            {c.sub ? <span>{c.sub}</span> : null}
            <span className={s.pstM}>{w.where(c)} · {w.count(c)}</span>
            <span className={s.pstPh} aria-hidden>
              {c.places.slice(0, 3).map((p) => <Image key={p.id} src={p.img ?? undefined} alt="" ratio="1:1" sizes="56px" />)}
            </span>
          </IntlLink>
        )
      })}
    </div>
  )
}
