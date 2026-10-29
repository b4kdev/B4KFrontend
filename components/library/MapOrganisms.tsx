'use client'

import { useId, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { ArrowLeft, Bookmark, ChevronDown, Clock, Folder, Globe, Heart, Lock, MapPin, Minus, Plus, Share2, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { Button } from './Button'
import { ChatBubble, CreditLine } from './Content'
import { AiInput, ItineraryStop, PlanStopRow } from './ContentMolecules'
import { Chip } from './Chip'
import { EmptyState } from './Feedback'
import { IconButton } from './IconButton'
import { Image } from './Image'
import { ListItem } from './Lists'
import { Tabs } from './NavGroups'
import { TransportMode } from './Plan'
import { FOCUS_RING_INSET } from './styles'
import { Link as IntlLink } from '@/i18n/navigation'

// Map and planning organisms (Figma Organisms): AI panel, Plan cart,
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

/** AI panel: greeting and suggestion chips when empty; chat bubbles in a log; AI input at the bottom. */
export function AiPanel({ viewport, title, greeting, suggestions, onSuggestion, messages, typing, input, labels, onMinimize, onClose, className }: AiPanelProps) {
  const id = useId()
  const desktop = viewport === 'desktop'
  return (
    <section
      role={desktop ? 'complementary' : 'dialog'}
      aria-labelledby={id}
      className={cn('flex flex-col bg-ui-bg-raised text-ui-fg', desktop ? 'h-[min(65vh,640px)] w-[380px] border border-ui-border' : 'h-full w-full', className)}
    >
      <div className={cn('flex items-center gap-[var(--space-2)] border-b border-ui-border', desktop ? 'py-[var(--space-1)] pl-[var(--space-4)] pr-[var(--space-1)]' : 'p-[var(--space-1)]')}>
        {desktop ? null : <IconButton label={labels.back} icon={<ArrowLeft />} onClick={onMinimize} />}
        <Sparkles aria-hidden className="size-[var(--icon-size-sm)] shrink-0" />
        <h2 id={id} className="flex-1 type-title-card">{title}</h2>
        {desktop ? (
          <>
            <IconButton label={labels.minimize} icon={<Minus />} onClick={onMinimize} />
            <IconButton label={labels.close} icon={<X />} onClick={onClose} />
          </>
        ) : null}
      </div>
      <div role="log" aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-[var(--space-3)] overflow-y-auto p-[var(--space-4)]">
        {messages.length === 0 ? (
          // Figma Empty: sparkles 32, greeting and chips centred in the log.
          <div className="flex flex-1 flex-col items-center justify-center gap-[var(--space-3)] text-center">
            <Sparkles aria-hidden className="size-[var(--icon-size-xl)] text-ui-fg-muted" />
            <p className="max-w-[300px] type-body-base text-ui-fg-muted">{greeting}</p>
            <div className="flex flex-wrap justify-center gap-[var(--space-2)]">
              {suggestions.map((s) => <Chip key={s} onClick={() => onSuggestion(s)}>{s}</Chip>)}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <ChatBubble key={i} role={m.role}>{m.text}</ChatBubble>)
        )}
        {typing ? <ChatBubble role="typing" typingLabel={labels.typing} /> : null}
      </div>
      <div className="border-t border-ui-border p-[var(--space-3)]">
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
  onDuration?: (id: string) => void
  /** The duration menu's items for a stop (a dropdown under its duration). */
  durationMenu?: (id: string) => ReactNode
  onRemove: (id: string) => void
  /** Tap a stop's name: select it (the map shows it). */
  onSelect?: (id: string) => void
  /** Reorder within a day: put stop `id` in the slot of `toId` (drag the grip, or arrow keys on it). */
  onMove?: (id: string, toId: string) => void
  onSave: () => void
  onDiscard: () => void
  labels: {
    region: string
    emptyTitle: string
    emptyBody: string
    all: string
    day: (n: number) => string
    addDay: string
    /** Spoken name when the visible label is short ("+ Day" reads as "Add day"). */
    addDayAria?: string
    /** Accessible name of the delete-day button, e.g. "Delete Day 2". */
    removeDay?: (n: number) => string
    /** Day tabs scroll arrows. */
    previousDays?: string
    nextDays?: string
    save: string
    discard: string
    remove: (name: string) => string
    reorder: (name: string) => string
    /** Read out after a stop moves, e.g. "Gwangjang Market moved to position 2 of 4." (stops in that day). */
    moved?: (name: string, position: number, total: number) => string
    open: string
    close: string
    about: string
  }
  className?: string
}

/** Plan cart: the plan as a shopping cart at the bottom of the Left panel. */
export function PlanCart({ state, onToggle, stops, days, activeDay, onDayChange, onAddDay, onRemoveDay, summary, lastAdded, lastAddedImage, lastAddedMeta, dayTotal, onDuration, durationMenu, onRemove, onSelect, onMove, onSave, onDiscard, labels, className }: PlanCartProps) {
  const id = useId()
  const [dragId, setDragId] = useState<string | null>(null)
  // Screen readers hear where a moved stop landed (keyboard move, or the end of a drag).
  const [announce, setAnnounce] = useState('')
  const say = (s: PlanStop, sameDay: PlanStop[], position: number) => labels.moved && setAnnounce(labels.moved(s.name, position, sameDay.length))
  // Grip handlers: arrow keys swap with the next stop of the same day; a pointer drag (mouse or
  // touch) moves the stop into the slot of the same-day row under the pointer as it passes.
  const handleProps = (s: PlanStop) =>
    onMove
      ? {
          onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
            e.preventDefault()
            const sameDay = stops.filter((x) => x.day === s.day)
            const next = sameDay[sameDay.indexOf(s) + (e.key === 'ArrowUp' ? -1 : 1)]
            if (!next) return
            onMove(s.id, next.id)
            say(s, sameDay, sameDay.indexOf(next) + 1)
          },
          onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            setDragId(s.id)
          },
          onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
            if (dragId !== s.id) return
            const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-stop-id]')?.getAttribute('data-stop-id')
            if (over && over !== s.id && stops.find((x) => x.id === over)?.day === s.day) onMove(s.id, over)
          },
          onPointerUp: () => {
            if (dragId === s.id) {
              const sameDay = stops.filter((x) => x.day === s.day)
              say(s, sameDay, sameDay.findIndex((x) => x.id === s.id) + 1)
            }
            setDragId(null)
          },
          onPointerCancel: () => setDragId(null),
        }
      : undefined
  if (state === 'empty') {
    return (
      <section aria-label={labels.region} className={cn('rounded-t-3xl bg-ui-bg-sunken p-[var(--space-4)]', className)}>
        <p className="type-title-card text-ui-fg">{labels.emptyTitle}</p>
        <p className="mt-[var(--space-3)] type-body-caption text-ui-fg-muted">{labels.emptyBody}</p>
      </section>
    )
  }
  const shown = activeDay === 'all' ? stops : stops.filter((s) => s.day === activeDay)
  return (
    <section aria-labelledby={id} className={cn('flex flex-col rounded-t-3xl text-ui-fg', state === 'open' ? 'h-full gap-[var(--space-3)] bg-ui-bg-sunken p-[var(--space-4)]' : 'bg-ui-bg-sunken', className)}>
      <p aria-live="polite" className="sr-only">{announce}</p>
      {/* Open: the Left panel's color/bg, everything inside the root's 16 padding; collapsed: the color/bg-sunken bar (Figma Plan cart). */}
      <button type="button" aria-expanded={state === 'open'} onClick={onToggle} className={cn('flex w-full flex-col gap-[var(--space-3)] text-left hover:bg-ui-state-hover', state === 'collapsed' && 'p-[var(--space-4)]', FOCUS_RING_INSET)}>
        <span className="flex w-full items-center gap-[var(--space-2)]">
          <span id={id} aria-live="polite" className="min-w-0 flex-1 type-title-card">{summary}</span>
          <span className="sr-only">{state === 'open' ? labels.close : labels.open}</span>
          <ChevronDown aria-hidden className={cn('size-[var(--icon-size-sm)] shrink-0 text-ui-fg-muted transition-transform', state === 'collapsed' && 'rotate-180')} />
        </span>
        {/* Figma Plan cart Collapsed › Last added: photo, place, "Last added · 2 more". */}
        {state === 'collapsed' && lastAdded ? (
          <span className="flex min-w-0 items-center gap-[var(--space-3)]">
            {lastAddedImage !== undefined ? <Image ratio="1:1" src={lastAddedImage} alt="" sizes="80px" className="w-[var(--space-12)] shrink-0" /> : null}
            <span className="flex min-w-0 flex-col gap-[var(--space-0-5)]">
              <span className="truncate type-body-base text-ui-fg">{lastAdded}</span>
              {lastAddedMeta ? <span className="truncate type-body-caption text-ui-fg-muted">{lastAddedMeta}</span> : null}
            </span>
          </span>
        ) : null}
      </button>
      {state === 'open' ? (
        <>
          {/* "+ Day" follows the last day tab with no gap, as drawn. */}
          <div className="flex items-center">
            <Tabs
              label={labels.region}
              baseline={false}
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
              className="min-w-0"
            />
            {/* Figma "+ Day": a Tab-styled text button (44 high, px 16, body/base, fg-muted). */}
            {onAddDay && days < 8 ? (
              <button type="button" onClick={onAddDay} aria-label={labels.addDayAria} className={cn('inline-flex min-h-[var(--target-touch-min)] shrink-0 items-center whitespace-nowrap px-[var(--space-4)] type-body-base text-ui-fg-muted hover:bg-ui-state-hover hover:text-ui-fg', FOCUS_RING_INSET)}>
                {labels.addDay}
              </button>
            ) : null}
          </div>
          <ol className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {/* No stops yet: the hint under the tabs, Save off and no Discard (nothing to discard). */}
            {/* In All days the hint sits under the Day 1 label, as drawn. */}
            {stops.length ? null : (
              <li className="list-none">
                {activeDay === 'all' ? <p className="type-eyebrow-category uppercase text-ui-fg-muted">{labels.day(1)}</p> : null}
                <p className="type-body-base text-ui-fg-muted">{labels.emptyBody}</p>
              </li>
            )}
            {shown.map((s, i) => (
              <li key={s.id} className="list-none">
                {/* All days: each day's stops under its label, numbered from 1 in that day (Figma Day label). */}
                {activeDay === 'all' && shown[i - 1]?.day !== s.day ? <p className="type-eyebrow-category uppercase text-ui-fg-muted">{labels.day(s.day)}</p> : null}
                <ul>
                  <PlanStopRow name={s.name} thumbnail={s.imageSrc} number={stops.filter((x) => x.day === s.day).indexOf(s) + 1} day={s.day} duration={s.duration} durationLabel={s.durationLabel} onDuration={onDuration ? () => onDuration(s.id) : undefined} durationMenu={durationMenu?.(s.id)} onRemove={() => onRemove(s.id)} removeLabel={labels.remove(s.name)} reorderLabel={labels.reorder(s.name)} stopId={s.id} handleProps={handleProps(s)} dragging={dragId === s.id} onSelect={onSelect ? () => onSelect(s.id) : undefined} />
                </ul>
                {s.leg && i < shown.length - 1 ? <div className="ml-[calc(var(--space-12)+var(--space-2))]"><TransportMode mode="estimate" modeLabel={labels.about} time={s.leg} /></div> : null}
              </li>
            ))}
          </ol>
          {dayTotal ? (
            <p className="flex items-center gap-[var(--space-1)] type-body-caption text-ui-fg-muted">
              <Clock aria-hidden className="size-[var(--icon-size-xs)] shrink-0" />
              {dayTotal}
            </p>
          ) : null}
          <div className="flex flex-col gap-[var(--space-3)]">
            <Button size="md" onClick={onSave} disabled={!stops.length} className="w-full">{labels.save}</Button>
            {stops.length ? <Button variant="ghost" size="md" onClick={onDiscard} className="w-full">{labels.discard}</Button> : null}
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
  /** Top inset kept clear for the Universal search (shell without a top nav). */
  topClear?: boolean
  className?: string
}

/** Left panel: desktop panel next to the rail; complementary landmark. */
export function LeftPanel({ type, label, children, cart, cartOpen, topClear, className }: LeftPanelProps) {
  return (
    <aside aria-label={label} className={cn('relative flex h-full shrink-0 flex-col bg-ui-bg', type === 'index' ? 'w-[var(--layout-left-panel-index)]' : 'w-[var(--layout-left-panel)]', topClear && 'pt-[calc(var(--space-3)+var(--control-height-xl)+var(--space-3))]', className)}>
      <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto', cartOpen && 'invisible')}>{children}</div>
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

/** Saved hub: saved places inside the map, for adding them to a plan. */
export function SavedHub({ view, folders = [], folder, onOpenFolder, onBack, onAdd, emptyAction, labels }: SavedHubProps) {
  // Figma Saved hub root: color/bg-raised, padding 16, gap 16 in every view.
  const root = 'flex flex-col gap-[var(--space-4)] bg-ui-bg-raised p-[var(--space-4)] text-ui-fg'
  if (view === 'empty') {
    return (
      <div className={root}>
        <EmptyState container="bordered" icon={<Bookmark />} title={labels.emptyTitle} action={emptyAction}>{labels.emptyBody}</EmptyState>
      </div>
    )
  }
  if (view === 'places') {
    return (
      <div className={root}>
        <ul>
          {folders.map((f) => (
            <ListItem key={f.id} title={f.name} secondary={f.count} leading={<Folder />} chevron onClick={() => onOpenFolder(f.id)} />
          ))}
        </ul>
      </div>
    )
  }
  return (
    <div className={root}>
      {/* Figma Folder › Back: Ghost icon button 40 + title/card, gap 4, hugging. */}
      <div className="flex items-center gap-[var(--space-1)]">
        <IconButton label={labels.back} icon={<ArrowLeft />} onClick={onBack} />
        <p className="type-title-card">{folder?.name}</p>
      </div>
      <ul>
        {folder?.places.map((p) => (
          <ListItem
            key={p.id}
            title={p.name}
            secondary={p.meta}
            leading={<Image ratio="1:1" src={p.imageSrc} alt="" sizes="80px" className="w-[48px]" />}
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
  /** Figma Owner row › Avatar xs before the name: the owner's photo (null shows initials from `owner`); left out, no avatar. */
  ownerAvatarSrc?: string | null
  /** The owner's name for the avatar initials (owner is the whole line, e.g. "Created by Minji"). */
  ownerName?: string
  /** The owner's profile: the owner line links there. */
  ownerHref?: string
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
  /** Owner: the mode menu's items for the leg after stop `id`, and its accessible name. */
  legMenu?: (id: string) => ReactNode
  legMenuLabel?: (id: string) => string
  related?: ReactNode
  /** Footer buttons: Owner = Edit plan, Share, Delete; Visitor = Save, Like, Share. */
  footer: ReactNode
  labels: { all: string; day: (n: number) => string; days: string; related: string }
}

/** Itinerary panel: title is the page h1; day tabs; stops as an ordered list. */
export function ItineraryPanel({ title, owner, ownerAvatarSrc, ownerName, ownerHref, privateLabel, stats, days, activeDay, onDayChange, stops, selectedStop, onSelectStop, onLeg, legMenu, legMenuLabel, related, footer, labels }: ItineraryPanelProps) {
  const shown = activeDay === 'all' ? stops : stops.filter((s) => s.day === activeDay)
  return (
    <div className="flex h-full flex-col gap-[var(--space-4)] bg-ui-bg-raised p-[var(--space-4)] text-ui-fg">
      <div className="flex flex-col gap-[var(--space-2)]">
        <h1 className="type-display-h3">{title}</h1>
        <p className="flex items-center gap-[var(--space-2)] type-body-caption text-ui-fg-muted">
          {ownerAvatarSrc !== undefined ? <Avatar size="xs" src={ownerAvatarSrc} name={ownerName ?? owner} decorative /> : null}
          {ownerHref ? <IntlLink href={ownerHref} className="hover:text-ui-fg hover:underline focus-visible:shadow-focus-ring focus-visible:outline-none">{owner}</IntlLink> : owner}
          {privateLabel ? <span className="inline-flex items-center gap-[var(--space-2)]"><Lock aria-hidden className="size-[var(--icon-size-xs)]" />{privateLabel}</span> : null}
        </p>
      </div>
      {/* Figma Itinerary panel: Header, Stats, Day filter, Timeline and Related plans 16 apart. */}
      <p className="bg-ui-bg-sunken p-[var(--space-3)] type-body-caption text-ui-fg">{stats.join(' · ')}</p>
      <Tabs baseline={false} label={labels.days} value={String(activeDay)} onValueChange={(v) => onDayChange(v === 'all' ? 'all' : (Number(v) as Day))} tabs={[{ id: 'all', label: labels.all }, ...Array.from({ length: days }, (_, i) => ({ id: String(i + 1), label: labels.day(i + 1), day: (i + 1) as Day }))]} />
      <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-y-auto">
        <ol>
          {shown.map((s, i) => (
            <li key={s.id} className="list-none">
              {/* Figma Timeline: an eyebrow/category day heading ("DAY 1") where a day starts. */}
              {i === 0 || shown[i - 1].day !== s.day ? <p className="type-eyebrow-category text-ui-fg-muted">{labels.day(s.day)}</p> : null}
              <ul>
                <ItineraryStop name={s.name} number={stops.indexOf(s) + 1} day={s.day} meta={s.meta} note={s.note} thumbnail={s.imageSrc} selected={selectedStop === s.id} onSelect={onSelectStop ? () => onSelectStop(s.id) : undefined} />
              </ul>
              {s.leg && i < shown.length - 1 ? (
                <div className="pl-[var(--space-5)]"><TransportMode mode={s.leg.mode} modeLabel={s.leg.label} time={s.leg.time} onChange={onLeg ? () => onLeg(s.id) : undefined} menu={legMenu?.(s.id)} menuLabel={legMenuLabel?.(s.id)} /></div>
              ) : null}
            </li>
          ))}
        </ol>
        {related ? (
          <section className="flex flex-col gap-[var(--space-2)]">
            <h2 className="type-title-card">{labels.related}</h2>
            {related}
          </section>
        ) : null}
      </div>
      <div className="flex gap-[var(--space-2)] border-t border-ui-border pt-[var(--space-4)]">{footer}</div>
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
  /** Photo credit (Credit line); none yet, so the line stays hidden. */
  credit?: string
  description?: string
  /** Figma Show sponsored (off at launch). */
  sponsored?: string
  details: { icon: 'hours' | 'address' | 'website'; title: string; href?: string }[]
  saved: boolean
  liked: boolean
  onAdd: () => void
  onSave: () => void
  onLike: () => void
  onShare: () => void
  /** noPhoto: the muted line a place without a photo shows under its meta (no photo area). */
  labels: { add: string; save: string; like: string; share: string; noPhoto?: string }
}

/** Place detail: photo, name (display/h2), meta, actions (Add to plan, Save, Like, Share), details. */
export function PlaceDetail({ viewport, name, meta, imageSrc, imageAlt, credit, description, sponsored, details, saved, liked, onAdd, onSave, onLike, onShare, labels }: PlaceDetailProps) {
  const ICON = { hours: Clock, address: MapPin, website: Globe } as const
  return (
    <section aria-label={name} className="flex flex-col gap-[var(--space-4)] py-[var(--space-4)] text-ui-fg">
      {imageSrc ? <Image ratio={viewport === 'desktop' ? '4:3' : '16:9'} src={imageSrc} alt={imageAlt ?? ''} sizes="420px" /> : null}
      {/* Shown only once a photo has its credit text (photo rights check). */}
      {imageSrc && credit ? <CreditLine className="px-[var(--space-4)]">{credit}</CreditLine> : null}
      <div className="flex flex-col gap-[var(--space-2)] px-[var(--space-4)]">
        {sponsored ? <Badge variant="normal" className="self-start">{sponsored}</Badge> : null}
        <h2 className="type-display-h2">{name}</h2>
        <p className="type-body-base text-ui-fg-muted">{meta}</p>
        {!imageSrc && labels.noPhoto ? <p className="type-body-caption text-ui-fg-muted">{labels.noPhoto}</p> : null}
      </div>
      <div className="flex items-center gap-[var(--space-2)] px-[var(--space-4)]">
        <Button size="md" onClick={onAdd} className="flex-1">{labels.add}</Button>
        <IconButton variant="secondary" label={labels.save} aria-pressed={saved} icon={<Bookmark className={saved ? 'fill-current' : undefined} />} onClick={onSave} />
        <IconButton variant="secondary" label={labels.like} aria-pressed={liked} icon={<Heart className={liked ? 'fill-current' : undefined} />} onClick={onLike} />
        <IconButton variant="secondary" label={labels.share} icon={<Share2 />} onClick={onShare} />
      </div>
      {description ? <p className="px-[var(--space-4)] type-body-base text-ui-fg">{description}</p> : null}
      <ul>
        {details.map((d) => {
          const Icon = ICON[d.icon]
          return d.href ? (
            <ListItem key={d.title} title={d.title} leading={<Icon />} divider={false} onClick={() => window.open(d.href, '_blank', 'noopener')} />
          ) : (
            <ListItem key={d.title} title={d.title} leading={<Icon />} divider={false} />
          )
        })}
      </ul>
    </section>
  )
}
