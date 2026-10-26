'use client'

import { useMemo, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { track } from '@/lib/analytics'
import useSWR, { useSWRConfig } from 'swr'
import { Bookmark, Heart, Share2, Trash2 } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import {
  BottomSheet,
  Button,
  Card,
  Dialog,
  EmptyState,
  IconButton,
  ItineraryPanel,
  LeftPanel,
  MenuItem,
  SearchPill,
  Skeleton,
  TopAppBar,
  ZoomControl,
  type SheetSnap,
} from '@/components/library'
import { usePhone } from '@/components/library/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { useItinerary, useItineraryMeta } from '@/hooks/useItinerary'
import type { MapPoi } from '@/hooks/useMapPois'
import type { SavedData } from '@/app/api/saved/route'
import type { ItineraryStop } from '@/lib/itinerary'
import { useCd, useCdKey } from '../cd'
import { jsonFetch } from './A2Home'
import { useGap } from '../gaps'
import { ABOVE_LEGAL_LINE, MapLegalLine } from '../map/MapLegalLine'
import { useLocateMe } from '../map/LocateMe'
import { useV2Shell } from '../V2Shell'
import { usePendingAction } from '../V2SignInGate'
import { V2MapCanvas, type V2MapHandle } from '../map/V2MapCanvas'
import { formatMinutes } from '../map/usePlanDraft'

// Published plan (A1): the Itinerary panel beside the map (desktop)
// or in the map Bottom sheet (phones). Owner: Edit plan, Share, Delete and leg modes; visitor:
// Save, Like, Share. Same calls as the live ItineraryDetailView.

type Mode = 'car' | 'public' | 'walk'
const MODES: Mode[] = ['walk', 'public', 'car']
type Day = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

const send = (url: string, method: string, body?: unknown) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json().catch(() => ({}))
  })

const stopName = (s: ItineraryStop, locale: string) => s.poi.name_preferred ?? (locale === 'ko' ? s.poi.name_ko : s.poi.name_en || s.poi.name_ko)

export function PlanScreen({ id }: { id: string }) {
  const GAP = useGap()
  const t = useCd()
  const k = useCdKey()
  const locale = useLocale()
  const router = useRouter()
  const phone = usePhone()
  const { user } = useAuth()
  const { labels, openDrawer, toast, requireSignIn } = useV2Shell()
  const { mutate: globalMutate } = useSWRConfig()
  const mapRef = useRef<V2MapHandle>(null)
  const locate = useLocateMe(mapRef, { phone })
  const { itinerary: it, isLoading, isError, isPrivate, isNotFound, mutate } = useItinerary(id)
  const { isOwner } = useItineraryMeta(user ? id : null)

  const [activeDay, setActiveDay] = useState<'all' | Day>('all')
  const [selected, setSelected] = useState<string | undefined>()
  const [snap, setSnap] = useState<SheetSnap>('mid')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [liked, setLiked] = useState<boolean | null>(null)
  const [saved, setSaved] = useState<boolean | null>(null)
  // Related plans: saved state from the person's saved plans, with taps applied on top.
  const savedPlans = useSWR<SavedData>(user ? '/api/saved' : null, jsonFetch)
  const [relatedTaps, setRelatedTaps] = useState<Map<string, boolean>>(new Map())
  const isRelatedSaved = (rid: string) => relatedTaps.get(rid) ?? (savedPlans.data?.plans ?? []).some((p) => p.id === rid)

  const stops = useMemo(() => [...(it?.stops ?? [])].sort((a, b) => a.stop_order - b.stop_order), [it])
  const dayOf = (s: ItineraryStop) => Math.min(Math.max(s.day ?? 1, 1), 8) as Day
  const days = stops.reduce((m, s) => Math.max(m, dayOf(s)), 1)
  const asPoi = (s: ItineraryStop): MapPoi => ({ poi_id: String(s.poi.poi_id), name_ko: s.poi.name_ko, name_en: s.poi.name_en, name_preferred: s.poi.name_preferred ?? undefined, coords_lat: s.poi.coords_lat, coords_lng: s.poi.coords_lng, display_region: null, display_domain: s.poi.display_domain, primary_image_url: s.poi.primary_image_url ?? undefined }) as MapPoi
  const planStops = useMemo(() => stops.map((s, i) => ({ poi: asPoi(s), day: dayOf(s), order: i + 1 })), [stops]) // eslint-disable-line react-hooks/exhaustive-deps
  const routeLegs = useMemo(() => {
    const legs = (it?.legs ?? []).filter((l) => l.path?.length > 1)
    return legs.length ? legs.map((l) => ({ day: dayOf(stops.find((s) => s.stop_order === l.from_stop_order) ?? stops[0]), path: l.path })) : undefined
  }, [it, stops]) // eslint-disable-line react-hooks/exhaustive-deps
  const center = stops[0] ? { lat: stops[0].poi.coords_lat, lng: stops[0].poi.coords_lng } : undefined

  const isLiked = liked ?? it?.viewer.is_liked ?? false
  const isSaved = saved ?? it?.viewer.is_saved ?? false
  // A guest gets the sign-in gate; after the sign-in the action only ever turns it on.
  const like = (force?: boolean) => {
    if (!user && !force) return requireSignIn({ title: t('CD0054'), pending: { type: 'like_plan', id }, run: () => like(true) })
    const next = force ? true : !isLiked
    setLiked(next)
    toast({ type: 'success', message: next ? k('itinerary.actions.likedToast') : k('itinerary.actions.unlikedToast') })
    send('/api/likes/plan', next ? 'POST' : 'DELETE', { plan_id: id }).then(() => mutate()).catch(() => { setLiked(!next); toast({ type: 'critical', message: t('CD0061') }) })
  }
  const save = (force?: boolean) => {
    if (!user && !force) return requireSignIn({ title: t('CD1541'), pending: { type: 'save_plan', id }, run: () => save(true) })
    const next = force ? true : !isSaved
    setSaved(next)
    toast({ type: 'success', message: next ? k('itinerary.actions.savedToast') : k('itinerary.actions.unsavedToast') })
    send('/api/saved/plan', next ? 'POST' : 'DELETE', { plan_id: id }).then(() => mutate()).catch(() => { setSaved(!next); toast({ type: 'critical', message: t('CD0061') }) })
  }
  usePendingAction('like_plan', !!user, () => like(true))
  usePendingAction('save_plan', !!user, (pid) => (pid && pid !== id ? saveRelated(pid, true) : save(true)))
  const share = async () => {
    const url = new URL(it?.share_url ?? window.location.href, window.location.origin)
    url.searchParams.set('ref', 'share')
    track('share_click', { target: typeof navigator.share === 'function' ? 'native' : 'link', content_type: 'plan', locale, screen_id: 'plan' })
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: it?.title, url: url.toString() })
        return
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return
      }
    }
    await navigator.clipboard?.writeText(url.toString()).catch(() => {})
    toast({ type: 'success', message: k('itinerary.copiedToast') })
  }
  const setLegMode = async (from: number, mode: Mode) => {
    try {
      await send(`/api/plans/${id}`, 'PATCH', { from_stop_order: from, transport_mode: mode })
      mutate()
    } catch {
      toast({ type: 'critical', message: k('map.plan.saveError') })
    }
  }
  const remove = async () => {
    setDeleting(true)
    try {
      await send(`/api/plans/${id}`, 'DELETE')
      await Promise.all([globalMutate('/api/plans/draft'), globalMutate('/api/profile/trips')])
      router.push('/map')
    } catch {
      toast({ type: 'critical', message: k('itinerary.actions.deleteErrorToast') })
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  // ── Panel ──────────────────────────────────────────────────────────────────
  const modeLabel = (m: Mode) => k(`itinerary.transport.${m}`)
  const legOf = (s: ItineraryStop) => it?.legs.find((l) => l.from_stop_order === s.stop_order)
  // Start times as drawn: each day starts at 09:00 and every stop adds its time there and the leg after it.
  const startTimes = useMemo(() => {
    const at = new Map<number, string>()
    const clock: Record<number, number> = {}
    for (const s of stops) {
      const d = dayOf(s)
      const min = clock[d] ?? 9 * 60
      at.set(s.stop_order, `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`)
      const leg = legOf(s)
      clock[d] = min + s.duration_min + (leg ? Math.max(1, Math.round(leg.estimated_duration_s / 60)) : 0)
    }
    return at
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [it])
  function saveRelated(rid: string, force?: boolean) {
    if (!user && !force) return requireSignIn({ title: t('CD1541'), pending: { type: 'save_plan', id: rid }, run: () => saveRelated(rid, true) })
    const next = force ? true : !isRelatedSaved(rid)
    const tap = (on: boolean) => setRelatedTaps((x) => new Map(x).set(rid, on))
    tap(next)
    toast({ type: 'success', message: next ? k('itinerary.actions.savedToast') : k('itinerary.actions.unsavedToast') })
    send('/api/saved/plan', next ? 'POST' : 'DELETE', { plan_id: rid }).then(() => savedPlans.mutate()).catch(() => {
      tap(!next)
      toast({ type: 'critical', message: t('CD0061') })
    })
  }
  const author = it ? it.author.name_preferred ?? (locale === 'ko' ? it.author.name_ko : it.author.name_en) ?? it.author.name_ko ?? '' : ''

  let panel: React.ReactNode
  if (isLoading) {
    panel = (
      // As drawn: title, owner and stats lines, then three stop blocks, 16 apart.
      <div aria-busy="true" aria-label={k('itinerary.loading')} className="flex flex-col gap-[var(--space-4)] p-[var(--space-4)]">
        <Skeleton shape="line" className="h-[var(--space-3)] w-4/5" />
        <Skeleton shape="line" className="h-[var(--space-3)] w-2/5" />
        <Skeleton shape="line" className="h-[var(--space-3)] w-full" />
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[72px]" />)}
      </div>
    )
  } else if (isPrivate || isNotFound) {
    panel = (
      <div className="p-[var(--space-4)]">
        <EmptyState type="no-results" title={t('CD1542')} action={<Button size="md" variant="secondary" onClick={() => router.push('/explore/popular-plans')}>{t('CD1544')}</Button>}>{t('CD1543')}</EmptyState>
      </div>
    )
  } else if (isError || !it) {
    panel = (
      <div className="p-[var(--space-4)]">
        <EmptyState title={k('itinerary.error.title')} action={<Button size="md" variant="secondary" onClick={() => mutate()}>{k('itinerary.error.cta')}</Button>}>{null}</EmptyState>
      </div>
    )
  } else {
    const km = it.distance_m ? Math.round(it.distance_m / 100) / 10 : null
    panel = (
      <ItineraryPanel
        title={it.title}
        owner={GAP.createdBy(author)}
        ownerAvatarSrc={it.author.avatar_url ?? null}
        ownerName={author}
        ownerHref={it.author.id ? `/profile/${it.author.id}` : undefined}
        privateLabel={isOwner && !it.is_published ? t('CD1002') : undefined}
        stats={[k('itinerary.stats.stops', { count: stops.length }), GAP.days(days), formatMinutes(it.total_duration_min, k), ...(km ? [k('itinerary.stats.km', { km })] : [])]}
        days={days}
        activeDay={activeDay}
        onDayChange={setActiveDay}
        stops={stops.map((s) => {
          const leg = legOf(s)
          return {
            id: String(s.poi.poi_id),
            name: stopName(s, locale),
            day: dayOf(s),
            meta: `${formatMinutes(s.duration_min, k)} · ${startTimes.get(s.stop_order)}`,
            note: s.notes ?? undefined,
            imageSrc: s.poi.primary_image_url,
            leg: leg ? { mode: leg.transport_mode, label: modeLabel(leg.transport_mode), time: k('itinerary.stats.min', { min: Math.max(1, Math.round(leg.estimated_duration_s / 60)) }) } : undefined,
          }
        })}
        selectedStop={selected}
        onSelectStop={(sid) => {
          setSelected(sid)
          const s = stops.find((x) => String(x.poi.poi_id) === sid)
          if (s) mapRef.current?.panTo(s.poi.coords_lat, s.poi.coords_lng)
        }}
        legMenu={isOwner ? (sid) => {
          const order = stops.find((x) => String(x.poi.poi_id) === sid)?.stop_order
          const current = it.legs.find((l) => l.from_stop_order === order)?.transport_mode
          return MODES.map((m) => <MenuItem key={m} checked={current === m} onClick={() => order !== undefined && setLegMode(order, m)}>{modeLabel(m)}</MenuItem>)
        } : undefined}
        legMenuLabel={(sid) => k('itinerary.transport.changeMode', { mode: modeLabel(it.legs.find((l) => l.from_stop_order === stops.find((x) => String(x.poi.poi_id) === sid)?.stop_order)?.transport_mode ?? 'walk') })}
        related={
          it.related.length ? (
            <ul className="flex flex-col gap-[var(--space-3)]">
              {it.related.map((r) => (
                <li key={r.id}>
                  <Card type="compact" href={`/plan/${r.id}`} title={r.title} imageSrc={r.thumbnail_url} meta={`${k('itinerary.related.stops', { count: r.stop_count })} · ${k('itinerary.related.likes', { count: r.like_count })}`} save={{ saved: isRelatedSaved(r.id), onSave: () => saveRelated(r.id), label: k('itinerary.actions.saveAria') }} />
                </li>
              ))}
            </ul>
          ) : undefined
        }
        footer={
          isOwner ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={() => router.push(`/map?plan=edit&id=${id}`)}>{t('CD1487')}</Button>
              <IconButton variant="secondary" label={k('itinerary.actions.shareAria')} icon={<Share2 />} onClick={share} />
              <IconButton variant="ghost" label={t('CD1454')} icon={<Trash2 />} onClick={() => setDeleteOpen(true)} />
            </>
          ) : (
            <>
              <Button className="flex-1" leadingIcon={<Bookmark className={isSaved ? 'fill-current' : undefined} />} aria-pressed={isSaved} onClick={() => save()}>{isSaved ? k('itinerary.actions.saved') : k('itinerary.actions.save')}</Button>
              <IconButton variant="secondary" label={k('itinerary.actions.likeAria')} aria-pressed={isLiked} icon={<Heart className={isLiked ? 'fill-current' : undefined} />} onClick={() => like()} />
              <IconButton variant="secondary" label={k('itinerary.actions.shareAria')} icon={<Share2 />} onClick={share} />
            </>
          )
        }
        labels={{ all: k('itinerary.tabs.all'), day: (n) => k('itinerary.tabs.day', { n }), days: k('itinerary.stopList.ariaLabel'), related: t('CD1486') }}
      />
    )
  }

  const map = (
    <V2MapCanvas
      ref={mapRef}
      pois={[]}
      selectedId={selected ?? null}
      onSelect={(sid) => setSelected(sid ?? undefined)}
      planStops={planStops}
      activeDay={activeDay}
      routeLegs={routeLegs}
      center={center}
      fitStops
      // Phones: the sheet (half the screen at mid) covers the map's lower part; fit the route above it.
      fitBottom={phone && snap !== 'peek' && typeof window !== 'undefined' ? Math.round(window.innerHeight / 2) : 0}
      userLocation={locate.location}
      label={k('itinerary.mapAriaLabel')}
      errorText={GAP.mapError}
    />
  )

  const dialogs = it ? (
    <>
      <Dialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        title={GAP.deletePlanTitle(it.title)}
        body={t('CD1546')}
        cancel={<Button variant="secondary" data-autofocus onClick={() => setDeleteOpen(false)}>{k('itinerary.actions.deleteCancel')}</Button>}
        confirm={<Button variant="danger" loading={deleting} onClick={remove}>{k('itinerary.actions.deleteConfirm')}</Button>}
      />
    </>
  ) : null

  if (phone) {
    return (
      <div className="relative h-[calc(100dvh)] w-full overflow-hidden">
        {/* The map and the sheet end at the navigation bar. */}
        <main id="main" className="absolute inset-x-0 top-0 bottom-[calc(var(--fab-size)+env(safe-area-inset-bottom))]">{map}</main>
        <div className="absolute inset-x-0 top-0 z-20 pt-[var(--space-2)]">
          <TopAppBar type="map" labels={labels} onMenu={openDrawer} search={<SearchPill label={labels.search} href="/search" />} />
        </div>
        <BottomSheet type="map" open label={k('itinerary.sheet.ariaLabel')} aboveEnd={locate.control} snap={snap} onSnapChange={setSnap} onClose={() => setSnap('peek')} resizeLabel={k('itinerary.sheet.handle')} className="bottom-[calc(var(--fab-size)+env(safe-area-inset-bottom))] pb-0">
          <div className="-mx-[var(--space-4)] -mt-[var(--space-2)] h-[calc(100dvh-160px)]">{panel}</div>
        </BottomSheet>
        {dialogs}
      </div>
    )
  }
  return (
    <div className="flex min-h-0 flex-1">
      <LeftPanel type="map" label={k('itinerary.panel.ariaLabel')}>
        {panel}
      </LeftPanel>
      <main id="main" className="relative min-w-0 flex-1">
        {map}
        <MapLegalLine />
        <div className={`absolute right-[var(--space-4)] flex flex-col gap-[var(--space-2)] ${ABOVE_LEGAL_LINE}`}>
          {locate.control}
          <ZoomControl onZoomIn={() => mapRef.current?.zoomIn()} onZoomOut={() => mapRef.current?.zoomOut()} zoomInLabel={k('map.zoomIn')} zoomOutLabel={k('map.zoomOut')} />
        </div>
      </main>
      {dialogs}
    </div>
  )
}
