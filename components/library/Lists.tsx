'use client'

import { createContext, useContext, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'
import { CountBadge } from './Badge'
import { Glyph, type GlyphName } from './Glyph'
import { FOCUS_RING_INSET } from './styles'

// List molecules (Figma Molecules): List item, Accordion item, Tree item,
// Leaderboard row, Notification item.

export type ListItemProps = {
  /** Figma Title and Secondary (Show secondary). */
  title: ReactNode
  secondary?: ReactNode
  /** Figma Leading slot: an icon, Avatar or 48 Image thumbnail. */
  leading?: ReactNode
  /** Figma Trailing slot: chevron, Toggle, value text, Ghost icon button, Checkbox or Segmented control. */
  trailing?: ReactNode
  /** Built-in chevron (Trailing=chevron) for rows that open a page. */
  chevron?: boolean
  /** Figma Show divider. */
  divider?: boolean
  /** The whole row is the link or button: pass an element (next-intl Link, button) as `as`. */
  onClick?: () => void
  href?: string
  renderLink?: (props: { href: string; className: string; children: ReactNode }) => ReactNode
  disabled?: boolean
  className?: string
}

// Figma draws the 1px divider inside the row (absolute at the bottom), so it adds no height.
export const ROW_DIVIDER = "relative after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-ui-border after:content-['']"

const ROW = 'flex min-h-[var(--target-touch-min)] w-full items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] text-left'

/** List item: one row with slots, 44 high minimum, 1px divider, hover layer, inset focus ring. */
export function ListItem({ title, secondary, leading, trailing, chevron, divider = true, onClick, href, renderLink, disabled, className }: ListItemProps) {
  const body = (
    <>
      {leading ? <span className={cn('inline-flex shrink-0 items-center [&>svg]:size-[var(--icon-size-md)]', disabled ? 'text-ui-fg-disabled' : 'text-ui-fg-muted')}>{leading}</span> : null}
      <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-0-5)]">
        <span className={cn('truncate type-body-base', disabled ? 'text-ui-fg-disabled' : 'text-ui-fg')}>{title}</span>
        {secondary ? <span className={cn('truncate type-body-caption', disabled ? 'text-ui-fg-disabled' : 'text-ui-fg-muted')}>{secondary}</span> : null}
      </span>
      {trailing ? <span className="inline-flex shrink-0 items-center type-body-base text-ui-fg-muted">{trailing}</span> : null}
      {chevron ? <ChevronRight aria-hidden className={cn('size-[var(--icon-size-sm)] shrink-0', disabled ? 'text-ui-fg-disabled' : 'text-ui-fg-muted')} /> : null}
    </>
  )
  const interactive = cn(ROW, 'hover:bg-ui-state-hover disabled:cursor-not-allowed', FOCUS_RING_INSET)
  return (
    <li className={cn(divider && ROW_DIVIDER, className)}>
      {href && renderLink ? (
        renderLink({ href, className: interactive, children: body })
      ) : onClick ? (
        <button type="button" onClick={onClick} disabled={disabled} className={interactive}>{body}</button>
      ) : (
        <div className={ROW}>{body}</div>
      )}
    </li>
  )
}

export type AccordionItemProps = {
  title: ReactNode
  children: ReactNode
  defaultExpanded?: boolean
  /** Heading level of the title row. */
  headingLevel?: 2 | 3 | 4
}

/** Accordion item (part of Accordion): button in a heading, region below, 1px divider. */
export function AccordionItem({ title, children, defaultExpanded = false, headingLevel = 3 }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultExpanded)
  const id = useId()
  const H = `h${headingLevel}` as 'h3'
  return (
    <div className={ROW_DIVIDER}>
      <H className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-btn`}
          onClick={() => setOpen((o) => !o)}
          className={cn('flex min-h-[var(--target-touch-min)] w-full items-center gap-[var(--space-3)] p-[var(--space-4)] text-left type-title-card text-ui-fg hover:bg-ui-state-hover', FOCUS_RING_INSET)}
        >
          <span className="flex-1">{title}</span>
          <ChevronDown aria-hidden className={cn('size-[var(--icon-size-sm)] shrink-0 text-ui-fg-muted transition-transform duration-short4 ease-standard motion-reduce:transition-none', open && 'rotate-180')} />
        </button>
      </H>
      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`} hidden={!open} className="px-[var(--space-4)] pb-[var(--space-4)] type-body-base text-ui-fg-muted">
        {children}
      </div>
    </div>
  )
}

export type TreeItemProps = {
  label: ReactNode
  /** Figma Kind. */
  kind: 'collapsed' | 'expanded' | 'leaf'
  level?: number
  selected?: boolean
  /** Figma Show count. */
  count?: number
  /** Figma Show checkbox: a Checkbox element (checklist tree). */
  checkbox?: ReactNode
  /** Level 1 of a category index: the category colour (a CSS colour) and glyph. The row leads with a
   * glyph tile; opened, the whole row and its children become the colour field with black ink. */
  color?: string
  glyph?: GlyphName
  onToggle?: () => void
  onSelect?: () => void
  children?: ReactNode
}

/** The colour of the open category a row sits in (null outside one). */
const TreeField = createContext<string | null>(null)

/** Tree item (part of Tree view): chevron turns when expanded; leaf keeps the space. */
export function TreeItem({ label, kind, level = 1, selected, count, checkbox, color, glyph, onToggle, onSelect, children }: TreeItemProps) {
  const field = useContext(TreeField)
  const open = kind === 'expanded'
  if (color && glyph) {
    // Category row: a sunken squircle; open = the colour field, the glyph tile turns black.
    return (
      <li
        role="treeitem"
        aria-expanded={kind === 'leaf' ? undefined : open}
        aria-selected={selected}
        aria-level={level}
        style={{ '--tree-c': color } as CSSProperties}
        className={cn(
          'overflow-hidden rounded-sq-lg transition-colors duration-short4 ease-out-strong',
          open ? 'bg-[var(--tree-c)] pb-[var(--space-1-5)] text-field-fg' : 'bg-tile-surface-sunken text-ui-fg [@media(hover:hover)_and_(pointer:fine)]:hover:bg-control-fill',
        )}
      >
        {/* Focus ring: black ink on the open colour field (white would fall under 3:1 on pastels). */}
        <div className={cn('flex min-h-[var(--target-touch-min)] items-center gap-[var(--space-2)] rounded-sq-lg px-[var(--space-2)] py-[var(--space-1-5)]', open ? '[&:has(>button:first-child:focus-visible)]:shadow-[inset_0_0_0_var(--focus-ring-width)_var(--field-fg)]' : '[&:has(>button:first-child:focus-visible)]:shadow-[inset_0_0_0_var(--focus-ring-width)_var(--color-border-focus)]')}>
          <button type="button" onClick={onSelect ?? onToggle} className="b4k-press flex min-w-0 flex-1 items-center gap-[var(--space-3)] text-left text-[length:var(--font-size-base)] font-[var(--font-weight-bold)] focus-visible:outline-none">
            <span aria-hidden className={cn('inline-flex size-[var(--glyph-tile-size)] shrink-0 items-center justify-center rounded-sq-sm', open ? 'bg-field-fg text-[var(--tree-c)]' : 'bg-[var(--tree-c)] text-field-fg')}>
              <Glyph name={glyph} size={20} />
            </span>
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {count !== undefined ? <span className="type-body-caption tabular-nums opacity-70">{count}</span> : null}
          </button>
          {kind === 'leaf' ? null : (
            <button type="button" tabIndex={-1} aria-hidden onClick={onToggle} className={cn('inline-flex shrink-0', open ? 'text-field-fg' : 'text-ui-fg-placeholder')}>
              <ChevronRight className={cn('size-[var(--icon-size-sm)] transition-transform duration-short4 ease-out-strong', open && 'rotate-90')} />
            </button>
          )}
        </div>
        {open && children ? (
          <TreeField.Provider value={color}>
            <ul role="group">{children}</ul>
          </TreeField.Provider>
        ) : null}
      </li>
    )
  }
  return (
    <li role="treeitem" aria-expanded={kind === 'leaf' ? undefined : kind === 'expanded'} aria-selected={selected} aria-level={level}>
      {/* Indent (16 per level) sits outside the row, so the selected fill starts at it. */}
      <div style={field ? undefined : { paddingLeft: `calc(var(--space-4) * ${level - 1})` }}>
        <div
          className={cn(
            'flex min-h-[var(--target-touch-min)] items-center gap-[var(--space-2)] pl-[var(--space-2)] pr-[var(--space-3)]',
            field
              ? cn('mx-[var(--space-1-5)] rounded-sq-md px-[var(--space-1-5)] transition-colors duration-short3 ease-out-strong', selected ? 'bg-field-fg text-photo-action-fg' : 'text-field-fg [@media(hover:hover)_and_(pointer:fine)]:hover:bg-field-inset')
              : selected ? 'rounded-sq-md bg-ui-state-selected' : 'rounded-sq-md hover:bg-ui-state-hover',
            // Focus ring around the whole row while the label button has keyboard focus; inside a colour
            // field it is black ink, on the selected black row white.
            !field
              ? '[&:has(>button:last-child:focus-visible)]:shadow-[inset_0_0_0_var(--focus-ring-width)_var(--color-border-focus)]'
              : selected
                ? '[&:has(>button:last-child:focus-visible)]:shadow-[inset_0_0_0_var(--focus-ring-width)_var(--color-fg-on-media)]'
                : '[&:has(>button:last-child:focus-visible)]:shadow-[inset_0_0_0_var(--focus-ring-width)_var(--field-fg)]',
          )}
        >
          {field ? (
            <span aria-hidden className="size-[10px] shrink-0 rounded-[3px]" style={{ backgroundColor: selected ? field : 'var(--neutral-black-28)' }} />
          ) : kind === 'leaf' ? (
            <span aria-hidden className="size-[var(--icon-size-sm)] shrink-0" />
          ) : (
            <button type="button" tabIndex={-1} aria-hidden onClick={onToggle} className="inline-flex shrink-0 text-ui-fg-muted">
              <ChevronRight className={cn('size-[var(--icon-size-sm)] transition-transform duration-short4 ease-standard', kind === 'expanded' && 'rotate-90')} />
            </button>
          )}
          {checkbox}
          <button type="button" onClick={onSelect ?? onToggle} className={cn('flex min-h-[var(--target-touch-min)] min-w-0 flex-1 items-center gap-[var(--space-2)] text-left type-body-base focus-visible:outline-none', field ? 'text-[length:calc(var(--font-size-base)-var(--border-width-1))] font-[500] text-current' : 'text-ui-fg')}>
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {count !== undefined ? <span className={cn('type-body-caption', field ? 'opacity-70' : 'text-ui-fg-muted')}>{count}</span> : null}
          </button>
        </div>
      </div>
      {kind === 'expanded' && children ? <ul role="group">{children}</ul> : null}
    </li>
  )
}

export type LeaderboardRowProps = {
  rank: number
  name: string
  /** Figma Detail, e.g. "12 plans · 4 badges". */
  detail?: string
  /** Figma Score, formatted; left out on Popular planners (no score there). */
  score?: string
  avatarSrc?: string | null
  /** Figma Show trend: up / down with labels; left out when flat. */
  trend?: { direction: 'up' | 'down'; label: string }
  /** Figma Viewer=you: the person's own row, title "You" from the messages. */
  you?: string
  /** Accessible name of the rank, e.g. "Rank 1". */
  rankLabel: string
  href?: string
  renderLink?: (props: { href: string; className: string; children: ReactNode }) => ReactNode
}

/** Leaderboard row: rank as a plain muted number (no trophies), avatar, name and detail,
 * optional trend and score; 1px divider inside the row like List item. */
export function LeaderboardRow({ rank, name, detail, score, avatarSrc, trend, you, rankLabel, href, renderLink }: LeaderboardRowProps) {
  const TrendIcon = trend?.direction === 'down' ? TrendingDown : TrendingUp
  const body = (
    <>
      <span className="inline-flex w-[var(--space-6)] shrink-0 justify-center text-ui-fg">
        <span aria-label={rankLabel} className="type-body-base text-ui-fg-muted">{rank}</span>
      </span>
      <Avatar size="md" src={avatarSrc} name={name} decorative />
      <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-0-5)]">
        <span className="truncate type-body-base text-ui-fg">{you ?? name}</span>
        {detail ? <span className="truncate type-body-caption text-ui-fg-muted">{detail}</span> : null}
      </span>
      {trend ? <TrendIcon role="img" aria-label={trend.label} className="size-[var(--icon-size-lg)] shrink-0 text-ui-fg-muted" /> : null}
      {score ? <span className="shrink-0 type-body-base tabular-nums text-ui-fg">{score}</span> : null}
    </>
  )
  // 64 high: Avatar md 40 + py 12.
  const cls = cn(ROW, href && 'hover:bg-ui-state-hover', href && FOCUS_RING_INSET)
  return (
    <li className={cn(ROW_DIVIDER, you && 'bg-ui-bg-raised')}>
      {href && renderLink ? renderLink({ href, className: cls, children: body }) : <div className={cls}>{body}</div>}
    </li>
  )
}

export type NotificationItemProps = {
  icon: ReactNode
  title: ReactNode
  body?: ReactNode
  time: string
  read?: boolean
  /** "Unread" from the messages, added to the accessible name. */
  unreadLabel: string
  href: string
  renderLink: (props: { href: string; className: string; children: ReactNode }) => ReactNode
}

/** Notification item: icon by type, title, body, time; unread = Count badge dot. */
export function NotificationItem({ icon, title, body, time, read = false, unreadLabel, href, renderLink }: NotificationItemProps) {
  const children = (
    <>
      <span aria-hidden className="inline-flex size-[var(--icon-size-md)] shrink-0 text-ui-fg-muted [&>svg]:size-full">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-0-5)]">
        {!read ? <span className="sr-only">{unreadLabel}</span> : null}
        <span className="truncate type-body-base text-ui-fg">{title}</span>
        {body ? <span className="truncate type-body-caption text-ui-fg-muted">{body}</span> : null}
        <span className="type-body-caption text-ui-fg-muted">{time}</span>
      </span>
      {!read ? <CountBadge className="shrink-0" /> : null}
    </>
  )
  // Divider drawn inside the row (as List item), so the row keeps its drawn height.
  return <li className={ROW_DIVIDER}>{renderLink({ href, className: cn(ROW, 'hover:bg-ui-state-hover', FOCUS_RING_INSET), children })}</li>
}
