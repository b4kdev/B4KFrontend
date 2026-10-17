'use client'

import type { ReactNode } from 'react'
import { Bookmark, ExternalLink, MapPin, Plus, Route, TrendingUp } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { Badge } from './Badge'
import { IconButton } from './IconButton'
import { Image } from './Image'
import { SaveLikeOverlay } from './ContentMolecules'

// Card (CMP-049, UI-81; Figma Organisms › Card). Filled and square, no shadow; the text panel on
// bg-raised; hover adds the state layer; keyboard focus rings the whole card. The card is one link
// (a stretched link); Save, Like and Add to plan are separate buttons above it.
// Text fit (UI-102): titles and meta two lines then an ellipsis; Place description one line.

type Common = {
  href: string
  title: string
  /** Partner links open in a new tab and say so. */
  external?: { newTabLabel: string }
  className?: string
}

type Media = { imageSrc?: string | null; imageAlt?: string }

export type CardProps = Common &
  (
    | (Media & {
        type: 'place'
        meta: ReactNode
        description?: string
        save?: { saved: boolean; onSave: () => void; label: string }
        like?: { liked: boolean; onLike: () => void; label: string }
        addToPlan?: { onAdd: () => void; label: string }
        sponsored?: string
        dDay?: string
        trending?: string
      })
    | (Media & { type: 'compact'; meta: ReactNode; save?: { saved: boolean; onSave: () => void; label: string }; addToPlan?: { onAdd: () => void; label: string } })
    | { type: 'collection'; images: (string | null)[]; meta: ReactNode }
    | (Media & { type: 'collection-photo'; meta: ReactNode })
    | (Media & { type: 'plan'; author: string; saves?: string; stops: string; sponsored?: string })
    | (Media & { type: 'package'; partner: string; cta: string; sponsored: string })
    | (Media & { type: 'featured' | 'featured-stacked'; eyebrow: string; meta: string; sponsored?: string })
  )

const SHELL =
  'group relative flex overflow-hidden rounded-none bg-ui-bg-raised text-ui-fg focus-within:shadow-focus-ring has-[a:hover]:[&>.panel]:bg-[image:linear-gradient(var(--color-state-hover),var(--color-state-hover))]'
const STRETCH = "outline-none after:absolute after:inset-0 after:z-0 after:content-['']"
const TITLE2 = 'line-clamp-2 [text-wrap:pretty] type-title-card [&:lang(ko)]:break-keep'

function CardLink({ href, external, children, className }: { href: string; external?: { newTabLabel: string }; children: ReactNode; className?: string }) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn(STRETCH, className)}>
        {children}
        <span className="sr-only"> {external.newTabLabel}</span>
      </a>
    )
  }
  return <IntlLink href={href} className={cn(STRETCH, className)}>{children}</IntlLink>
}

export function Card(props: CardProps) {
  const { href, title, external, className } = props
  switch (props.type) {
    case 'place':
      return (
        <article className={cn(SHELL, 'flex-col', className)}>
          <div className="relative">
            <Image ratio="4:3" src={props.imageSrc} alt={props.imageAlt ?? ''} sizes="(min-width: 1024px) 280px, 50vw" />
            <div className="absolute left-[var(--space-2)] top-[var(--space-2)] z-10 flex gap-[var(--gap-xs)]">
              {props.sponsored ? <Badge variant="on-image">{props.sponsored}</Badge> : null}
              {props.dDay ? <Badge variant="strong">{props.dDay}</Badge> : null}
            </div>
            {props.save ? <SaveLikeOverlay className="z-10" saved={props.save.saved} onSave={props.save.onSave} saveLabel={props.save.label} like={props.like} /> : null}
          </div>
          <div className="panel flex items-start gap-[var(--space-2)] p-[var(--space-3)]">
            <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
              <CardLink href={href} external={external} className={TITLE2}>{title}</CardLink>
              {props.description ? <p className="truncate type-body-base text-ui-fg-muted">{props.description}</p> : null}
              <div className="flex items-center gap-[var(--space-1)] line-clamp-2 type-body-caption text-ui-fg-muted">
                {props.trending ? <span className="inline-flex items-center gap-[var(--gap-xs)] text-ui-fg"><TrendingUp aria-hidden className="size-[var(--icon-size-xs)]" />{props.trending}</span> : null}
                {props.meta}
              </div>
            </div>
            {props.addToPlan ? <IconButton variant="primary" label={props.addToPlan.label} icon={<Plus />} onClick={props.addToPlan.onAdd} className="relative z-10" /> : null}
          </div>
        </article>
      )
    case 'compact':
      return (
        <article className={cn(SHELL, 'h-[80px] flex-row', className)}>
          <Image ratio="1:1" src={props.imageSrc} alt={props.imageAlt ?? ''} sizes="80px" className="w-[80px] shrink-0" />
          <div className="panel flex min-w-0 flex-1 items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)]">
            <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
              <CardLink href={href} external={external} className={cn(TITLE2, 'line-clamp-1')}>{title}</CardLink>
              <div className="truncate type-body-caption text-ui-fg-muted">{props.meta}</div>
            </div>
            {props.addToPlan ? <IconButton variant="primary" label={props.addToPlan.label} icon={<Plus />} onClick={props.addToPlan.onAdd} className="relative z-10" /> : null}
            {props.save ? (
              <IconButton label={props.save.label} icon={<Bookmark className={props.save.saved ? 'fill-current' : undefined} />} aria-pressed={props.save.saved} onClick={props.save.onSave} className="relative z-10" />
            ) : null}
          </div>
        </article>
      )
    case 'collection':
      return (
        <article className={cn(SHELL, 'flex-col', className)}>
          <div className="grid aspect-[2/1] grid-cols-2 grid-rows-2 gap-px bg-ui-bg">
            {[0, 1, 2, 3].map((i) => (
              <Image key={i} ratio="1:1" src={props.images[i] ?? null} alt="" sizes="140px" className="h-full !aspect-auto" />
            ))}
          </div>
          <div className="panel flex flex-col gap-[var(--space-1)] p-[var(--space-3)]">
            <CardLink href={href} className={TITLE2}>{title}</CardLink>
            <div className="type-body-caption text-ui-fg-muted">{props.meta}</div>
          </div>
        </article>
      )
    case 'collection-photo':
      return (
        <article className={cn(SHELL, 'flex-col', className)}>
          <Image ratio="4:3" src={props.imageSrc} alt={props.imageAlt ?? ''} sizes="280px" />
          <div className="panel flex flex-col gap-[var(--space-1)] p-[var(--space-3)]">
            <CardLink href={href} className={TITLE2}>{title}</CardLink>
            <div className="type-body-caption text-ui-fg-muted">{props.meta}</div>
          </div>
        </article>
      )
    case 'plan':
      return (
        <article className={cn(SHELL, 'flex-col', className)}>
          <div className="relative">
            <Image ratio="4:3" src={props.imageSrc} alt={props.imageAlt ?? ''} sizes="280px" />
            {props.sponsored ? <Badge variant="on-image" className="absolute left-[var(--space-2)] top-[var(--space-2)]">{props.sponsored}</Badge> : null}
          </div>
          <div className="panel flex flex-col gap-[var(--space-1)] p-[var(--space-3)]">
            <CardLink href={href} className={TITLE2}>{title}</CardLink>
            <div className="flex items-center justify-between gap-[var(--space-1)] type-body-caption text-ui-fg-muted">
              <span className="truncate">{props.author}</span>
              {props.saves ? <span className="inline-flex shrink-0 items-center gap-[var(--gap-xs)]"><Bookmark aria-hidden className="size-[var(--icon-size-xs)]" />{props.saves}</span> : null}
            </div>
            <div className="flex items-center gap-[var(--gap-xs)] type-body-caption text-ui-fg-muted"><Route aria-hidden className="size-[var(--icon-size-xs)]" />{props.stops}</div>
          </div>
        </article>
      )
    case 'package':
      return (
        <article className={cn(SHELL, 'flex-col', className)}>
          <div className="relative">
            <Image ratio="4:3" src={props.imageSrc} alt={props.imageAlt ?? ''} sizes="280px" />
            <Badge variant="on-image" className="absolute left-[var(--space-2)] top-[var(--space-2)]">{props.sponsored}</Badge>
          </div>
          <div className="panel flex flex-col gap-[var(--space-1)] p-[var(--space-3)]">
            <CardLink href={href} external={external} className={TITLE2}>{title}</CardLink>
            <div className="type-body-caption text-ui-fg-muted">{props.partner}</div>
            <div aria-hidden className="inline-flex items-center gap-[var(--gap-xs)] type-body-label text-ui-fg">{props.cta}<ExternalLink className="size-[var(--icon-size-xs)]" /></div>
          </div>
        </article>
      )
    default: {
      const stacked = props.type === 'featured-stacked'
      return (
        <article className={cn(SHELL, stacked ? 'flex-col' : 'flex-col sm:flex-row', className)}>
          <div className={cn('relative', !stacked && 'sm:w-[42%] sm:shrink-0')}>
            <Image ratio="16:9" src={props.imageSrc} alt={props.imageAlt ?? ''} sizes="(min-width: 640px) 360px, 100vw" className={!stacked ? 'sm:h-full' : undefined} />
            {props.sponsored ? <Badge variant="on-image" className="absolute left-[var(--space-2)] top-[var(--space-2)]">{props.sponsored}</Badge> : null}
          </div>
          <div className="panel flex min-w-0 flex-1 flex-col gap-[var(--space-2)] p-[var(--space-4)]">
            <span className="type-eyebrow-badge text-ui-fg">{props.eyebrow}</span>
            <CardLink href={href} className="line-clamp-2 type-title-empty-state">{title}</CardLink>
            <div className="flex items-center gap-[var(--space-1)] type-body-caption text-ui-fg-muted"><MapPin aria-hidden className="size-[var(--icon-size-xs)] shrink-0" />{props.meta}</div>
          </div>
        </article>
      )
    }
  }
}
