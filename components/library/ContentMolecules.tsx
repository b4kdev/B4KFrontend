'use client'

import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowRight, Bookmark, ChevronDown, ChevronLeft, ChevronRight, Clock, Heart, Lock, Send, X } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { ImageAction } from './Content'
import { DragHandle, StopBadge, type DragHandleProps } from './Plan'
import { IconButton } from './IconButton'
import { DropdownMenu } from './Overlay'
import { Image } from './Image'
import { Spinner } from './Spinner'

// Content and planning molecules (Figma Molecules): Section header, Save-like
// overlay, Achievement badge, AI input, Plan stop row, Itinerary stop.

export type SectionHeaderProps = {
  /** Figma Title: the h2 of the section (display/h3). */
  title: string
  subtitle?: string
  /** Figma Show see all: link target and label ("See all"); the name adds the title for screen readers. */
  seeAll?: { href: string; label: string }
  /** Figma Show arrows (desktop rails only). */
  arrows?: { onPrevious: () => void; onNext: () => void; previousLabel: string; nextLabel: string; atStart?: boolean; atEnd?: boolean }
  id?: string
  className?: string
}

export function SectionHeader({ title, subtitle, seeAll, arrows, id, className }: SectionHeaderProps) {
  // Figma's phone header runs to the screen edge with 16 padding inside; here the page gutter gives the 16.
  return (
    <div className={cn('flex items-end gap-[var(--space-2)] max-md:min-h-[var(--control-height-md)]', className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
        <h2 id={id} className="type-display-h3 text-ui-fg">{title}</h2>
        {subtitle ? <p className="type-body-base text-ui-fg-muted">{subtitle}</p> : null}
      </div>
      {seeAll ? (
        <IntlLink
          href={seeAll.href}
          className="relative inline-flex items-center gap-[var(--space-1-5)] type-label-button text-ui-link hover:text-ui-link-hover focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-ui-border-focus before:absolute before:inset-x-0 before:top-1/2 before:h-[var(--target-touch-min)] before:-translate-y-1/2 before:content-['']"
        >
          {seeAll.label}
          <span className="sr-only">: {title}</span>
          <ArrowRight aria-hidden className="size-[var(--icon-size-sm)]" />
        </IntlLink>
      ) : null}
      {arrows ? (
        <div className="flex gap-[var(--space-2)] max-lg:hidden">
          <IconButton variant="secondary" label={arrows.previousLabel} icon={<ChevronLeft />} disabled={arrows.atStart} onClick={arrows.onPrevious} />
          <IconButton variant="secondary" label={arrows.nextLabel} icon={<ChevronRight />} disabled={arrows.atEnd} onClick={arrows.onNext} />
        </div>
      ) : null}
    </div>
  )
}

export type SaveLikeOverlayProps = {
  saved: boolean
  onSave: () => void
  saveLabel: string
  /** Figma Show like. */
  like?: { liked: boolean; onLike: () => void; label: string }
  className?: string
}

/** Save-like overlay: top right of a Card photo, 8 from the edges; monochrome, filled when on. */
export function SaveLikeOverlay({ saved, onSave, saveLabel, like, className }: SaveLikeOverlayProps) {
  return (
    <div className={cn('absolute right-[var(--space-2)] top-[var(--space-2)] flex gap-[var(--space-1)]', className)}>
      <ImageAction on={saved} icon={<Bookmark />} label={saveLabel} onClick={onSave} />
      {like ? <ImageAction on={like.liked} icon={<Heart />} label={like.label} onClick={like.onLike} /> : null}
    </div>
  )
}

const MEDAL = {
  common: 'bg-ui-bg-sunken text-ui-fg',
  rare: 'bg-ui-bg-raised border border-ui-border text-ui-fg',
  epic: 'bg-ui-bg-inverse text-ui-fg-inverse',
  legendary: 'bg-ui-bg-inverse text-ui-fg-inverse',
} as const

export type AchievementBadgeProps = {
  name: string
  /** How to earn it, or the earned date; include the rarity name in words. */
  detail: string
  icon: ReactNode
  rarity?: keyof typeof MEDAL
  locked?: boolean
  /** Added to the name for screen readers when locked, e.g. "locked". */
  lockedLabel?: string
  className?: string
}

/** Achievement badge: rarity by fill, no color; Legendary adds an outer ring; Locked = sunken with a lock. */
export function AchievementBadge({ name, detail, icon, rarity = 'common', locked, lockedLabel, className }: AchievementBadgeProps) {
  return (
    <div className={cn('flex w-[96px] flex-col items-center gap-[var(--space-2)] text-center', className)}>
      <span aria-hidden className={cn('inline-flex rounded-full border', rarity === 'legendary' && !locked ? 'border-ui-fg p-[var(--space-1)]' : 'border-transparent p-[calc(var(--space-1)-1px)]')}>
        <span className={cn('inline-flex size-[var(--achievement-size)] items-center justify-center rounded-full [&>svg]:size-[var(--icon-size-xl)]', locked ? MEDAL.common : MEDAL[rarity], locked && 'border border-ui-border-subtle text-ui-fg-disabled')}>
          {locked ? <Lock /> : icon}
        </span>
      </span>
      <span className={cn('line-clamp-2 w-full type-body-label', locked ? 'text-ui-fg-muted' : 'text-ui-fg')}>
        {name}
        {locked && lockedLabel ? <span className="sr-only">, {lockedLabel}</span> : null}
      </span>
      <span className="line-clamp-2 w-full type-body-caption text-ui-fg-muted">{detail}</span>
    </div>
  )
}

export type AiInputProps = {
  value: string
  onValueChange: (v: string) => void
  onSend: () => void
  /** The placeholder is the label (also aria-label). */
  placeholder: string
  sendLabel: string
  loading?: boolean
  loadingLabel?: string
  disabled?: boolean
  className?: string
}

/** AI input: pill field bg-sunken 40 high, Ghost Send; Enter sends, Shift Enter adds a line. */
export function AiInput({ value, onValueChange, onSend, placeholder, sendLabel, loading, loadingLabel, disabled, className }: AiInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [value])
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (value.trim() && !loading) onSend()
    }
  }
  return (
    <div className={cn('flex items-center gap-[var(--space-2)]', className)}>
      <div className="flex min-h-[var(--control-height-md)] flex-1 items-center rounded-full bg-ui-bg-sunken px-[var(--input-padding-x)] focus-within:shadow-[inset_0_0_0_var(--border-width-2)_var(--color-border-focus)]">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          aria-label={placeholder}
          placeholder={placeholder}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={onKey}
          className="w-full resize-none bg-transparent py-[var(--space-2)] type-body-base text-ui-fg outline-none placeholder:text-ui-fg-placeholder disabled:cursor-not-allowed disabled:text-ui-fg-disabled disabled:placeholder:text-ui-fg-disabled"
        />
      </div>
      {loading ? (
        <span className="inline-flex size-[var(--control-height-md)] items-center justify-center"><Spinner size="sm" label={loadingLabel} /></span>
      ) : (
        <IconButton label={sendLabel} icon={<Send />} onClick={onSend} disabled={disabled || !value.trim()} />
      )}
    </div>
  )
}

export type PlanStopRowProps = {
  name: string
  number: number
  day: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  /** Time at the place, e.g. "1h". The button opens the duration menu. */
  duration: string
  durationLabel: string
  onDuration?: () => void
  /** Figma Duration menu: the Menu items, shown in a dropdown under the button. */
  durationMenu?: ReactNode
  onRemove: () => void
  removeLabel: string
  reorderLabel: string
  /** Figma State=Dragging. */
  dragging?: boolean
  /** Tap the name: select the stop. */
  onSelect?: () => void
  /** Marks the row for drag hit-testing (data-stop-id). */
  stopId?: string
  /** Pointer and key handlers for the grip (drag to reorder, arrow keys move). */
  handleProps?: Omit<DragHandleProps, 'label' | 'type'>
  /** Photo of the place (40, as the Itinerary stop); omitted: no thumbnail. */
  thumbnail?: string | null
  className?: string
}

/** Plan stop row: grip, Stop badge sm, optional thumbnail, name, Duration button, Remove. */
export function PlanStopRow({ name, number, day, duration, durationLabel, onDuration, durationMenu, onRemove, removeLabel, reorderLabel, dragging, stopId, handleProps, onSelect, thumbnail, className }: PlanStopRowProps) {
  const durationButton = (
    <button
      type="button"
      aria-label={durationLabel}
      aria-haspopup="menu"
      onClick={onDuration}
      className="relative inline-flex h-[var(--control-height-sm)] items-center gap-[var(--space-1)] type-body-label text-ui-fg hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none"
    >
      <Clock aria-hidden className="size-[var(--icon-size-xs)] text-ui-fg-muted" />
      {duration}
      <ChevronDown aria-hidden className="size-[var(--icon-size-xs)] text-ui-fg-muted" />
    </button>
  )
  return (
    <li data-stop-id={stopId} className={cn('group flex h-[var(--control-height-md)] items-center gap-[var(--space-2)]', dragging && 'bg-ui-state-dragged', className)}>
      <DragHandle label={reorderLabel} {...handleProps} className="touch-none" />
      <StopBadge number={number} day={day} />
      {thumbnail !== undefined ? <Image ratio="1:1" src={thumbnail} alt="" sizes="80px" className="w-[var(--control-height-md)] shrink-0" /> : null}
      {onSelect ? (
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 truncate text-left type-body-base text-ui-fg hover:underline focus-visible:shadow-focus-ring focus-visible:outline-none">{name}</button>
      ) : (
        <span className="min-w-0 flex-1 truncate type-body-base text-ui-fg">{name}</span>
      )}
      {durationMenu ? (
        // Figma: the menu ends where the Remove button starts (8 right of the duration button).
        <DropdownMenu fixed align="end" label={durationLabel} trigger={durationButton} rootClassName="-mr-[var(--space-2)] pr-[var(--space-2)]">
          {durationMenu}
        </DropdownMenu>
      ) : (
        durationButton
      )}
      <IconButton label={removeLabel} icon={<X />} onClick={onRemove} />
    </li>
  )
}

export type ItineraryStopProps = {
  name: string
  number: number
  day?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  /** Figma Meta: duration and start time, e.g. "1h · 09:00". */
  meta: string
  note?: string
  thumbnail?: string | null
  /** Figma State=Selected: the stop whose pin is selected on the map. */
  selected?: boolean
  onSelect?: () => void
  className?: string
}

/** Itinerary stop: Stop badge md on the route rail, name, meta, optional note and 40 thumbnail. */
// Figma: the row is 80 high with 8 above; a name, meta and one-line note (66) leave 6 below.
export function ItineraryStop({ name, number, day, meta, note, thumbnail, selected, onSelect, className }: ItineraryStopProps) {
  return (
    <li aria-current={selected || undefined} className={cn('flex min-h-[var(--space-20)] items-start gap-[var(--space-3)] px-[var(--space-2)] pb-[var(--space-1-5)] pt-[var(--space-2)]', selected && 'bg-ui-state-selected', onSelect && 'cursor-pointer hover:bg-ui-state-hover', className)} onClick={onSelect}>
      <StopBadge number={number} day={day} size="md" />
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
        <span className="type-title-card text-ui-fg">{name}</span>
        <span className="type-body-caption text-ui-fg-muted">{meta}</span>
        {note ? <span className="type-body-caption text-ui-fg">{note}</span> : null}
      </div>
      {thumbnail !== undefined ? <Image ratio="1:1" src={thumbnail} alt="" sizes="80px" className="w-[var(--control-height-md)] shrink-0" /> : null}
    </li>
  )
}
