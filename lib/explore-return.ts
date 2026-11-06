'use client'

// The way back from the map to the Explore spot a place was opened from (per tab, sessionStorage).
// Explore keeps its last address and scroll; a place link clicked on Explore leaves a note the map
// reads for its back chip. A return (nav Explore, the chip, browser Back) restores the scroll and
// outlines the card that was opened.

import { useEffect } from 'react'

const LAST_KEY = 'b4k.explore.last'
const OPEN_KEY = 'b4k.explore.open'
/** A return counts for the Explore page that mounts within this time. */
const PENDING_MS = 3000

export type ExploreSpot = { path: string; y: number }
/** The place opened from Explore: its id, the page and the ride it sat in, history length at the click. */
export type ExploreOpen = { poi: string; path: string; ride: string | null; len: number }

let pendingAt = 0

const read = <T,>(key: string): T | null => {
  try {
    const v = sessionStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}
const write = (key: string, value: unknown) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)) } catch {}
}

/** Without the language prefix and the preview segment: /en/v2/explore/k-food → /explore/k-food. */
export const barePath = (path: string) => path.replace(/^\/[a-z]{2}(-[A-Z]{2})?(?=\/|$)/, '').replace(/^\/v2(?=\/|$)/, '') || '/'

/** The scrolling box: the shell's page column from 1024 up, else the window. */
function scroller(): HTMLElement | null {
  const box = document.querySelector<HTMLElement>('[data-page-scroll]')
  return box && getComputedStyle(box).overflowY === 'auto' ? box : null
}
const scrollTop = () => scroller()?.scrollTop ?? window.scrollY

export const lastExplore = () => read<ExploreSpot>(LAST_KEY)
export const exploreOpen = () => read<ExploreOpen>(OPEN_KEY)

/** The next Explore page to mount restores its spot (nav Explore, the chip, browser Back). */
export function markExploreReturn() {
  pendingAt = Date.now()
}

/** Scroll the page to the top (Explore tapped while on Explore). */
export function scrollPageTop() {
  const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  const box = scroller()
  if (box) box.scrollTo({ top: 0, behavior })
  else window.scrollTo({ top: 0, behavior })
}

/** Shell: browser Back and Forward count as a return. */
export function useExploreReturnListener() {
  useEffect(() => {
    window.addEventListener('popstate', markExploreReturn)
    return () => window.removeEventListener('popstate', markExploreReturn)
  }, [])
}

/** Explore pages: keep the address and scroll, note place links, restore on a return. */
export function useExploreReturn(path: string) {
  useEffect(() => {
    const here = barePath(path)
    // Only while this page is the address: leaving resets the scroll, which must not be kept.
    const save = () => {
      if (barePath(location.pathname) === here) write(LAST_KEY, { path: here, y: Math.round(scrollTop()) } satisfies ExploreSpot)
    }
    const last = lastExplore()
    const back = Date.now() - pendingAt < PENDING_MS && last?.path === here
    let frame = 0
    let flash: Animation | null = null
    if (back) {
      // Twice a frame: the rides lay out on the first, the scroll lands on the second.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          // Used up here, not on mount: a remount before this frame (Strict Mode) still restores.
          pendingAt = 0
          const box = scroller()
          if (box) box.scrollTo({ top: last.y })
          else window.scrollTo({ top: last.y })
          const open = exploreOpen()
          if (open?.path !== here) return
          const row = open.ride ? document.querySelector(`[data-explore-row="${CSS.escape(open.ride)}"]`) : document
          const card = row?.querySelector<HTMLElement>(`a[href*="/map?poi=${CSS.escape(open.poi)}"]`)
          // The opened card is outlined for a moment; reduced motion: no fade, it just goes.
          const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          flash = card?.animate([{ boxShadow: 'var(--focus-ring)' }, { boxShadow: 'var(--focus-ring)', offset: 0.7 }, { boxShadow: 'none' }], { duration: 1200, easing: still ? 'steps(1, end)' : 'ease-out' }) ?? null
        })
      })
    } else save()
    let pending = 0
    const onScroll = () => {
      cancelAnimationFrame(pending)
      pending = requestAnimationFrame(save)
    }
    // A place link opened from this page: the map's back chip reads it.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href*="/map?poi="]')
      const poi = a && new URL(a.href).searchParams.get('poi')
      if (!poi) return
      save()
      write(OPEN_KEY, { poi, path: here, ride: a.closest('[data-explore-row]')?.getAttribute('data-explore-row') ?? null, len: history.length } satisfies ExploreOpen)
    }
    const target: HTMLElement | Window = scroller() ?? window
    target.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('click', onClick, true)
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(pending)
      flash?.cancel()
      target.removeEventListener('scroll', onScroll)
      document.removeEventListener('click', onClick, true)
    }
  }, [path])
}
