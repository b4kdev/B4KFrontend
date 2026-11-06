'use client'

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type MouseEvent, type PointerEvent, type TransitionEvent } from 'react'

// Behavior helpers shared by the library's surfaces (Modal, Dialog, Bottom sheet, Drawer).

/** True while the media query matches; false on the server. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Phones and small tablets: below the md breakpoint (768). Surfaces turn into bottom sheets. */
export const usePhone = () => useMediaQuery('(max-width: 767px)')

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * While `active`: moves focus into the container (first [data-autofocus] or first focusable),
 * keeps Tab inside it, closes on Escape (when onEscape is given), returns focus on close, and
 * stops the page behind from scrolling. Returns a callback ref: a container that mounts after
 * `active` turns on (a portal renders on its second pass) still gets the focus.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean, onEscape?: () => void) {
  const [el, setEl] = useState<T | null>(null)
  const escape = useRef(onEscape)
  escape.current = onEscape
  useEffect(() => {
    if (!active || !el) return
    const before = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE) ?? el
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escape.current) {
        e.stopPropagation()
        escape.current()
        return
      }
      if (e.key !== 'Tab' || !el) return
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((x) => x.offsetParent !== null)
      if (!items.length) return
      const [a, z] = [items[0], items[items.length - 1]]
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault()
        z.focus()
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault()
        a.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      before?.focus?.()
    }
  }, [active, el])
  return setEl
}

/** Mount after the first client render (portals, window sizes). */
export function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => setM(true), [])
  return m
}

// Sheet slide: open rises from below, close drops back down, a drag on the handle follows the
// pointer. Open eases out over the medium duration; close is quicker. With reduced motion the sheet
// does not move: it shows and goes in place (the site turns transitions off then, globals.css).
const SLIDE_IN = 'transform var(--duration-medium2) var(--easing-emphasized-decelerate)'
const SLIDE_OUT = 'transform var(--duration-short4) var(--easing-out-strong)'
/** Movement under this many pixels is a tap, not a drag. */
const DRAG_SLOP = 6
/** A release past this share of the sheet's height, or a downward flick faster than this (px per ms), closes it. */
const DISMISS_SHARE = 0.25
const FLICK_SPEED = 0.5
/** The longest close, so the sheet leaves the page even when no transition end arrives (a hidden tab). */
const LEAVE_AFTER_MS = 400

/**
 * Keeps a sheet on the page while it slides out, and drives its slide and drag. `open` is the
 * wanted state; `mounted` stays true until the close has played. Spread `style` and
 * `onTransitionEnd` on the moving element (`ref` too), and `grab` on the handle: a drag there
 * follows the pointer 1:1 (mouse and touch alike), a release far or fast enough calls `onDismiss`,
 * anything less settles back; a tap calls `onTap`. `handle` (a selector) limits the drag to that part
 * when `grab` sits on a larger area. A close mid-open (or the other way round) turns around from where
 * the sheet is.
 */
export function useSheetSlide({ open, onDismiss, onTap, handle }: { open: boolean; onDismiss: () => void; onTap?: () => void; handle?: string }) {
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  const [offset, setOffset] = useState<number | null>(null)
  const el = useRef<HTMLElement | null>(null)
  const grip = useRef<{ y: number; trail: [number, number][]; moved: boolean; offset: number } | null>(null)
  // A click that ends a drag must not also toggle what sits under the handle.
  const dragged = useRef(false)
  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    setShown(false)
    const leave = window.setTimeout(() => setMounted(false), LEAVE_AFTER_MS)
    return () => window.clearTimeout(leave)
  }, [open])
  // Once the sheet is on the page below the screen, its place there is read (so the rise has a start),
  // then it rises on the next frame.
  useLayoutEffect(() => {
    if (!open || !mounted || shown) return
    el.current?.getBoundingClientRect()
    const a = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(a)
  }, [open, mounted, shown])
  // A sheet on its way out takes no taps.
  const style: CSSProperties = reduce
    ? { opacity: shown ? 1 : 0, animation: 'none', pointerEvents: shown ? undefined : 'none' }
    : {
        // Before the rise the sheet jumps below the screen (a part that stays on the page must not glide there).
        transition: offset !== null || (open && !shown) ? 'none' : shown ? SLIDE_IN : SLIDE_OUT,
        transform: offset !== null ? `translateY(${offset}px)` : shown ? 'translateY(0)' : 'translateY(100%)',
        animation: 'none',
        userSelect: offset !== null ? 'none' : undefined,
        pointerEvents: shown ? undefined : 'none',
      }
  const onTransitionEnd = (e: TransitionEvent<HTMLElement>) => {
    if (e.target === e.currentTarget && !open) setMounted(false)
  }
  const grab = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      dragged.current = false
      if (e.button !== 0 || (handle && !(e.target as Element).closest(handle))) return
      grip.current = { y: e.clientY, trail: [[e.timeStamp, e.clientY]], moved: false, offset: 0 }
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const g = grip.current
      if (!g) return
      const dy = e.clientY - g.y
      if (!g.moved && Math.abs(dy) < DRAG_SLOP) return
      // Held from here on, so a tap stays a plain click on what is under it.
      if (!g.moved) e.currentTarget.setPointerCapture(e.pointerId)
      g.moved = true
      // The last tenth of a second of movement gives the release speed.
      g.trail = [...g.trail.filter(([t]) => e.timeStamp - t < 100), [e.timeStamp, e.clientY]]
      // Down follows the pointer; up past the open height gives a little and pulls back.
      g.offset = dy >= 0 ? dy : -Math.sqrt(-dy) * 2
      if (!reduce) setOffset(g.offset)
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const g = grip.current
      grip.current = null
      setOffset(null)
      if (!g) return
      if (!g.moved) return onTap?.()
      dragged.current = true
      // A pointer held still before the release has no speed left.
      const [t0, y0] = g.trail[0]
      const [t1, y1] = g.trail[g.trail.length - 1]
      const speed = e.timeStamp - t1 > 100 || t1 === t0 ? 0 : (y1 - y0) / (t1 - t0)
      const height = el.current?.offsetHeight || 1
      if (g.offset > height * DISMISS_SHARE || speed > FLICK_SPEED) onDismiss()
    },
    onPointerCancel: () => {
      grip.current = null
      setOffset(null)
    },
    onClickCapture: (e: MouseEvent<HTMLElement>) => {
      if (!dragged.current) return
      dragged.current = false
      e.preventDefault()
      e.stopPropagation()
    },
  }
  return { mounted, shown, ref: el, style, onTransitionEnd, grab }
}
