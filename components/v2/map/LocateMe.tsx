'use client'

import { useState, type RefObject } from 'react'
import useSWR from 'swr'
import { Locate, LocateFixed } from 'lucide-react'
import { MapControl, Spinner, Tooltip } from '@/components/library'
import { LOCATE_ME } from '@/lib/features'
import { useCd } from '../cd'
import { useV2Shell } from '../V2Shell'
import type { V2MapHandle } from './V2MapCanvas'

export type LatLng = { lat: number; lng: number }

/**
 * Locate me (Google Maps pattern): the browser asks for the location on the first tap; while it
 * answers the control shows a spinner; then the map centers on the visitor with the location dot
 * and the control shows the filled locate icon. Denied: an info toast says how to turn it on.
 * Shown only with the Locate me switch on, and then only to visitors whose network location is in
 * Korea (the host's IP country); where no host reports a country (local runs) it shows. Returns the control (null when hidden) and the
 * location for the map's dot.
 */
export function useLocateMe(map: RefObject<V2MapHandle | null>, { phone = false }: { phone?: boolean } = {}) {
  const t = useCd()
  const { toast, toastHeight } = useV2Shell()
  const [state, setState] = useState<'idle' | 'locating' | 'on'>('idle')
  const [location, setLocation] = useState<LatLng | null>(null)
  const geo = useSWR<{ country: string | null }>(LOCATE_ME ? '/api/geo' : null, (u: string) => fetch(u).then((r) => r.json()), { revalidateOnFocus: false })
  const inKorea = !!geo.data && (geo.data.country === null || geo.data.country === 'KR')

  const locate = () => {
    if (state === 'locating') return
    if (!navigator.geolocation) return toast({ type: 'info', message: t('CD1806') })
    setState('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const at = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setLocation(at)
        setState('on')
        // Phones: centered in the part of the map above the sheet (mid = half the screen).
        map.current?.focus(at.lat, at.lng, phone ? Math.round(window.innerHeight / 2) : 0)
      },
      (err) => {
        setState(location ? 'on' : 'idle')
        toast(err.code === err.PERMISSION_DENIED ? { type: 'info', message: t('CD1806') } : { type: 'critical', message: t('CD0061') })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const icon = state === 'locating' ? <Spinner size="sm" /> : state === 'on' ? <LocateFixed /> : <Locate />
  const control = <MapControl icon={icon} label={t('CD1805')} aria-busy={state === 'locating' || undefined} onClick={locate} />
  // Phones: an open toast shares the control's line above the sheet; the control moves 8 above it.
  const lifted = toastHeight ? <div style={{ transform: `translateY(calc(-${toastHeight}px - var(--space-2)))` }} className="transition-transform motion-reduce:transition-none">{control}</div> : control
  if (!inKorea) return { control: null, still: null, location: null }
  // `still`: the phone control without the lift, for places where the toast is not on its line.
  return { control: !phone ? <Tooltip text={t('CD1805')} side="top">{control}</Tooltip> : lifted, still: control, location }
}
