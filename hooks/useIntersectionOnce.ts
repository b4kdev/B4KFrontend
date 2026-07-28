'use client'

import { useEffect, useRef } from 'react'

// Fires `onVisible` the first time the returned ref's element crosses the
// threshold, then disconnects — for view-tracking analytics (card impressions)
// where a mount-time fire would count off-screen cards as "viewed".
export function useIntersectionOnce<T extends Element>(onVisible: () => void) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible()
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return ref
}
