'use client'

import { useContext, type ReactNode } from 'react'
import { Bookmark, ExternalLink, MapPin, Plus, Route, TrendingUp } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { Badge } from './Badge'
import { IconButton } from './IconButton'
import { Image, ImageMissingLabel } from './Image'
import type { PlaceType } from './Content'
import { SaveLikeOverlay } from './ContentMolecules'
import { Glyph, type GlyphName } from './Glyph'

// Card (Figma Organisms › Card). A tile: tile surface, tile radius, 8 inset, the photo inside as an
// inner squircle, no border or shadow (the tone step against the ground is the edge). Hover (fine
// pointer) zooms the photo a little and underlines the title; press shrinks the tile; keyboard focus
// rings the whole card. Category: a colour field with black ink, label top-left, glyph bottom-left
// and the photo as an inset bottom-right. The card is one link
// (a stretched link); Save, Like and Add to plan are separate buttons above it.
// Text fit: titles and meta two lines then an ellipsis; Place description one line.

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
        /** Figma Place type icon on a missing photo: the place's interest category. */
        placeType?: PlaceType
        description?: string
        save?: { saved: boolean; onSave: () => void; label: string }
        like?: { liked: boolean; onLike: () => void; label: string }
        addToPlan?: { onAdd: () => void; label: string }
        sponsored?: string
        dDay?: string
        trending?: string
        /** The place's category key ("pop"): data-category on the card. */
        category?: string
      })
    | (Media & { type: 'compact'; meta: ReactNode; save?: { saved: boolean; onSave: () => void; label: string }; addToPlan?: { onAdd: () => void; label: string } })
    | { type: 'collection'; images: (string | null)[]; meta: ReactNode }
    | (Media & { type: 'collection-photo'; meta: ReactNode })
    | (Media & {
        type: 'category'
        meta: ReactNode
        /** The field colour (a CSS colour, var(--category-*)) and its glyph. */
        color: string
        glyph: GlyphName
        /** data-category on the tile, e.g. "pop". */
        category?: string
      })
    | (Media & {
        type: 'plan'
        author: string
        /** The author's profile; the name links there above the card link. */
        authorHref?: string
        saves?: string
        stops: string
        sponsored?: string
        /** Save on the cover (no Like); saved = the Unsave state on Saved plans. */
        save?: { saved: boolean; onSave: () => void; label: string }
      })
    | (Media & { type: 'package'; partner: string; cta: string; sponsored: string })
    | (Media & { type: 'featured' | 'featured-stacked'; eyebrow: string; meta: string; sponsored?: string; trending?: string })
  )

// isolate: the card's own layers (stretched link, Save and Like over the photo) stack inside the
// card, so a sticky bar above a scrolling list of cards stays on top.
const SHELL =
  'b4k-card b4k-press group relative isolate flex overflow-hidden rounded-tile bg-tile-surface p-[var(--space-2)] text-ui-fg focus-within:shadow-focus-ring'
/** The photo slot inside a tile. */
const MEDIA = 'b4k-card-media overflow-hidden rounded-tile-inner'
/** Text panel under the photo: 14 above, 12 at the sides and below. */
const PANEL = 'panel px-[var(--space-3)] pb-[var(--space-3)] pt-[var(--space-3-5)]'
/** Add to plan (+) on a card: the add accent with black ink; inverse on hover. */
const ADD = 'relative z-10 rounded-sq-md !bg-accent-add !text-field-fg [&>svg]:[stroke-width:2.6] [@media(hover:hover)_and_(pointer:fine)]:hover:!bg-ui-bg-inverse [@media(hover:hover)_and_(pointer:fine)]:hover:!text-ui-fg-inverse'
const STRETCH = "outline-none after:absolute after:inset-0 after:z-0 after:content-['']"
const TITLE2 = 'b4k-card-title line-clamp-2 [text-wrap:pretty] type-title-card [&:lang(ko)]:break-keep max-sm:line-clamp-3'

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

/** Figma Meta row: map-pin 14 + meta text, then the Trending badge, then external-link 14 for partner links. */
function MetaRow({ meta, trending, external, className }: { meta: ReactNode; trending?: string; external?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-[var(--space-1)] type-body-caption text-ui-fg-muted', className)}>
      <MapPin aria-hidden className="size-[var(--icon-size-xs)] shrink-0" />
      <span className="line-clamp-2 min-w-0">{meta}</span>
      {trending ? <Badge variant="normal" leadingIcon={<TrendingUp aria-hidden />}>{trending}</Badge> : null}
      {external ? <ExternalLink aria-hidden className="size-[var(--icon-size-xs)] shrink-0" /> : null}
    </div>
  )
}

export function Card(props: CardProps) {
  const { href, title, external, className } = props
  const missingLabel = useContext(ImageMissingLabel)
  switch (props.type) {
    case 'place':
      return (
        <article data-category={props.category} className={cn(SHELL, 'flex-col', className)}>
          <div className={cn('relative', MEDIA)}>
            {/* A place photo is named after the place unless the caller gives its own description. */}
            {/* The shell's label names Place: shown only while the type is Place (no label text per type yet). */}
            <Image ratio="4:3" src={props.imageSrc} alt={props.imageAlt ?? title} sizes="280px" placeType={props.placeType} missingLabel={(props.placeType ?? 'place') === 'place' ? missingLabel : undefined} />
            <div className="absolute left-[var(--space-2)] top-[var(--space-2)] z-10 flex gap-[var(--gap-xs)]">
              {props.dDay ? <Badge variant="strong">{props.dDay}</Badge> : null}
              {props.sponsored ? <Badge variant="on-image">{props.sponsored}</Badge> : null}
            </div>
            {props.save ? <SaveLikeOverlay className="z-10" saved={props.save.saved} onSave={props.save.onSave} saveLabel={props.save.label} like={props.like} /> : null}
          </div>
          <div className={cn(PANEL, 'flex items-center gap-[var(--space-2)]')}>
            <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
              <CardLink href={href} external={external} className={TITLE2}>{title}</CardLink>
              {props.description ? <p className="truncate type-body-base text-ui-fg-muted">{props.description}</p> : null}
              <MetaRow meta={props.meta} trending={props.trending} external={!!external} />
            </div>
            {props.addToPlan ? <IconButton variant="primary" label={props.addToPlan.label} icon={<Plus />} onClick={props.addToPlan.onAdd} className={ADD} /> : null}
          </div>
        </article>
      )
    case 'compact':
      return (
        <article className={cn(SHELL, 'h-[80px] flex-row rounded-tile-inner p-[var(--space-1-5)]', className)}>
          <Image ratio="1:1" src={props.imageSrc} alt={props.imageAlt ?? ''} sizes="80px" className="w-[68px] shrink-0 rounded-sq-lg" />
          <div className="panel flex min-w-0 flex-1 items-center gap-[var(--space-2)] py-[var(--space-2)] pl-[var(--space-3)] pr-[var(--space-1)]">
            <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
              <CardLink href={href} external={external} className={cn(TITLE2, 'line-clamp-1')}>{title}</CardLink>
              <div className="flex items-center gap-[var(--space-1)] type-body-caption text-ui-fg-muted">
                <MapPin aria-hidden className="size-[var(--icon-size-xs)] shrink-0" />
                <span className="truncate">{props.meta}</span>
              </div>
            </div>
            {props.addToPlan ? <IconButton variant="primary" label={props.addToPlan.label} icon={<Plus />} onClick={props.addToPlan.onAdd} className={ADD} /> : null}
            {props.save ? (
              <IconButton label={props.save.label} icon={<Bookmark className={props.save.saved ? 'fill-current' : undefined} />} aria-pressed={props.save.saved} onClick={props.save.onSave} className="relative z-10" />
            ) : null}
          </div>
        </article>
      )
    case 'collection':
      return (
        <article className={cn(SHELL, 'flex-col', className)}>
          <div className={cn(MEDIA, 'grid aspect-[2/1] grid-cols-2 grid-rows-2 gap-[var(--space-0-5)] bg-tile-surface')}>
            {[0, 1, 2, 3].map((i) => (
              <Image key={i} ratio="1:1" src={props.images[i] ?? null} alt="" sizes="280px" className="h-full !aspect-auto" />
            ))}
          </div>
          <div className={cn(PANEL, 'flex flex-col gap-[var(--space-1)]')}>
            <CardLink href={href} className={TITLE2}>{title}</CardLink>
            {props.meta ? <div className="type-body-caption text-ui-fg-muted">{props.meta}</div> : null}
          </div>
        </article>
      )
    case 'category':
      return (
        <article
          data-category={props.category}
          style={{ backgroundColor: props.color }}
          className={cn(
            'b4k-card b4k-press group relative isolate flex aspect-[3/4] flex-col overflow-hidden rounded-tile text-field-fg focus-within:shadow-focus-ring sm:aspect-[4/5]',
            className,
          )}
        >
          {/* No positioning on the label block: the title link's stretched area then covers the whole
              tile; the glyph and the photo let taps through to it. */}
          <div className="flex flex-col gap-[var(--space-1)] px-[var(--tile-padding)] pt-[var(--tile-padding)]">
            <CardLink href={href} className="text-[length:var(--title-size-tile)] font-[var(--font-weight-extrabold)] leading-[1.05] tracking-[-0.03em] [overflow-wrap:anywhere] [&:lang(ko)]:break-keep">{title}</CardLink>
            {props.meta ? <div className="text-[length:calc(var(--font-size-sm)*13/14)] leading-[1.3] text-field-fg-muted sm:text-sm sm:leading-[1.3]">{props.meta}</div> : null}
          </div>
          <Glyph name={props.glyph} size="26%" className="b4k-card-glyph pointer-events-none absolute bottom-[var(--tile-padding)] left-[var(--tile-padding)] !h-auto" />
          <span className="b4k-card-media pointer-events-none absolute bottom-[var(--space-3-5)] right-[var(--space-3-5)] w-1/2 overflow-hidden rounded-tile-inner bg-field-inset">
            <Image ratio="1:1" src={props.imageSrc} alt={props.imageAlt ?? ''} sizes="160px" className="bg-transparent" />
          </span>
        </article>
      )
    case 'collection-photo':
      return (
        <article className={cn(SHELL, 'flex-col', className)}>
          <Image ratio="4:3" src={props.imageSrc} alt={props.imageAlt ?? ''} sizes="280px" className={MEDIA} />
          <div className={cn(PANEL, 'flex flex-col gap-[var(--space-1)]')}>
            <CardLink href={href} className={TITLE2}>{title}</CardLink>
            {props.meta ? <div className="type-body-caption text-ui-fg-muted">{props.meta}</div> : null}
          </div>
        </article>
      )
    case 'plan':
      return (
        <article className={cn(SHELL, 'flex-col', className)}>
          <div className={cn('relative', MEDIA)}>
            <Image ratio="4:3" src={props.imageSrc} alt={props.imageAlt ?? ''} sizes="280px" />
            {props.sponsored ? <Badge variant="on-image" className="absolute left-[var(--space-2)] top-[var(--space-2)]">{props.sponsored}</Badge> : null}
            {props.save ? <SaveLikeOverlay className="z-10" saved={props.save.saved} onSave={props.save.onSave} saveLabel={props.save.label} /> : null}
          </div>
          <div className={cn(PANEL, 'flex flex-col gap-[var(--space-1)]')}>
            <CardLink href={href} className={TITLE2}>{title}</CardLink>
            <div className="flex items-center justify-between gap-[var(--space-1)] type-body-caption text-ui-fg-muted">
              {props.authorHref ? (
                // At least 24 x 24 to tap (it sits over the card's own link, so size is the only way): padding
                // grows the box, the same negative margin keeps the drawn row height.
                <IntlLink href={props.authorHref} className="relative z-10 block min-w-[var(--space-6)] truncate py-[calc((var(--space-6)-1lh)/2)] -my-[calc((var(--space-6)-1lh)/2)] hover:text-ui-fg hover:underline focus-visible:shadow-focus-ring focus-visible:outline-none">{props.author}</IntlLink>
              ) : (
                <span className="truncate">{props.author}</span>
              )}
              {props.saves ? <span className="inline-flex shrink-0 items-center gap-[var(--gap-xs)]"><Bookmark aria-hidden className="size-[var(--icon-size-xs)]" />{props.saves}</span> : null}
            </div>
            <div className="flex items-center gap-[var(--gap-xs)] type-body-caption text-ui-fg-muted"><Route aria-hidden className="size-[var(--icon-size-xs)]" />{props.stops}</div>
          </div>
        </article>
      )
    case 'package':
      return (
        <article className={cn(SHELL, 'flex-col', className)}>
          <div className={cn('relative', MEDIA)}>
            <Image ratio="4:3" src={props.imageSrc} alt={props.imageAlt ?? ''} sizes="280px" />
            <Badge variant="on-image" className="absolute left-[var(--space-2)] top-[var(--space-2)]">{props.sponsored}</Badge>
          </div>
          <div className={cn(PANEL, 'flex flex-col gap-[var(--space-1)]')}>
            <CardLink href={href} external={external} className={TITLE2}>{title}</CardLink>
            <div className="type-body-caption text-ui-fg-muted">{props.partner}</div>
            <div aria-hidden className="inline-flex items-center gap-[var(--gap-xs)] type-body-label text-ui-fg">{props.cta}<ExternalLink className="size-[var(--icon-size-xs)]" /></div>
          </div>
        </article>
      )
    default: {
      // Below 640 the Featured card stacks and takes the stacked panel (12 padding, 4 gap), as drawn on phones.
      const stacked = props.type === 'featured-stacked'
      return (
        <article className={cn(SHELL, stacked ? 'flex-col' : 'flex-col sm:flex-row', className)}>
          <div className={cn('relative', MEDIA, !stacked && 'sm:w-[42%] sm:shrink-0')}>
            <Image ratio="16:9" src={props.imageSrc} alt={props.imageAlt ?? ''} sizes="(min-width: 640px) 360px, 100vw" className={!stacked ? 'sm:h-full' : undefined} />
            {props.sponsored ? <Badge variant="on-image" className="absolute left-[var(--space-2)] top-[var(--space-2)]">{props.sponsored}</Badge> : null}
          </div>
          <div className={cn('panel flex min-w-0 flex-1 flex-col justify-center', stacked ? 'gap-[var(--space-1)] p-[var(--space-3)]' : 'gap-[var(--space-1)] p-[var(--space-3)] sm:gap-[var(--space-2)] sm:p-[var(--space-4)]')}>
            <span className="type-eyebrow-badge text-ui-fg">{props.eyebrow}</span>
            <CardLink href={href} external={external} className="line-clamp-2 type-title-empty-state">{title}</CardLink>
            <MetaRow meta={props.meta} trending={props.trending} external={!!external} />
          </div>
        </article>
      )
    }
  }
}
