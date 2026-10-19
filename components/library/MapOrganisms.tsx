'use client'

import { useId, type ReactNode } from 'react'
import { ArrowLeft, Bookmark, ChevronDown, ChevronRight, Clock, Folder, Globe, Heart, Lock, MapPin, Minus, Plus, Share2, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge } from './Badge'
import { Button } from './Button'
import { ChatBubble } from './Content'
import { AiInput, ItineraryStop, PlanStopRow } from './ContentMolecules'
import { Chip } from './Chip'
import { EmptyState } from './Feedback'
import { IconButton } from './IconButton'
import { Image } from './Image'
import { ListItem } from './Lists'
import { Tabs } from './NavGroups'
import { TransportMode } from './Plan'
import { FOCUS_RING_INSET } from './styles'

// Map and planning organisms (UI-76, UI-77, UI-78, UI-89; Figma Organisms): AI panel, Plan cart,
// Left panel, Saved hub, Itinerary panel, Place detail. Data comes in as props; texts as labels.

type Day = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type AiPanelProps = {
  /** Figma Viewport: desktop floats bottom right of the map (not modal); mobile is full screen. */
  viewport: 'desktop' | 'mobile'
  title: string
  greeting: string
  suggestions: string[]
  onSuggestion: (s: string) => void
  messages: { role: 'user' | 'assistant'; text: ReactNode }[]
  typing?: boolean
  input: { value: string; onValueChange: (v: string) => void; onSend: () => void; placeholder: string; sendLabel: string; disabled?: boolean }
  labels: { minimize: string; close: string; back: string; typing: string }
  onMinimize: () => void
  onClose: () => void
  className?: string
}

/** AI panel (UI-76): greeting and suggestion chips when empty; chat bubbles in a log; AI input at the bottom. */
export function AiPanel({ viewport, title, greeting, suggestions, onSuggestion, messages, typing, input, labels, onMinimize, onClose, className }: AiPanelProps) {
  const id = useId()
  const desktop = viewport === 'desktop'
  return (
    <section
      role={desktop ? 'complementary' : 'dialog'}
      aria-labelledby={id}
      className={cn('flex flex-col bg-ui-bg-elevated text-ui-fg', desktop ? 'h-[min(65vh,640px)] w-[380px] rounded-2xl border border-ui-border' : 'h-full w-full', className)}
    >
      <div className="flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)]">
        {desktop ? null : <IconButton label={labels.back} icon={<ArrowLeft />} onClick={onMinimize} className="-ml-[var(--space-2)]" />}
        <h2 id={id} className="flex-1 type-title-card">{title}</h2>
        {desktop ? (
          <>
            <IconButton label={labels.minimize} icon={<Minus />} onClick={onMinimize} />
            <IconButton label={labels.close} icon={<X />} onClick={onClose} className="-mr-[var(--space-2)]" />
          </>
        ) : null}
      </div>
      <div role="log" aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-[var(--space-2)] overflow-y-auto px-[var(--space-4)] py-[var(--space-2)]">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-[var(--space-4)]">
            <p className="type-body-base text-ui-fg">{greeting}</p>
            <div className="flex flex-wrap gap-[var(--space-2)]">
              {suggestions.map((s) => <Chip key={s} onClick={() => onSuggestion(s)}>{s}</Chip>)}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <ChatBubble key={i} role={m.role}>{m.text}</ChatBubble>)
        )}
        {typing ? <ChatBubble role="typing" typingLabel={labels.typing} /> : null}
      </div>
      <div className="px-[var(--space-4)] pb-[var(--space-4)] pt-[var(--space-2)]">
        <AiInput {...input} />
      </div>
    </section>
  )
}

export type PlanStop = { id: string; name: string; day: Day; duration: string; durationLabel: string; leg?: string; imageSrc?: string | null }

export type PlanCartProps = {
  /** Figma State. */
  state: 'empty' | 'collapsed' | 'open'
  onToggle: () => void
  stops: PlanStop[]
  days: number
  activeDay: 'all' | Day
  onDayChange: (d: 'all' | Day) => void
  onAddDay?: () => void
  /** Delete a day: a × inside the selected day tab while the plan has more than one day. */
  onRemoveDay?: (day: Day) => void
  /** Collapsed summary, e.g. "5 stops · about 6 h"; last added place. */
  summary: string
  lastAdded?: string
  /** Collapsed: the last added place's photo (Figma Last added › Thumbnail, 48). */
  lastAddedImage?: string | null
  /** Collapsed: the line under the last added place, e.g. "Last added · 2 more". */
  lastAddedMeta?: string
  /** Day total for the open day, e.g. "Day 1 · about 4 h". */
  dayTotal?: string
  onDuration: (id: string) => void
  onRemove: (id: string) => void
  onSave: () => void
  onDiscard: () => void
  labels: {
    region: string
    emptyTitle: string
    emptyBody: string
    all: string
    day: (n: number) => string
    addDay: string
    /** Accessible name of the delete-day button, e.g. "Delete Day 2". */
    removeDay?: (n: number) => string
    /** Day tabs scroll arrows. */
    previousDays?: string
    nextDays?: string
    save: string
    discard: string
    remove: (name: string) => string
    reorder: (name: string) => string
    open: string
    close: string
    about: string
  }
  className?: string
}

/** Plan cart (UI-77): the plan as a shopping cart at the bottom of the Left panel. */
export function PlanCart({ state, onToggle, stops, days, activeDay, onDayChange, onAddDay, onRemoveDay, summary, lastAdded, lastAddedImage, lastAddedMeta, dayTotal, onDuration, onRemove, onSave, onDiscard, labels, className }: PlanCartProps) {
  const id = useId()
  if (state === 'empty') {
    return (
      <section aria-label={labels.region} className={cn('border-t border-ui-border bg-ui-bg px-[var(--space-4)] py-[var(--space-4)]', className)}>
        <p className="type-title-card text-ui-fg">{labels.emptyTitle}</p>
        <p className="mt-[var(--space-1)] type-body-caption text-ui-fg-muted">{labels.emptyBody}</p>
      </section>
    )
  }
  const shown = activeDay === 'all' ? stops : stops.filter((s) => s.day === activeDay)
  return (
    <section aria-labelledby={id} className={cn('flex flex-col text-ui-fg', state === 'open' ? 'h-full bg-ui-bg' : 'border-t border-ui-border bg-ui-bg-sunken', className)}>
      {/* Open: the Left panel's color/bg; collapsed: the color/bg-sunken bar (Figma Plan cart). */}
      <button type="button" aria-expanded={state === 'open'} onClick={onToggle} className={cn('flex w-full flex-col gap-[var(--space-3)] px-[var(--space-4)] text-left hover:bg-ui-state-hover', state === 'collapsed' ? 'py-[var(--space-4)]' : 'py-[var(--space-3)]', FOCUS_RING_INSET)}>
        <span className="flex w-full items-center gap-[var(--space-2)]">
          <span id={id} aria-live="polite" className="min-w-0 flex-1 type-title-card">{summary}</span>
          <span className="sr-only">{state === 'open' ? labels.close : labels.open}</span>
          <ChevronDown aria-hidden className={cn('size-[var(--icon-size-sm)] shrink-0 text-ui-fg-muted transition-transform', state === 'collapsed' && 'rotate-180')} />
        </span>
        {/* Figma Plan cart Collapsed › Last added: photo, place, "Last added · 2 more". */}
        {state === 'collapsed' && lastAdded ? (
          <span className="flex min-w-0 items-center gap-[var(--space-3)]">
            {lastAddedImage !== undefined ? <Image ratio="1:1" src={lastAddedImage} alt="" sizes="48px" className="w-[var(--space-12)] shrink-0" /> : null}
            <span className="flex min-w-0 flex-col gap-[var(--space-0-5)]">
              <span className="truncate type-body-base text-ui-fg">{lastAdded}</span>
              {lastAddedMeta ? <span className="truncate type-body-caption text-ui-fg-muted">{lastAddedMeta}</span> : null}
            </span>
          </span>
        ) : null}
      </button>
      {state === 'open' ? (
        <>
          <div className="flex items-center gap-[var(--space-1)] pr-[var(--space-2)]">
            <Tabs
              label={labels.region}
              value={String(activeDay)}
              onValueChange={(v) => onDayChange(v === 'all' ? 'all' : (Number(v) as Day))}
              tabs={[
                { id: 'all', label: labels.all },
                ...Array.from({ length: days }, (_, i) => ({
                  id: String(i + 1),
                  label: labels.day(i + 1),
                  day: (i + 1) as Day,
                  // The × shows on the selected day only.
                  onClose: onRemoveDay && days > 1 && activeDay === i + 1 ? () => onRemoveDay((i + 1) as Day) : undefined,
                  closeLabel: labels.removeDay?.(i + 1),
                })),
              ]}
              scrollLabels={labels.previousDays && labels.nextDays ? { previous: labels.previousDays, next: labels.nextDays } : undefined}
              className="min-w-0 flex-1"
            />
            {onAddDay && days < 8 ? <IconButton label={labels.addDay} icon={<Plus />} onClick={onAddDay} /> : null}
          </div>
          <ol className="min-h-0 flex-1 overflow-y-auto px-[var(--space-4)] py-[var(--space-2)]">
            {shown.map((s, i) => (
              <li key={s.id} className="list-none">
                <ul>
                  <PlanStopRow name={s.name} thumbnail={s.imageSrc} number={stops.indexOf(s) + 1} day={s.day} duration={s.duration} durationLabel={s.durationLabel} onDuration={() => onDuration(s.id)} onRemove={() => onRemove(s.id)} removeLabel={labels.remove(s.name)} reorderLabel={labels.reorder(s.name)} />
                </ul>
                {s.leg && i < shown.length - 1 ? <div className="ml-[34px]"><TransportMode mode="estimate" modeLabel={labels.about} time={s.leg} /></div> : null}
              </li>
            ))}
          </ol>
          {dayTotal ? <p className="px-[var(--space-4)] pb-[var(--space-2)] type-body-caption text-ui-fg-muted">{dayTotal}</p> : null}
          <div className="flex flex-col gap-[var(--space-2)] px-[var(--space-4)] pb-[var(--space-4)]">
            <Button onClick={onSave} className="w-full">{labels.save}</Button>
            <Button variant="ghost" size="md" onClick={onDiscard} className="w-full">{labels.discard}</Button>
          </div>
        </>
      ) : null}
    </section>
  )
}

export type LeftPanelProps = {
  /** Figma Type: Map 420 (content and Plan cart), Index 280 (tree only), Filters 420 (search filters). */
  type: 'map' | 'index' | 'filters'
  label: string
  /** Content slot (Browse, Place detail, Saved hub, a Tree view, Search filters). */
  children: ReactNode
  /** Map type: the Plan cart; Open covers the panel. */
  cart?: ReactNode
  cartOpen?: boolean
  /** Top inset kept clear for the Universal search (UI-101 shell). */
  topClear?: boolean
  className?: string
}

/** Left panel (UI-77, UI-87): desktop panel next to the rail; complementary landmark. */
export function LeftPanel({ type, label, children, cart, cartOpen, topClear, className }: LeftPanelProps) {
  return (
    <aside aria-label={label} className={cn('relative flex h-full shrink-0 flex-col bg-ui-bg', type === 'index' ? 'w-[var(--layout-left-panel-index)]' : 'w-[var(--layout-left-panel)]', topClear && 'pt-[72px]', className)}>
      <div className={cn('min-h-0 flex-1 overflow-y-auto', cartOpen && 'invisible')}>{children}</div>
      {type === 'map' && cart ? <div className={cn(cartOpen ? 'absolute inset-0 z-10' : 'shrink-0')}>{cart}</div> : null}
    </aside>
  )
}

export type SavedHubProps = {
  /** Figma View. */
  view: 'places' | 'folder' | 'empty'
  folders?: { id: string; name: string; count: string }[]
  folder?: { name: string; places: { id: string; name: string; meta: string; imageSrc?: string | null }[] }
  onOpenFolder: (id: string) => void
  onBack: () => void
  onAdd: (placeId: string) => void
  emptyAction: ReactNode
  labels: { back: string; add: (name: string) => string; emptyTitle: string; emptyBody: string }
}

/** Saved hub (UI-77, PD-48): saved places inside the map, for adding them to a plan. */
export function SavedHub({ view, folders = [], folder, onOpenFolder, onBack, onAdd, emptyAction, labels }: SavedHubProps) {
  if (view === 'empty') return <EmptyState title={labels.emptyTitle} action={emptyAction}>{labels.emptyBody}</EmptyState>
  if (view === 'places') {
    return (
      <ul>
        {folders.map((f) => (
          <ListItem key={f.id} title={f.name} secondary={f.count} leading={<Folder />} chevron onClick={() => onOpenFolder(f.id)} />
        ))}
      </ul>
    )
  }
  return (
    <div>
      <button type="button" onClick={onBack} className={cn('flex min-h-[var(--target-touch-min)] w-full items-center gap-[var(--space-2)] px-[var(--space-4)] type-title-card text-ui-fg hover:bg-ui-state-hover', FOCUS_RING_INSET)}>
        <ArrowLeft aria-hidden className="size-[var(--icon-size-sm)]" />
        <span className="sr-only">{labels.back}: </span>
        {folder?.name}
      </button>
      <ul>
        {folder?.places.map((p) => (
          <ListItem
            key={p.id}
            title={p.name}
            secondary={p.meta}
            leading={<Image ratio="1:1" src={p.imageSrc} alt="" sizes="48px" className="w-[48px]" />}
            trailing={<IconButton label={labels.add(p.name)} icon={<Plus />} onClick={() => onAdd(p.id)} />}
          />
        ))}
      </ul>
    </div>
  )
}

export type ItineraryPanelProps = {
  title: string
  owner: string
  /** Owner only: lock and Private beside the owner name. */
  privateLabel?: string
  stats: string[]
  days: number
  activeDay: 'all' | Day
  onDayChange: (d: 'all' | Day) => void
  stops: { id: string; name: string; day: Day; meta: string; note?: string; imageSrc?: string | null; leg?: { mode: 'car' | 'public' | 'walk'; label: string; time: string } }[]
  selectedStop?: string
  onSelectStop?: (id: string) => void
  /** Owner can change transport modes. */
  onLeg?: (id: string) => void
  related?: ReactNode
  /** Footer buttons: Owner = Edit plan, Share, Delete; Visitor = Save, Like, Share. */
  footer: ReactNode
  labels: { all: string; day: (n: number) => string; days: string; related: string }
}

/** Itinerary panel (UI-77, ADD-68): title is the page h1; day tabs; stops as an ordered list. */
export function ItineraryPanel({ title, owner, privateLabel, stats, days, activeDay, onDayChange, stops, selectedStop, onSelectStop, onLeg, related, footer, labels }: ItineraryPanelProps) {
  const shown = activeDay === 'all' ? stops : stops.filter((s) => s.day === activeDay)
  return (
    <div className="flex h-full flex-col text-ui-fg">
      <div className="flex flex-col gap-[var(--space-2)] px-[var(--space-4)] pb-[var(--space-3)] pt-[var(--space-4)]">
        <h1 className="type-display-h2">{title}</h1>
        <p className="flex items-center gap-[var(--space-2)] type-body-caption text-ui-fg-muted">
          {owner}
          {privateLabel ? <span className="inline-flex items-center gap-[var(--gap-xs)]"><Lock aria-hidden className="size-[var(--icon-size-xs)]" />{privateLabel}</span> : null}
        </p>
        <p className="type-body-caption text-ui-fg-muted">{stats.join(' · ')}</p>
      </div>
      <Tabs label={labels.days} value={String(activeDay)} onValueChange={(v) => onDayChange(v === 'all' ? 'all' : (Number(v) as Day))} tabs={[{ id: 'all', label: labels.all }, ...Array.from({ length: days }, (_, i) => ({ id: String(i + 1), label: labels.day(i + 1), day: (i + 1) as Day }))]} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ol className="px-[var(--space-2)] py-[var(--space-2)]">
          {shown.map((s, i) => (
            <li key={s.id} className="list-none">
              <ul>
                <ItineraryStop name={s.name} number={stops.indexOf(s) + 1} day={s.day} meta={s.meta} note={s.note} thumbnail={s.imageSrc} selected={selectedStop === s.id} onSelect={onSelectStop ? () => onSelectStop(s.id) : undefined} />
              </ul>
              {s.leg && i < shown.length - 1 ? (
                <div className="ml-[19px]"><TransportMode mode={s.leg.mode} modeLabel={s.leg.label} time={s.leg.time} onChange={onLeg ? () => onLeg(s.id) : undefined} /></div>
              ) : null}
            </li>
          ))}
        </ol>
        {related ? (
          <section className="flex flex-col gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-4)]">
            <h2 className="type-display-h3">{labels.related}</h2>
            {related}
          </section>
        ) : null}
      </div>
      <div className="flex gap-[var(--space-2)] border-t border-ui-border px-[var(--space-4)] py-[var(--space-3)]">{footer}</div>
    </div>
  )
}

export type PlaceDetailProps = {
  viewport: 'desktop' | 'mobile'
  name: string
  /** category · district · open status */
  meta: string
  imageSrc?: string | null
  imageAlt?: string
  description?: string
  /** Figma Show sponsored (off at launch, PD-18). */
  sponsored?: string
  details: { icon: 'hours' | 'address' | 'website'; title: string; href?: string }[]
  saved: boolean
  liked: boolean
  onAdd: () => void
  onSave: () => void
  onLike: () => void
  onShare: () => void
  labels: { add: string; save: string; like: string; share: string }
}

/** Place detail (UI-89): photo, name (display/h2), meta, actions (Add to plan, Save, Like, Share), details. */
export function PlaceDetail({ viewport, name, meta, imageSrc, imageAlt, description, sponsored, details, saved, liked, onAdd, onSave, onLike, onShare, labels }: PlaceDetailProps) {
  const ICON = { hours: Clock, address: MapPin, website: Globe } as const
  return (
    <section aria-label={name} className="flex flex-col gap-[var(--space-4)] text-ui-fg">
      <Image ratio={viewport === 'desktop' ? '4:3' : '16:9'} src={imageSrc} alt={imageAlt ?? ''} sizes="420px" />
      <div className="flex flex-col gap-[var(--space-1)] px-[var(--space-4)]">
        {sponsored ? <Badge variant="normal" className="self-start">{sponsored}</Badge> : null}
        <h2 className="type-display-h2">{name}</h2>
        <p className="type-body-caption text-ui-fg-muted">{meta}</p>
      </div>
      <div className="flex items-center gap-[var(--space-2)] px-[var(--space-4)]">
        <Button leadingIcon={<Plus />} onClick={onAdd} className="flex-1">{labels.add}</Button>
        <IconButton variant="secondary" label={labels.save} aria-pressed={saved} icon={<Bookmark className={saved ? 'fill-current' : undefined} />} onClick={onSave} />
        <IconButton variant="secondary" label={labels.like} aria-pressed={liked} icon={<Heart className={liked ? 'fill-current' : undefined} />} onClick={onLike} />
        <IconButton variant="secondary" label={labels.share} icon={<Share2 />} onClick={onShare} />
      </div>
      {description ? <p className="px-[var(--space-4)] type-body-base text-ui-fg-muted">{description}</p> : null}
      <ul className="border-t border-ui-border">
        {details.map((d) => {
          const Icon = ICON[d.icon]
          return d.href ? (
            <ListItem key={d.title} title={d.title} leading={<Icon />} trailing={<ChevronRight className="size-[var(--icon-size-sm)]" />} onClick={() => window.open(d.href, '_blank', 'noopener')} />
          ) : (
            <ListItem key={d.title} title={d.title} leading={<Icon />} />
          )
        })}
      </ul>
    </section>
  )
}
