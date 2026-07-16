'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SheetSnap = 'peek' | 'mid' | 'full'

const ORDER: SheetSnap[] = ['full', 'mid', 'peek']

// px of the sheet still visible at peek (drag handle + one header row)
const PEEK_VISIBLE = 76
// fraction of sheet height visible at mid
const MID_VISIBLE_FRACTION = 0.5
// px past peek before a downward drag/fling dismisses the sheet
const DISMISS_SLOP = 64
// px/ms — above this a release is treated as a fling, not a position settle
const FLING_VELOCITY = 0.5
const VELOCITY_WINDOW_MS = 100

interface Options {
  open: boolean
  initialSnap?: SheetSnap
  onDismiss: () => void
  onSnapChange?: (snap: SheetSnap) => void
}

/**
 * 3-snap bottom-sheet gesture controller (peek / mid / full) shared by
 * POIBottomSheet + SavedBottomSheet (DEC-38). Pointer-events based with
 * pointer capture, rolling-window velocity, measured (not vh) snap offsets,
 * and prefers-reduced-motion instant settling.
 */
export function useBottomSheetSnap({ open, initialSnap = 'mid', onDismiss, onSnapChange }: Options) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const [snap, setSnapState] = useState<SheetSnap>(initialSnap)
  const [offset, setOffset] = useState(0) // translateY px from fully-open
  const [dragging, setDragging] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Drag bookkeeping (refs — no re-render on move)
  const startY = useRef(0)
  const startOffset = useRef(0)
  const samples = useRef<{ y: number; t: number }[]>([])
  const rafId = useRef<number | null>(null)

  // px offset for a snap given the measured height
  const offsetFor = useCallback((s: SheetSnap, h: number) => {
    if (h === 0) return 0
    if (s === 'full') return 0
    if (s === 'mid') return h * (1 - MID_VISIBLE_FRACTION)
    return Math.max(0, h - PEEK_VISIBLE) // peek
  }, [])

  // prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Measure sheet height (URL bar show/hide changes it on mobile)
  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    const measure = () => setHeight(el.getBoundingClientRect().height)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open])

  // Reset to initial snap each time the sheet opens
  useEffect(() => {
    if (open) setSnapState(initialSnap)
  }, [open, initialSnap])

  const setSnap = useCallback((s: SheetSnap) => {
    setSnapState(prev => {
      if (s !== prev) onSnapChange?.(s)
      return s
    })
  }, [onSnapChange])

  // When not dragging, offset follows the current snap (eased via CSS transition)
  useEffect(() => {
    if (!dragging) setOffset(offsetFor(snap, height))
  }, [snap, height, dragging, offsetFor])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (height === 0) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    startY.current = e.clientY
    startOffset.current = offset
    samples.current = [{ y: e.clientY, t: performance.now() }]
    setDragging(true)
  }, [height, offset])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    const maxOffset = offsetFor('peek', height) + DISMISS_SLOP
    const next = Math.min(Math.max(startOffset.current + (e.clientY - startY.current), 0), maxOffset)
    const now = performance.now()
    samples.current.push({ y: e.clientY, t: now })
    samples.current = samples.current.filter(s => now - s.t <= VELOCITY_WINDOW_MS)
    if (rafId.current == null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null
        setOffset(next)
      })
    }
  }, [dragging, height, offsetFor])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    if (rafId.current != null) { cancelAnimationFrame(rafId.current); rafId.current = null }
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    setDragging(false)

    // rolling-window velocity (px/ms); +ve = downward
    const s = samples.current
    const first = s[0]
    const last = s[s.length - 1]
    const dt = last && first ? last.t - first.t : 0
    const velocity = dt > 0 ? (last.y - first.y) / dt : 0

    const peekOffset = offsetFor('peek', height)
    const current = Math.min(Math.max(startOffset.current + (e.clientY - startY.current), 0), peekOffset + DISMISS_SLOP)

    // dismiss when dragged/flung below peek
    if (current > peekOffset + DISMISS_SLOP / 2 || (velocity > FLING_VELOCITY && snap === 'peek')) {
      onDismiss()
      return
    }

    const idx = ORDER.indexOf(snap) // 0 full, 1 mid, 2 peek
    if (velocity > FLING_VELOCITY) {            // fling down → one step toward peek
      setSnap(ORDER[Math.min(idx + 1, ORDER.length - 1)])
    } else if (velocity < -FLING_VELOCITY) {    // fling up → one step toward full
      setSnap(ORDER[Math.max(idx - 1, 0)])
    } else {                                    // settle to nearest by position
      let nearest: SheetSnap = 'full'
      let best = Infinity
      for (const cand of ORDER) {
        const d = Math.abs(current - offsetFor(cand, height))
        if (d < best) { best = d; nearest = cand }
      }
      setSnap(nearest)
    }
  }, [dragging, height, offsetFor, onDismiss, setSnap, snap])

  // touch-action is NOT set here — it goes per-element: 'none' on the drag
  // handle, 'pan-y' + overscroll-contain on the scrollable body, so the body
  // can still scroll while the handle owns the drag gesture.
  const sheetStyle: React.CSSProperties = {
    transform: `translateY(${open ? (dragging ? offset : offsetFor(snap, height)) : (height || 1000)}px)`,
    transition: dragging || reducedMotion ? 'none' : 'transform var(--dur-reveal) var(--ease-out)',
  }

  return {
    sheetRef,
    snap,
    setSnap,
    dragging,
    handleProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
    sheetStyle,
  }
}
