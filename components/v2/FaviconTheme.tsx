'use client'

import { useEffect } from 'react'

// The tab icon (app/icon.svg) follows the browser theme, but browsers draw an SVG favicon once
// per address. On a live light or dark switch the icon gets a new address (?t=dark or ?t=light),
// so it is drawn again in the new theme without a reload. favicon.ico and the apple icon stay.
export default function FaviconTheme() {
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"][href^="/icon.svg"]')
      if (link) link.href = `/icon.svg?t=${query.matches ? 'dark' : 'light'}`
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return null
}
