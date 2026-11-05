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
import { Glyph } from './Glyph'
import { Image } from './Image'
import { Pagination } from './NavGroups'
import { HIT_AREA } from './styles'

// Content organisms (Figma Organisms): Hero, Carousel, Footer, Form, Tree view,
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
  /** Load the photo early (the first hero on a page; later carousel slides load lazily). */
  priority?: boolean
  className?: string
}

/** Hero. Home: a poster, a colour field (field-hero) with black ink, the title top-left and the
 * arrow glyph top-right (a slide with a picture shows it there as an inner squircle instead); the
 * action is a black 52 button. Section (Explore hub, categories): the photo with gradient/overlay-fade,
 * text bottom-left, always in the Dark colour mode; both are tiles (tile radius, 12 margin). */
export function Hero({ size = 'home', imageSrc, eyebrow, title, subtitle, action, as: H = 'h1', priority = true, className }: HeroProps) {
  if (size === 'home') {
    return (
      <section
        data-hero="poster"
        className={cn(
          'relative m-[var(--space-3)] h-[var(--hero-height-home)] w-[calc(100%-var(--space-3)*2)] overflow-hidden rounded-tile bg-field-hero text-field-fg max-md:m-[var(--space-2)] max-md:w-[calc(100%-var(--space-2)*2)]',
          className,
        )}
      >
        <span
          aria-hidden
          className="absolute right-[var(--space-11)] top-[var(--space-11)] size-[min(30vw,400px)] overflow-hidden rounded-tile-inner max-md:right-[var(--space-5)] max-md:top-[calc(var(--fab-size)+env(safe-area-inset-top)+var(--space-1-5))] max-md:size-[100px]"
        >
          {imageSrc ? (
            <Image ratio="1:1" src={imageSrc} alt="" priority={priority} sizes="(min-width: 768px) 400px, 100px" className="h-full !aspect-auto" />
          ) : (
            <Glyph name="arrow" size="100%" className="b4k-glyph-in" />
          )}
        </span>
        <div className="absolute inset-0 flex flex-col items-start justify-between gap-[var(--space-4)] p-[var(--space-11)] max-md:justify-end max-md:p-[var(--space-5)] max-md:pb-[var(--space-10)]">
          <div className="flex min-w-0 flex-col items-start gap-[var(--space-3)] md:max-w-[calc(100%-min(30vw,400px)-var(--space-6))]">
            {eyebrow ? <span className="type-eyebrow-category">{eyebrow}</span> : null}
            <H className="b4k-rise min-w-0 max-w-[min(980px,100%)] type-display-hero hyphens-auto [overflow-wrap:anywhere]">{title}</H>
            {subtitle ? <p className="max-w-[440px] text-[length:calc(var(--font-size-lg)+var(--border-width-1))] font-[500] leading-snug text-field-fg max-md:hidden">{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      </section>
    )
  }
  return (
    <section data-theme="dark" className={cn('relative m-[var(--space-3)] h-[var(--hero-height-section)] w-[calc(100%-var(--space-3)*2)] overflow-hidden rounded-tile bg-ui-bg-media text-ui-fg max-md:m-[var(--space-2)] max-md:w-[calc(100%-var(--space-2)*2)]', className)}>
      {imageSrc ? <Image ratio="16:9" src={imageSrc} alt="" priority={priority} sizes="100vw" className="!absolute inset-0 h-full !aspect-auto" /> : null}
      <div aria-hidden className="absolute inset-0 bg-overlay-fade" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-[var(--space-3)] p-[var(--space-11)] max-md:px-[var(--space-6)] max-md:pb-[var(--space-10)] max-md:pt-[var(--space-6)]">
        {eyebrow ? <Badge variant="on-image">{eyebrow}</Badge> : null}
        <H className="type-display-hub min-w-0 max-w-[min(960px,100%)] hyphens-auto [overflow-wrap:anywhere]">{title}</H>
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

/** Carousel: no autoplay; slides change only when the user acts; crossfade (none with reduced motion). */
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
    // The rail can start or stop overflowing when the window or the cards change size.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    ro?.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro?.disconnect()
    }
  }, [items.length])
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
    if (e.key === 'ArrowRight') setI((x) => (x + 1) % items.length)
    else if (e.key === 'ArrowLeft') setI((x) => (x - 1 + items.length) % items.length)
  }
  return (
    <section aria-roledescription="carousel" aria-label={label} onKeyDown={onKey} className={cn('relative', className)}>
      {items.map((c, n) => (
        <div key={n} role="group" aria-roledescription="slide" aria-label={slideLabel(n + 1, items.length)} hidden={n !== i} className="motion-safe:animate-b4k-fade-in">
          {c}
        </div>
      ))}
      {/* The controls sit on the poster: black dots (idle 35%) and black arrows with white icons. */}
      <div className="absolute bottom-[var(--space-6)] left-1/2 -translate-x-1/2 [--color-border-strong:var(--field-fg)] [--color-fg:var(--field-fg)] max-md:bottom-[var(--space-4)] [&_.bg-ui-border-strong]:opacity-[.35]">
        <Pagination type="dots" label={label} page={i + 1} pageCount={items.length} statusText={slideLabel(i + 1, items.length)} />
      </div>
      <div className="absolute bottom-[calc(var(--space-3)+var(--space-8))] right-[calc(var(--space-3)+var(--space-8))] flex gap-[var(--space-2)] [--color-bg-inverse:var(--field-fg)] [--color-fg-inverse:var(--photo-action-fg)] max-lg:hidden">
        <IconButton variant="primary" label={previousLabel} icon={<ChevronLeft />} onClick={() => setI((i - 1 + items.length) % items.length)} />
        <IconButton variant="primary" label={nextLabel} icon={<ChevronRight />} onClick={() => setI((i + 1) % items.length)} />
      </div>
    </section>
  )
}

export type FooterProps = {
  /** Legal links in order: About B4K, Help, Terms, Privacy Policy (strong), Cookies. */
  links: { label: string; href: string; strong?: boolean }[]
  copyright: string
  navLabel: string
  /** Figma Show company line: the company details and Check business info, behind Company details. */
  company?: { line: string; check: { href: string; label: string }; toggleLabel: string }
  className?: string
}

const FOOTER_LINK = 'relative text-ui-fg-muted hover:text-ui-fg hover:underline focus-visible:underline decoration-[length:var(--border-width-1-5)] underline-offset-4 focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-ui-border-focus'

/** Footer: legal links and the copyright, then the company line; content pages only. */
export function Footer({ links, copyright, navLabel, company, className }: FooterProps) {
  const [companyOpen, setCompanyOpen] = useState(false)
  const companyId = useId()
  // Desktop: the links, Company details and the copyright in one row; the company line opens under
  // it (12 apart). Phones: the links, Company details (opens the company line), the copyright.
  return (
    <footer className={cn('flex flex-wrap items-center gap-x-[var(--space-4)] gap-y-[var(--space-3)] border-t border-ui-border-subtle bg-ui-bg px-[var(--space-8)] py-[var(--space-6)] type-body-caption text-ui-fg-placeholder max-md:flex-col max-md:flex-nowrap max-md:items-start max-md:px-[var(--space-4)]', className)}>
      <nav aria-label={navLabel} className="flex-1">
        <ul className="flex flex-wrap gap-x-[var(--space-4)] gap-y-[var(--space-2)]">
          {links.map((l) => (
            <li key={l.href}>
              <IntlLink href={l.href} className={cn(l.strong && 'type-body-label', 'relative', HIT_AREA, 'text-ui-fg-muted hover:text-ui-fg hover:underline focus-visible:underline decoration-[length:var(--border-width-1-5)] underline-offset-4 focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-ui-border-focus')}>{l.label}</IntlLink>
            </li>
          ))}
        </ul>
      </nav>
      {company ? (
        <button type="button" aria-expanded={companyOpen} aria-controls={companyId} onClick={() => setCompanyOpen((o) => !o)} className={cn(FOOTER_LINK, HIT_AREA)}>
          {company.toggleLabel}
        </button>
      ) : null}
      <p className="max-md:order-last">{copyright}</p>
      {company ? (
        <div id={companyId} className={cn('flex w-full gap-[var(--space-3)] max-md:flex-col md:flex-wrap md:items-start', !companyOpen && 'hidden')}>
          <p className="md:min-w-0 md:max-w-max md:flex-1">{company.line}</p>
          <a href={company.check.href} target="_blank" rel="noopener noreferrer" className={cn(FOOTER_LINK, HIT_AREA, 'shrink-0 self-start')}>{company.check.label}</a>
        </div>
      ) : null}
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

/** Form: one column, visible labels, errors on submit with a summary at the top (GOV.UK). */
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
                <li key={it.fieldId}><a href={`#${it.fieldId}`} className="underline decoration-[length:var(--border-width-1-5)] underline-offset-4">{it.message}</a></li>
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

/** Tree view: Tree items nested 16 per level; role tree. */
export function TreeView({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <ul role="tree" aria-label={label} className={className}>{children}</ul>
}

/** Accordion: a stack of Accordion items, each with its divider inside; several can be open. */
export function Accordion({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
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

/** Now Seoul card: local time, weather, three forecast days, one live tip. */
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
          <p className="flex gap-[var(--space-2)] type-body-base"><Sparkles aria-hidden className="mt-[var(--space-0-5)] size-[var(--icon-size-sm)] shrink-0" />{tip}</p>
        </div>
      ) : null}
    </section>
  )
}
