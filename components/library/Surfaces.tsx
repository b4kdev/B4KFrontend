'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Scrim } from './Content'
import { DragHandle } from './Plan'
import { IconButton } from './IconButton'
import { useFocusTrap, useMounted, usePhone } from './hooks'

// Surfaces (Figma Organisms): Modal, Dialog, Bottom sheet. No shadows, no lines
// between header, body and footer; the 1px outline stays. Modal and Dialog become a
// Modal bottom sheet on phones (adaptive).

const Portal = ({ children }: { children: ReactNode }) => (useMounted() ? createPortal(children, document.body) : null)

const SHEET =
  'fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl bg-ui-bg-raised pb-[env(safe-area-inset-bottom)] text-ui-fg motion-safe:animate-b4k-sheet-in'

/** Grabber on phone sheets: the 32x4 bar with py 8 (area 20). */
const GRABBER = (
  <div aria-hidden className="flex shrink-0 justify-center py-[var(--space-2)]">
    <span className="h-[var(--space-1)] w-[var(--space-8)] rounded-full bg-ui-border-strong" />
  </div>
)

export type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  /** Accessible name of the close button. */
  closeLabel: string
  /** Figma Size: sm 400, md 560, lg 720 (phones always get the sheet). */
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  /** Up to two actions; desktop puts the primary last (right), phones stack it first. */
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  /** Blocking backdrop for gates (sign-in, terms): no close on scrim click. */
  blocking?: boolean
  /** Hide the close button (gates without a way out). */
  hideClose?: boolean
}

export function Modal({ open, onClose, title, closeLabel, size = 'md', children, primaryAction, secondaryAction, blocking, hideClose }: ModalProps) {
  const phone = usePhone()
  const ref = useFocusTrap<HTMLDivElement>(open, blocking ? undefined : onClose)
  const id = useId()
  if (!open) return null
  const header = (
    <div className="flex items-center gap-[var(--space-2)] py-[var(--space-3)] pl-[var(--modal-padding)] pr-[var(--space-3)]">
      <h2 id={id} className="flex-1 type-title-card">{title}</h2>
      {hideClose ? null : <IconButton label={closeLabel} icon={<X />} onClick={onClose} />}
    </div>
  )
  const actions = primaryAction || secondaryAction ? (
    <div className={cn('flex gap-[var(--gap-sm)] px-[var(--modal-padding)] py-[var(--space-4)]', phone ? 'flex-col [&>*]:w-full' : 'justify-end')}>
      {phone ? <>{primaryAction}{secondaryAction}</> : <>{secondaryAction}{primaryAction}</>}
    </div>
  ) : null
  return (
    <Portal>
      <Scrim kind={blocking ? 'blocking' : 'default'} onClick={onClose} className="z-50" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={cn(
          'outline-none',
          phone
            ? cn(SHEET, 'bg-ui-bg-elevated')
            : cn(
                'fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-var(--space-8))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-ui-border bg-ui-bg-elevated text-ui-fg',
                size === 'sm' ? 'max-w-[400px]' : size === 'md' ? 'max-w-[560px]' : 'max-w-[720px]',
              ),
        )}
      >
        {phone ? GRABBER : null}
        {header}
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-y-auto p-[var(--modal-padding)] type-body-base">{children}</div>
        {actions}
      </div>
    </Portal>
  )
}

export type DialogProps = {
  open: boolean
  onCancel: () => void
  title: string
  /** One or two sentences. */
  body: ReactNode
  /** Primary (right on desktop); a Danger Button for Type=Destructive. */
  confirm: ReactNode
  /** The safe action; give it data-autofocus so focus starts there. */
  cancel: ReactNode
  /** Figma Show third action: a Ghost button on the left, e.g. Discard. */
  third?: ReactNode
}

/** Dialog (part of the Modal component): short decision, role alertdialog, focus on the safest action, Esc cancels. */
export function Dialog({ open, onCancel, title, body, confirm, cancel, third }: DialogProps) {
  const phone = usePhone()
  const ref = useFocusTrap<HTMLDivElement>(open, onCancel)
  const id = useId()
  if (!open) return null
  return (
    <Portal>
      <Scrim onClick={onCancel} className="z-50" />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        aria-describedby={`${id}-b`}
        className={cn(
          'outline-none',
          phone ? cn(SHEET, 'px-[var(--space-6)] pb-[var(--space-6)]') : 'fixed left-1/2 top-1/2 z-50 w-[calc(100%-var(--space-8))] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-ui-border bg-ui-bg-elevated p-[var(--space-6)] text-ui-fg',
        )}
      >
        {phone ? <div className="mb-[var(--space-2)]">{GRABBER}</div> : null}
        <h2 id={`${id}-t`} className="type-title-card">{title}</h2>
        <div id={`${id}-b`} className="mt-[var(--space-2)] type-body-base text-ui-fg-muted">{body}</div>
        <div className={cn('mt-[var(--space-6)] flex gap-[var(--gap-sm)]', phone ? 'flex-col [&>*]:w-full' : 'items-center')}>
          {phone ? (
            <>{confirm}{cancel}{third}</>
          ) : (
            <>
              {third ? <span className="mr-auto">{third}</span> : <span className="mr-auto" />}
              {cancel}
              {confirm}
            </>
          )}
        </div>
      </div>
    </Portal>
  )
}

export type SheetSnap = 'peek' | 'mid' | 'full'

export type BottomSheetProps = {
  /** Figma Type. Map = persistent over the map (no scrim at peek); Modal = short task over a scrim. */
  type?: 'map' | 'modal'
  open: boolean
  onClose: () => void
  /** Accessible name. */
  label: string
  /** Map: controlled snap (Peek 76, Mid 50%, Full 85%). */
  snap?: SheetSnap
  onSnapChange?: (s: SheetSnap) => void
  resizeLabel?: string
  /** Map sheets: a height per snap instead of the defaults (e.g. a shorter full state). */
  heights?: Partial<Record<SheetSnap, string>>
  /** Header shown at peek (map sheets). */
  header?: ReactNode
  /** Map sheets: a control 12 above the sheet's top edge, left aligned at 16; it follows the sheet as it moves (Plan pill). */
  above?: ReactNode
  /** Modal: stacked actions under the content (Figma: primary, secondary, optional third Ghost). */
  actions?: ReactNode
  /** Modal: the content draws its own padding and gaps (Search filters is drawn as the whole sheet). */
  flush?: boolean
  children: ReactNode
  className?: string
}

const SNAP_VH: Record<SheetSnap, string> = { peek: '76px', mid: '50dvh', full: '85dvh' }
const ORDER: SheetSnap[] = ['peek', 'mid', 'full']

/** Bottom sheet: radius/3xl top, bg-raised, grabber 32 by 4; map sheets drag between snaps. */
export function BottomSheet({ type = 'modal', open, onClose, label, snap = 'mid', onSnapChange, resizeLabel = '', heights, header, above, actions, flush, children, className }: BottomSheetProps) {
  const modal = type === 'modal'
  const ref = useFocusTrap<HTMLDivElement>(open && modal, onClose)
  const [drag, setDrag] = useState<number | null>(null)
  const start = useRef(0)
  useEffect(() => setDrag(null), [snap])
  if (!open) return null
  const step = (dir: 1 | -1) => {
    const i = ORDER.indexOf(snap) + dir
    if (i < 0) onClose()
    else if (i < ORDER.length) onSnapChange?.(ORDER[i])
  }
  return (
    <Portal>
      {modal ? <Scrim onClick={onClose} className="z-50" /> : null}
      <div
        ref={ref}
        role={modal ? 'dialog' : 'region'}
        aria-modal={modal || undefined}
        aria-label={label}
        tabIndex={-1}
        // Map sheets: toasts sit 12 above the sheet's top edge as it moves (V2Shell).
        data-toast-floor={!modal || undefined}
        className={cn(SHEET, 'outline-none', !modal && 'z-40 transition-[height] duration-medium2 ease-emphasized-decelerate motion-reduce:transition-none', className)}
        style={!modal ? { height: drag !== null ? `calc(${heights?.[snap] ?? SNAP_VH[snap]} + ${drag}px)` : heights?.[snap] ?? SNAP_VH[snap], maxHeight: '85dvh' } : undefined}
      >
        {!modal && above ? <div className="absolute bottom-[calc(100%+var(--space-3))] left-[var(--space-4)]">{above}</div> : null}
        <div
          className="flex shrink-0 touch-none justify-center py-[var(--space-2)]"
          onPointerDown={(e) => {
            if (modal) return
            start.current = e.clientY
            setDrag(0)
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => drag !== null && setDrag(start.current - e.clientY)}
          onPointerUp={() => {
            if (drag === null) return
            if (drag > 60) step(1)
            else if (drag < -60) step(-1)
            setDrag(null)
          }}
        >
          <DragHandle
            type="grabber"
            label={resizeLabel}
            className="h-[var(--space-1)]"
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') step(1)
              else if (e.key === 'ArrowDown') step(-1)
            }}
          />
        </div>
        {header ? <div className="shrink-0 px-[var(--space-4)] pb-[var(--space-2)]">{header}</div> : null}
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-y-auto',
            flush ? null : modal ? 'gap-[var(--space-2)] px-[var(--space-6)] py-[var(--space-2)]' : 'gap-[var(--space-4)] px-[var(--space-4)] pb-[var(--space-6)] pt-[var(--space-2)]',
          )}
        >
          {children}
        </div>
        {modal && actions ? (
          <div className="flex shrink-0 flex-col gap-[var(--space-2)] px-[var(--space-6)] pb-[var(--space-6)] pt-[var(--space-4)] [&>*]:w-full">{actions}</div>
        ) : null}
      </div>
    </Portal>
  )
}
