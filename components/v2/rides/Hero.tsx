'use client'

import { Link as IntlLink } from '@/i18n/navigation'
import { categoryStyle, Glyph, Image } from '@/components/library'
import { cn } from '@/lib/cn'
import type { RidePage } from '@/lib/explore-rides-types'
import { colHref, s, useColWords, useRideText } from './shared'

/** Category hero: the page's color field with its glyph, name and line, then its lead Collection
 * with three of its photos and its whole title and line. */
export function RideHero({ page, title }: { page: RidePage; title: string }) {
  const r = useRideText()
  const w = useColWords()
  const style = categoryStyle(page.category)
  const c = page.cols[page.hero.slug]
  const skip = new Set(page.hero.skip ?? [])
  const photos = c ? c.places.filter((_, i) => !skip.has(i)).slice(0, 3) : []
  return (
    <div className={s.heroWrap} style={{ '--c': style?.color } as React.CSSProperties}>
      <section className={s.hero} aria-labelledby="explore-h1">
        <div className={s.field}>
          {style ? <span className={s.fieldG} aria-hidden><Glyph name={style.glyph} size={28} /></span> : null}
          <h1 id="explore-h1">{title}</h1>
          <p>{r(`hero.${page.category}`)}</p>
        </div>
        {c ? (
          <IntlLink href={colHref(c)} className={cn(s.pick, 'b4k-press')}>
            <span className={s.imgs}>
              {photos.map((p, i) => <Image key={p.id} src={p.img ?? undefined} alt="" ratio="1:1" priority sizes={i ? '(max-width: 880px) 33vw, 280px' : '(max-width: 880px) 66vw, 560px'} className="aspect-auto" />)}
            </span>
            <span className={s.pickTxt}>
              <b>{c.head}</b>
              {c.sub ? <span>{c.sub}</span> : null}
              <span className={s.meta}>{w.kind(c)} · {w.where(c)} · {w.count(c)}</span>
            </span>
          </IntlLink>
        ) : null}
      </section>
    </div>
  )
}
