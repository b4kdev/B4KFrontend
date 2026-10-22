'use client'

import { Children, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { Badge } from './Badge'
import { ForecastDay } from './Content'
import { SectionHeader } from './ContentMolecules'
import { Alert } from './Feedback'
import { IconButton } from './IconButton'
import { Image } from './Image'
import { Pagination } from './NavGroups'

// Content organisms (UI-72, UI-75; Figma Organisms): Hero, Carousel, Footer, Form, Tree view,
// Accordion, Now Seoul card.

export type HeroProps = {
  /** Figma Size: Home uses display/hero and hero/height-home; Section display/hub and hero/height-section. */
  size?: 'home' | 'section'
  imageSrc?: string | null
  eyebrow?: string
  title: string
  subtitle?: string
  /** Figma Show action: one Primary button (pass a Button or link). */
  action?: ReactNode
  /** Home: the page h1. */
  as?: 'h1' | 'h2'
  className?: string
}

/** Hero (CMP-057): full-width photo with gradient/overlay-fade, text bottom left; always in the Dark color mode. */
export function Hero({ size = 'home', imageSrc, eyebrow, title, subtitle, action, as: H = 'h1', className }: HeroProps) {
  return (
    <section data-theme="dark" className={cn('relative w-full overflow-hidden bg-ui-bg-media text-ui-fg', size === 'home' ? 'h-[var(--hero-height-home)]' : 'h-[var(--hero-height-section)]', className)}>
      <Image ratio="16:9" src={imageSrc} alt="" priority sizes="100vw" className="!absolute inset-0 h-full !aspect-auto" />
      <div aria-hidden className="absolute inset-0 bg-overlay-fade" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-[var(--space-3)] p-[var(--space-11)] max-md:px-[var(--space-6)] max-md:pb-[var(--space-10)] max-md:pt-[var(--space-6)]">
        {eyebrow ? <Badge variant="on-image">{eyebrow}</Badge> : null}
        <H className={cn(size === 'home' ? 'type-display-hero' : 'type-display-hub', 'min-w-0 max-w-[min(960px,100%)] hyphens-auto [overflow-wrap:anywhere] [text-wrap:balance] [&:lang(ko)]:break-keep')}>{title}</H>
        {subtitle ? <p className="max-w-[400px] type-body-long text-ui-fg-muted max-md:hidden">{subtitle}</p> : null}
        {action ? <div className="pt-[var(--space-3)]">{action}</div> : null}
      </div>
    </section>
  )
}

export type CarouselProps = {
  /** Figma Type. Hero: slides with dots; Rail: a section title over a sideways row of cards. */
  type: 'hero' | 'rail'
  /** Accessible name of the carousel (Hero) or the section title (Rail). */
  label: string
  children: ReactNode
  /** Rail: See all link. */
  seeAll?: { href: string; label: string }
  subtitle?: string
  previousLabel: string
  nextLabel: string
  /** "Slide {n} of {m}" from the messages. */
  slideLabel: (n: number, m: number) => string
  className?: string
}

/** Carousel (CMP-053): no autoplay; slides change only when the user acts; crossfade (none with reduced motion). */
export function Carousel({ type, label, children, seeAll, subtitle, previousLabel, nextLabel, slideLabel, className }: CarouselProps) {
  const items = Children.toArray(children)
  const [i, setI] = useState(0)
  const rail = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const titleId = useId()
  useEffect(() => {
    const el = rail.current
    if (!el) return
    const update = () => setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    return () => el.removeEventListener('scroll', update)
  }, [])
  if (type === 'rail') {
    const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: 'smooth' })
    return (
      <section aria-labelledby={titleId} className={cn('flex flex-col gap-[var(--space-4)]', className)}>
        <SectionHeader id={titleId} title={label} subtitle={subtitle} seeAll={seeAll} arrows={{ onPrevious: () => scroll(-1), onNext: () => scroll(1), previousLabel, nextLabel, atStart: edges.start, atEnd: edges.end }} />
        <ul ref={rail} className="-mx-[var(--grid-gutter-mobile)] flex snap-x snap-mandatory gap-[var(--space-3)] overflow-x-auto scroll-px-[var(--grid-gutter-mobile)] px-[var(--grid-gutter-mobile)] pb-[var(--space-1)] [scrollbar-width:none] lg:mx-0 lg:px-0">
          {items.map((c, n) => (
            <li key={n} className="w-[280px] shrink-0 snap-start">{c}</li>
          ))}
        </ul>
      </section>
    )
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') setI((x) => Math.min(items.length - 1, x + 1))
    else if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1))
  }
  return (
    <section aria-roledescription="carousel" aria-label={label} onKeyDown={onKey} className={cn('relative', className)}>
      {items.map((c, n) => (
        <div key={n} role="group" aria-roledescription="slide" aria-label={slideLabel(n + 1, items.length)} hidden={n !== i} className="motion-safe:animate-b4k-fade-in">
          {c}
        </div>
      ))}
      <div className="absolute bottom-[var(--space-4)] left-[var(--space-11)] max-md:left-[var(--space-6)]" data-theme="dark">
        <Pagination type="dots" label={label} page={i + 1} pageCount={items.length} statusText={slideLabel(i + 1, items.length)} />
      </div>
      <div className="absolute bottom-[var(--space-5)] right-[var(--space-6)] flex gap-[var(--space-2)] max-lg:hidden" data-theme="dark">
        <IconButton variant="secondary" label={previousLabel} icon={<ChevronLeft />} disabled={i === 0} onClick={() => setI(i - 1)} />
        <IconButton variant="secondary" label={nextLabel} icon={<ChevronRight />} disabled={i === items.length - 1} onClick={() => setI(i + 1)} />
      </div>
    </section>
  )
}

export type FooterProps = {
  /** Legal links in order: About B4K, Help, Terms, Privacy Policy (strong), Cookies. */
  links: { label: string; href: string; strong?: boolean }[]
  copyright: string
  navLabel: string
  className?: string
}

/** Footer (CMP-048): one row of legal links and the copyright; content pages only. */
export function Footer({ links, copyright, navLabel, className }: FooterProps) {
  return (
    <footer className={cn('flex flex-wrap items-center gap-[var(--space-4)] border-t border-ui-border bg-ui-bg px-[var(--space-8)] py-[var(--space-6)] type-body-caption text-ui-fg-muted max-md:flex-col max-md:items-start max-md:gap-[var(--space-3)] max-md:px-[var(--space-4)]', className)}>
      <nav aria-label={navLabel} className="flex-1">
        <ul className="flex flex-wrap gap-x-[var(--space-4)] gap-y-[var(--space-2)]">
          {links.map((l) => (
            <li key={l.href}>
              <IntlLink href={l.href} className={cn(l.strong && 'type-body-label', 'hover:text-ui-link-hover focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-ui-border-focus')}>{l.label}</IntlLink>
            </li>
          ))}
        </ul>
      </nav>
      <p>{copyright}</p>
    </footer>
  )
}

export type FormProps = {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  /** Error summary (forms with 3 or more fields): title and the fields with errors. */
  errorSummary?: { title: string; items: { fieldId: string; message: string }[] }
  /** Fields (20 apart). */
  children: ReactNode
  /** Actions at the bottom, primary first; full width on phones. */
  actions: ReactNode
  className?: string
}

/** Form (CMP-025): one column, visible labels, errors on submit with a summary at the top (GOV.UK). */
export function Form({ onSubmit, errorSummary, children, actions, className }: FormProps) {
  const summary = useRef<HTMLDivElement>(null)
  const count = errorSummary?.items.length ?? 0
  useEffect(() => {
    if (count) summary.current?.focus()
  }, [count])
  return (
    <form noValidate onSubmit={onSubmit} className={cn('flex flex-col gap-[var(--space-5)]', className)}>
      {count ? (
        <div ref={summary} tabIndex={-1} className="outline-none">
          <Alert type="critical" title={errorSummary!.title}>
            <ul className="list-disc pl-[var(--space-5)]">
              {errorSummary!.items.map((it) => (
                <li key={it.fieldId}><a href={`#${it.fieldId}`} className="underline underline-offset-2">{it.message}</a></li>
              ))}
            </ul>
          </Alert>
        </div>
      ) : null}
      {children}
      <div className="flex gap-[var(--gap-sm)] pt-[var(--space-1)] max-md:flex-col max-md:[&>*]:w-full">{actions}</div>
    </form>
  )
}

/** Tree view (CMP-046): Tree items nested 16 per level; role tree. */
export function TreeView({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <ul role="tree" aria-label={label} className={className}>{children}</ul>
}

/** Accordion (CMP-052): Accordion items under a 1px top border; several can be open. */
export function Accordion({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('border-t border-ui-border', className)}>{children}</div>
}

export type NowSeoulCardProps = {
  /** Region name, e.g. "Seoul now". */
  label: string
  eyebrow: string
  time: string
  date: string
  temperature: string
  condition: string
  weatherIcon: ReactNode
  forecast: { day: string; icon: ReactNode; range: string; label: string }[]
  /** Figma Show tip. */
  tip?: string
  className?: string
}

/** Now Seoul card (UI-75): local time, weather, three forecast days, one live tip. */
export function NowSeoulCard({ label, eyebrow, time, date, temperature, condition, weatherIcon, forecast, tip, className }: NowSeoulCardProps) {
  return (
    <section aria-label={label} className={cn('flex flex-col gap-[var(--space-4)] border border-ui-border bg-ui-bg-raised p-[var(--space-4)] text-ui-fg', className)}>
      <span className="type-eyebrow-category text-ui-fg-muted">{eyebrow}</span>
      <div className="flex items-center gap-[var(--space-6)]">
        <div className="flex flex-col gap-[var(--space-0-5)]">
          <span className="type-numeric-rank">{time}</span>
          <span className="type-body-caption text-ui-fg-muted">{date}</span>
        </div>
        <div className="flex items-center gap-[var(--space-2)]">
          <span aria-hidden className="inline-flex size-[var(--icon-size-lg)] [&>svg]:size-full">{weatherIcon}</span>
          <div className="flex flex-col gap-[var(--space-0-5)]">
            <span className="type-title-card">{temperature}</span>
            <span className="type-body-caption text-ui-fg-muted">{condition}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-[var(--space-4)]">
        {forecast.map((f) => <ForecastDay key={f.day} {...f} />)}
      </div>
      {tip ? (
        <div className="flex flex-col gap-[var(--space-4)]">
          <span aria-hidden className="h-px bg-ui-border-subtle" />
          <p className="flex gap-[var(--space-2)] type-body-base"><Sparkles aria-hidden className="mt-[2px] size-[var(--icon-size-sm)] shrink-0" />{tip}</p>
        </div>
      ) : null}
    </section>
  )
}
