'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'
import { cloneElement } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from './IconButton'
import { SearchInput } from './SearchInput'
import { Spinner } from './Spinner'

// Overlay molecules (UI-66; Figma Molecules): Dropdown menu, Popover, Combobox.
// Elevated surface, radius/2xl, 1px color/border, no shadow (UI-05), 8 from the trigger.
// Esc and an outside click close. Placement is CSS (below, start-aligned); a collision-aware
// version can replace it without changing props.

const SURFACE = 'absolute z-50 mt-[var(--space-2)] rounded-2xl border border-ui-border bg-ui-bg-elevated text-ui-fg'

function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && close()
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && close()
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open, close, ref])
}

export type DropdownMenuProps = {
  /** The trigger button; it gets aria-haspopup, aria-expanded and the click. */
  trigger: ReactElement
  /** Accessible name of the menu. */
  label: string
  /** Menu items; groups are separated by space (UI-95), Danger last. */
  children: ReactNode
  align?: 'start' | 'end'
  className?: string
}

/** Dropdown menu (CMP-005): role menu of Menu items; arrow keys move, Enter selects. */
export function DropdownMenu({ trigger, label, children, align = 'start', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const id = useId()
  useDismiss(open, () => setOpen(false), root)
  useEffect(() => {
    if (open) menu.current?.querySelector<HTMLElement>('[role^=menuitem]:not([disabled])')?.focus()
  }, [open])
  const onKey = (e: KeyboardEvent) => {
    const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role^=menuitem]:not([disabled])') ?? [])
    const i = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown') items[(i + 1) % items.length]?.focus()
    else if (e.key === 'ArrowUp') items[(i - 1 + items.length) % items.length]?.focus()
    else if (e.key === 'Home') items[0]?.focus()
    else if (e.key === 'End') items[items.length - 1]?.focus()
    else return
    e.preventDefault()
  }
  return (
    <div ref={root} className="relative inline-flex">
      {cloneElement(trigger, {
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
        onClick: () => setOpen((o) => !o),
      })}
      {open ? (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={onKey}
          onClick={(e) => (e.target as HTMLElement).closest('[role^=menuitem]') && setOpen(false)}
          className={cn(SURFACE, 'top-full min-w-[240px] py-[var(--space-2)]', align === 'end' ? 'right-0' : 'left-0', className)}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

/** Group inside a Dropdown menu: space between groups, optional group label (Select type). */
export function MenuGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="py-[var(--space-1)]">
      {label ? <div className="px-[var(--space-4)] py-[var(--space-2)] type-body-label text-ui-fg-muted">{label}</div> : null}
      {children}
    </div>
  )
}

export type PopoverProps = {
  trigger: ReactElement
  /** Figma Title (Show title); also the dialog name. */
  title?: string
  /** Accessible name when there is no title. */
  label?: string
  /** Figma Show close: needs closeLabel. */
  closeLabel?: string
  children: ReactNode
  /** Figma Show action: a link or button below the body. */
  action?: ReactNode
  side?: 'bottom' | 'top'
  className?: string
}

/** Popover (CMP-030, build-ahead): rich content on a trigger; focus moves into it. */
export function Popover({ trigger, title, label, closeLabel, children, action, side = 'bottom', className }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()
  useDismiss(open, () => setOpen(false), root)
  useEffect(() => {
    if (open) panel.current?.focus()
  }, [open])
  return (
    <div ref={root} className="relative inline-flex">
      {cloneElement(trigger, { 'aria-expanded': open, 'aria-controls': open ? id : undefined, onClick: () => setOpen((o) => !o) })}
      {open ? (
        <div
          ref={panel}
          id={id}
          role="dialog"
          tabIndex={-1}
          aria-labelledby={title ? `${id}-t` : undefined}
          aria-label={title ? undefined : label}
          className={cn(SURFACE, 'left-0 w-[320px] p-[var(--space-4)] outline-none', side === 'bottom' ? 'top-full' : 'bottom-full mb-[var(--space-2)]', className)}
        >
          <div className="flex items-start gap-[var(--space-2)]">
            <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
              {title ? <h3 id={`${id}-t`} className="type-title-card">{title}</h3> : null}
              <div className="type-body-base text-ui-fg-muted">{children}</div>
            </div>
            {closeLabel ? <IconButton label={closeLabel} icon={<X />} onClick={() => setOpen(false)} className="-mr-[var(--space-2)] -mt-[var(--space-2)]" /> : null}
          </div>
          {action ? <div className="mt-[var(--space-3)]">{action}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

export type ComboboxItem = { id: string; node: ReactElement; onSelect: () => void; onRemove?: () => void }

export type ComboboxProps = {
  /** Search input label and placeholder. */
  label: string
  placeholder?: string
  value: string
  onValueChange: (v: string) => void
  /** Figma State: what the list shows. */
  state: 'recent' | 'results' | 'empty' | 'loading'
  /** Combobox options (ComboboxOption elements with matching ids). */
  items: ComboboxItem[]
  /** Recent: heading and Clear all. */
  recentLabel?: string
  clearAllLabel?: string
  onClearAll?: () => void
  /** Empty: the hint. Loading: screen reader text. */
  emptyText?: ReactNode
  loadingLabel?: string
  clearLabel?: string
  /** Enter with no active option (search for the typed text). */
  onSubmit?: () => void
  className?: string
}

/** Combobox (CMP-010): WAI-ARIA combobox pattern; arrows move, Enter picks, Delete removes a recent, Esc closes. */
export function Combobox(props: ComboboxProps) {
  const { label, placeholder, value, onValueChange, state, items, recentLabel, clearAllLabel, onClearAll, emptyText, loadingLabel, clearLabel, onSubmit, className } = props
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(state === 'results' ? 0 : -1)
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()
  useDismiss(open, () => setOpen(false), root)
  useEffect(() => setActive(state === 'results' ? 0 : -1), [state, items.length])
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) setOpen(true)
    if (e.key === 'ArrowDown') setActive((a) => Math.min(items.length - 1, a + 1))
    else if (e.key === 'ArrowUp') setActive((a) => Math.max(-1, a - 1))
    else if (e.key === 'Enter') {
      if (active >= 0 && items[active]) items[active].onSelect()
      else onSubmit?.()
      setOpen(false)
    } else if (e.key === 'Delete' && state === 'recent' && active >= 0) items[active]?.onRemove?.()
    else if (e.key === 'Escape') setOpen(false)
    else return
    e.preventDefault()
  }
  return (
    <div ref={root} className={cn('relative', className)}>
      <SearchInput
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        onClear={() => onValueChange('')}
        clearLabel={clearLabel}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? items[active]?.id : undefined}
      />
      {open ? (
        <div className={cn(SURFACE, 'inset-x-0 top-full overflow-hidden py-[var(--space-2)]')}>
          {state === 'recent' && items.length ? (
            <div className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-2)]">
              <span className="type-body-label text-ui-fg-muted">{recentLabel}</span>
              {onClearAll ? (
                <button type="button" onClick={onClearAll} className="type-body-caption text-ui-fg-muted underline-offset-2 hover:text-ui-fg hover:underline">
                  {clearAllLabel}
                </button>
              ) : null}
            </div>
          ) : null}
          {state === 'loading' ? (
            <div className="flex justify-center py-[var(--space-4)]"><Spinner label={loadingLabel} /></div>
          ) : state === 'empty' ? (
            <p role="status" className="px-[var(--space-4)] py-[var(--space-3)] type-body-base text-ui-fg-muted">{emptyText}</p>
          ) : (
            <ul id={listId} role="listbox" aria-label={label}>
              {items.map((it, i) => cloneElement(it.node, { key: it.id, active: i === active }))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
