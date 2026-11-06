'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { Chip } from '@/components/library'
import { cn } from '@/lib/cn'
import { exploreOpen, markExploreReturn, type ExploreOpen } from '@/lib/explore-return'
import { useCd } from '../cd'
import { CATEGORIES } from '../categories'
import { useRideText } from '../rides/shared'

/**
 * The way back to the Explore spot the map's place was opened from: a map chip "‹ <ride> · <page>".
 * Shown only when this tab opened `poi` from Explore (a shared /map?poi= link has none). Browser Back
 * when the map is the very next history entry, else a push to that page; Explore restores the spot.
 * The caller places it (over the map, clear of the place view and the chip row).
 */
export function BackToExplore({ poi, className }: { poi: string | null; className?: string }) {
  const t = useCd()
  const r = useRideText()
  const router = useRouter()
  const [open, setOpen] = useState<ExploreOpen | null>(null)
  useEffect(() => {
    const o = exploreOpen()
    setOpen(poi && o?.poi === poi ? o : null)
  }, [poi])
  if (!open) return null
  const category = CATEGORIES.find((c) => open.path === `/explore/${c.slug}`)
  const page = category ? t(category.label) : null
  const ride = open.ride && r.has(`${open.ride}.title`) ? r(`${open.ride}.title`) : null
  const name = ride ?? page
  if (!name) return null
  const goBack = () => {
    markExploreReturn()
    if (history.length === open.len + 1) router.back()
    else router.push(open.path)
  }
  return (
    <Chip type="map" aria-pressed={undefined} aria-label={`${t('CD0121')}: ${[ride, page].filter(Boolean).join(' · ')}`} leadingIcon={<ChevronLeft />} onClick={goBack} className={cn('max-w-full', className)}>
      <span className="truncate">{name}</span>
      {ride && page ? <span className="shrink-0 text-ui-fg-muted max-sm:hidden">· {page}</span> : null}
    </Chip>
  )
}
