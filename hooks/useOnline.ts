'use client'

import { useEffect, useState } from 'react'

// SC-21 (OFF_03/OFF_04) — shared connectivity flag so write-actions (save,
// create, route recalc) can disable themselves and show "Try again when
// online" instead of silently failing against the network.
export function useOnline(): boolean {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
    const goOnline  = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}
