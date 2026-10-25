'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import {
  BottomSheet,
  Scrim,
  Button,
  Card,
  Chip,
  Dialog,
  EmptyState,
  LeftPanel,
  MenuItem,
  Modal,
  PlaceDetail,
  PlanCart,
  PlanPill,
  SavedHub,
  SearchPill,
  Skeleton,
  Tabs,
  TextInput,
  TopAppBar,
  ZoomControl,
  type SheetSnap,
} from '@/components/library'
import { usePhone } from '@/components/library/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { useMapPois, type MapBounds, type MapPoi } from '@/hooks/useMapPois'
import { usePlaceDetail } from '@/hooks/usePlaceDetail'
import { getDraftPlan } from '@/lib/draft-plan'
import { takeCourseHandoff } from '@/lib/quickplan'
import type { SavedData } from '@/app/api/saved/route'
import type { ItineraryDetail } from '@/lib/itinerary'
import { useCd, useCdKey } from '../cd'
import { useGap } from '../gaps'
import { ABOVE_LEGAL_LINE, MapLegalLine } from '../map/MapLegalLine'
import { useLocateMe } from '../map/LocateMe'
import { useV2Shell } from '../V2Shell'
import { usePendingAction } from '../V2SignInGate'
import { V2MapCanvas, type V2MapHandle } from '../map/V2MapCanvas'
import { COURSE_HANDOFF_EVENT, DURATIONS, MAX_DAYS, MAX_STOPS, PER_DAY, formatMinutes, itineraryToDraft, legMinutes, usePlanDraft } from '../map/usePlanDraft'
import { CATEGORIES, jsonFetch } from './A2Home'

// The map (A1): Map browse
//, Place selected, Plan in progress / Plan editor, Save plan
//, Quick plan and Plan from Saved results, Saved on the map.
// Desktop: Left panel Type=Map (Nearby / Saved switch, content, Plan cart) beside the map; phones:
// Top app bar Map, chips, a map Bottom sheet and the Plan pill. Live POIs, place detail, saves.

const send = (url: string, method: string, body?: unknown) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json().catch(() => ({}))
  })

const nameOf = (p: { name_ko: string; name_en?: string; name_preferred?: string }, locale: string) => p.name_preferred ?? (locale === 'ko' ? p.name_ko : p.name_en || p.name_ko)

/** `poiId`: the place to open (the /place/[poiId] page); otherwise ?poi= in the address. */
export function MapScreen({ poiId }: { poiId?: string } = {}) {
  const GAP = useGap()
  const t = useCd()
  const k = useCdKey()
  const locale = useLocale()
  const router = useRouter()
  const phone = usePhone()
  const params = useSearchParams()
  const { user } = useAuth()
  const { labels, openDrawer, toast, requireSignIn } = useV2Shell()
  const mapRef = useRef<V2MapHandle>(null)
  const locate = useLocateMe(mapRef, { phone })
  const draft = usePlanDraft()
  // Toast actions run later (Undo): they call the draft as it is then, not as it was.
  const latestDraft = useRef(draft)
  latestDraft.current = draft

  const [bounds, setBounds] = useState<MapBounds | null>(null)
  // Filter results stay where they were fetched; after a pan the map offers Search this area.
  const [areaBounds, setAreaBounds] = useState<MapBounds | null>(null)
  const [areaMoved, setAreaMoved] = useState(false)
  // Places refresh 300 ms after the map stops, not on every idle in a row.
  const boundsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [zoom, setZoom] = useState(13)
  const [filter, setFilter] = useState<string | null>(null)
  // The map keeps the first onBounds it gets, so it reads the filter through a ref.
  const filterOn = useRef(false)
  filterOn.current = !!filter
  const [mode, setMode] = useState<'nearby' | 'saved'>(params?.get('saved') ? 'saved' : 'nearby')
  const [selectedId, setSelectedId] = useState<string | null>(poiId ?? params?.get('poi') ?? null)
  // Escape goes back from a selected place to the list (no dialog open); a map tap does the same.
  useEffect(() => {
    if (!selectedId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId])
  const [cart, setCart] = useState<'collapsed' | 'open'>(params?.get('plan') ? 'open' : 'collapsed')
  // The open plan starts on All days; each day is one tab away.
  const [activeDay, setActiveDay] = useState<'all' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>('all')
  const [snap, setSnap] = useState<SheetSnap>('mid')
  const [planSheet, setPlanSheet] = useState(!!params?.get('plan') && phone)
  // /plan and ?plan= open the plan on phones too (the phone check settles after the first render).
  const openedFromAddress = useRef(false)
  useEffect(() => {
    if (openedFromAddress.current || !phone || !params?.get('plan') || params.get('plan') === 'edit') return
    openedFromAddress.current = true
    setPlanSheet(true)
  }, [phone, params])
  const [saveOpen, setSaveOpen] = useState(false)
  const [planName, setPlanName] = useState('')
  const [nameError, setNameError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [folderId, setFolderId] = useState<string | null>(params?.get('folder'))
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null)
  const [pendingEdit, setPendingEdit] = useState<ItineraryDetail | null>(null)

  const { pois, isLoading } = useMapPois(null, filter ? [filter] : [], filter ? areaBounds ?? bounds : bounds, zoom)
  // View on map from a category special page (?collection=/api/explore/...): that page's places
  // only, on the map and in the list, until a category is picked.
  const collectionApi = params?.get('collection')
  const [collectionOn, setCollectionOn] = useState(!!collectionApi)
  const collection = useSWR<{ items: (Omit<MapPoi, 'primary_image_url'> & { primary_image_url?: string | null })[] }>(
    collectionOn && collectionApi?.startsWith('/api/explore/') ? collectionApi : null,
    jsonFetch,
  )
  const collectionPois = useMemo<MapPoi[] | null>(
    () => (collection.data ? collection.data.items.filter((p) => Number.isFinite(p.coords_lat) && Number.isFinite(p.coords_lng)).map((p) => ({ ...p, primary_image_url: p.primary_image_url ?? undefined })) : null),
    [collection.data],
  )
  const listPois = collectionOn && collectionPois ? collectionPois : pois
  const { detail, isError: placeMissing } = usePlaceDetail(selectedId)
  const detailName = detail ? nameOf(detail, locale) : ''
  const saved = useSWR<SavedData>(user ? '/api/saved' : null, jsonFetch)
  const savedIds = useMemo(() => new Set((saved.data?.pois ?? []).map((p) => p.poi_id)), [saved.data])
  const [liked, setLiked] = useState<Set<string>>(new Set())

  const fitPlan = (stops: { coords_lat: number; coords_lng: number }[]) => mapRef.current?.fitTo(stops.map((s) => ({ lat: s.coords_lat, lng: s.coords_lng })))
  const loadForEdit = (it: ItineraryDetail) => {
    const { stops, days: dayMap, durations } = itineraryToDraft(it)
    draft.replace(stops, dayMap, it.title, durations, { editing: true })
    setEditing({ id: it.id, title: it.title })
    // Every plan opens on All days; a place added there goes to the last day.
    setActiveDay('all')
    setPendingEdit(null)
    setCart('open')
    if (phone) setPlanSheet(true)
    fitPlan(stops)
  }
  // Editing a published plan opens it in the plan sheet on phones (the phone check settles after the first render).
  useEffect(() => {
    if (editing && phone) setPlanSheet(true)
  }, [editing, phone])
  const stopEditing = () => {
    const id = editing?.id
    draft.discard()
    setEditing(null)
    if (id) router.push(`/plan/${id}`)
  }

  // Hand-offs: Quick plan and Plan from Saved open the plan unsaved; ?plan=edit
  // loads a published plan for editing.
  const takeHandoff = () => {
    const handoff = takeCourseHandoff()
    if (!handoff) return
    const { stops, name } = handoff
    const had = draft.plan.stops.length > 0
    const asPois: MapPoi[] = stops.map((s) => ({ poi_id: s.poi_id, name_ko: s.name_ko, name_preferred: s.name_preferred, coords_lat: s.coords_lat, coords_lng: s.coords_lng, display_region: s.display_region ?? null, primary_image_url: s.primary_image_url }))
    draft.replace(asPois, Object.fromEntries(stops.map((s) => [s.poi_id, s.day])), name)
    setActiveDay('all')
    setSelectedId(null)
    setCollectionOn(false)
    setCart('open')
    if (phone) setPlanSheet(true)
    fitPlan(asPois)
    toast({ type: 'success', message: had ? k('map.plan.replacedDraftToast') : t('CD1548') })
  }
  // A hand-off made while this map is open (same address, so no remount).
  const handoffRef = useRef(takeHandoff)
  handoffRef.current = takeHandoff
  useEffect(() => {
    const on = () => handoffRef.current()
    window.addEventListener(COURSE_HANDOFF_EVENT, on)
    return () => window.removeEventListener(COURSE_HANDOFF_EVENT, on)
  }, [])
  useEffect(() => {
    if (params?.get('from')) takeHandoff()
    const editId = params?.get('plan') === 'edit' ? params.get('id') : null
    if (editId) {
      // A plan in progress: on this device, or in the account (signed in; 401 for guests).
      const inProgress = async () =>
        !!getDraftPlan()?.stops.length ||
        (await fetch('/api/plans/draft').then((r) => (r.ok ? r.json() : null)).then((d: { stop_count?: number } | null) => (d?.stop_count ?? 0) > 0).catch(() => false))
      fetch(`/api/plans/${editId}`).then((r) => (r.ok ? r.json() : Promise.reject())).then(async (it: ItineraryDetail) => {
        // Plan from another plan: a plan in progress is saved or discarded before the published plan loads.
        if (await inProgress()) setPendingEdit(it)
        else loadForEdit(it)
      }).catch(() => toast({ type: 'critical', message: k('itinerary.error.title') }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (collectionPois?.length) fitPlan(collectionPois)
  }, [collectionPois]) // eslint-disable-line react-hooks/exhaustive-deps

  // Continue your plan (?plan=open): fit the draft once it has loaded (device or account).
  const fittedOpen = useRef(false)
  useEffect(() => {
    if (fittedOpen.current || params?.get('plan') !== 'open' || !draft.plan.stops.length) return
    fittedOpen.current = true
    fitPlan(draft.plan.stops)
  }, [draft.plan.stops]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Phones: the place opens in the sheet at mid (half the screen), so centre it in the map above.
    if (detail) mapRef.current?.focus(detail.coords_lat, detail.coords_lng, phone ? Math.round(window.innerHeight / 2) : 0)
  }, [detail?.poi_id]) // eslint-disable-line react-hooks/exhaustive-deps

  const order = draft.plan.stops
  // Phones: once the plan has stops the browse sheet drops to peek, the Plan pill 12 above it; dragging
  // the sheet up brings the list back. A place open in the sheet stays until it is closed.
  const hasStops = order.length > 0
  const dropped = useRef(false)
  useEffect(() => {
    if (!hasStops) dropped.current = false
    else if (phone && !selectedId && !dropped.current) {
      dropped.current = true
      setSnap('peek')
    }
  }, [hasStops, phone, selectedId])
  const planStops = order.map((poi) => ({ poi, day: draft.dayOf(poi.poi_id), order: order.filter((p) => draft.dayOf(p.poi_id) === draft.dayOf(poi.poi_id)).indexOf(poi) + 1 }))
  // The plan's stops and route show on the map only while the plan is open (desktop: the Plan
  // cart opened from the bottom of the Left panel; phones: the plan sheet).
  const planVisible = phone ? planSheet : cart === 'open'
  // Any plan (Quick plan, Plan from Saved, built by hand, opened for editing) works the same: while
  // it is open the map shows its stops only; a category chip folds it and goes back to browsing.
  const showPlanOnly = planVisible && order.length > 0
  // Plan only: no other places on the map, except the one opened from the list.
  // Saved on the map: while Saved is on, the map shows the saved places only,
  // or the open list's places, and fits them.
  const savedPois = useMemo<MapPoi[] | null>(() => {
    if (mode !== 'saved' || !saved.data) return null
    const src = folderId ? saved.data.folders.find((f) => f.id === folderId)?.pois ?? [] : saved.data.pois
    return src.filter((p) => Number.isFinite(p.coords_lat) && Number.isFinite(p.coords_lng)).map((p) => ({ ...p, primary_image_url: p.primary_image_url ?? undefined }))
  }, [mode, folderId, saved.data])
  useEffect(() => {
    if (savedPois?.length) mapRef.current?.fitTo(savedPois.map((p) => ({ lat: p.coords_lat, lng: p.coords_lng })))
  }, [savedPois])
  const mapPois = showPlanOnly ? (detail && !order.some((p) => p.poi_id === detail.poi_id) ? [detail] : []) : savedPois ?? listPois
  const addToPlan = (poi: MapPoi, toDay?: number) => {
    // Read through the ref: the toast's action runs later, on the plan as it is then.
    const draft = latestDraft.current
    // The open day, or the last day on All days. A full day is not skipped silently: the toast
    // offers the next day with room.
    const target = toDay ?? (typeof activeDay === 'number' ? activeDay : draft.days)
    const inPlan = draft.plan.stops.some((s) => s.poi_id === poi.poi_id)
    if (!inPlan && draft.plan.stops.length < MAX_STOPS && draft.countOn(target) >= PER_DAY) {
      let next = target + 1
      while (next <= MAX_DAYS && draft.countOn(next) >= PER_DAY) next++
      if (next <= MAX_DAYS) {
        toast({ type: 'warning', message: t('CD1533', { day: target }), action: { label: t('CD1534', { next }), onClick: () => addToPlan(poi, next) } })
        return
      }
    }
    const day = draft.add(poi, target)
    if (day === null) toast({ type: 'warning', message: k('map.plan.maxStopsToast', { max: MAX_STOPS }) })
    else toast({ type: 'success', message: GAP.addedToDay(day), action: { label: t('CD1428'), onClick: () => latestDraft.current.remove(poi.poi_id) } })
  }
  // `on` = currently saved / liked; after a sign-in the action only ever turns it on.
  // signedIn: the save a guest started, finished after the sign-in (its own toast).
  const setSave = async (id: string, on: boolean, signedIn = false) => {
    await send('/api/saved/poi', on ? 'DELETE' : 'POST', { poi_id: id }).then(() => toast({ type: 'success', message: on ? k('map.poiDetail.removedSave') : signedIn ? t('CD1608') : k('map.poiDetail.savedToast') })).catch(() => toast({ type: 'critical', message: t('CD1426') }))
    saved.mutate()
  }
  // Optimistic: the heart changes at once and goes back with a toast if the server refuses.
  const flipLike = (id: string, on: boolean) => setLiked((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n })
  const setLike = async (id: string, on: boolean) => {
    flipLike(id, !on)
    await send('/api/likes/poi', on ? 'DELETE' : 'POST', { poi_id: id }).catch(() => {
      flipLike(id, on)
      toast({ type: 'critical', message: t('CD0061') })
    })
  }
  const toggleSave = (poi: { poi_id: string }) =>
    user ? setSave(poi.poi_id, savedIds.has(poi.poi_id)) : requireSignIn({ title: t('CD0027'), pending: { type: 'save_poi', id: poi.poi_id }, run: () => setSave(poi.poi_id, false, true) })
  const toggleLike = (id: string) =>
    user ? setLike(id, liked.has(id)) : requireSignIn({ title: t('CD0054'), pending: { type: 'like_poi', id }, run: () => setLike(id, false) })
  const openSaveSheet = () => { setPlanName(draft.plan.name ?? ''); setNameError(false); setSaveOpen(true) }
  usePendingAction('save_poi', !!user, (id) => { if (id) setSave(id, false, true) })
  usePendingAction('like_poi', !!user, (id) => { if (id) setLike(id, false) })
  usePendingAction('save_own_plan', !!user, () => { setCart('open'); openSaveSheet() })
  const totalMin = order.reduce((s, p) => s + (draft.plan.durations[p.poi_id] ?? 60), 0)
  const dayStops = typeof activeDay === 'number' ? order.filter((p) => draft.dayOf(p.poi_id) === activeDay).length : 0
  const dayTotal = typeof activeDay === 'number' ? order.filter((p) => draft.dayOf(p.poi_id) === activeDay).reduce((s, p) => s + (draft.plan.durations[p.poi_id] ?? 60), 0) : null

  const savePlan = async () => {
    if (!user) return requireSignIn({ title: t('CD0025'), draftNotice: t('CD1489'), pending: { type: 'save_own_plan' }, run: openSaveSheet })
    // Offline: the plan stays on the device; say so instead of a failed save.
    if (typeof navigator !== 'undefined' && !navigator.onLine) return toast({ type: 'warning', message: t('CD1208') })
    // Save stays enabled; an empty name is said on the field (an edit keeps its old name).
    if (!editing && !planName.trim()) return setNameError(true)
    setSaving(true)
    const stops = order.map((p, i) => ({ poi_id: p.poi_id, stop_order: i + 1, duration_min: draft.plan.durations[p.poi_id] ?? 60, day: draft.dayOf(p.poi_id) }))
    // Save changes on a plan opened for editing updates that plan in place (same link).
    if (editing) {
      try {
        await send(`/api/plans/${editing.id}`, 'PUT', { title: planName.trim() || editing.title, stops })
        const id = editing.id
        draft.discard()
        setEditing(null)
        setSaveOpen(false)
        toast({ type: 'success', message: t('CD1636') })
        router.push(`/plan/${id}`)
      } catch {
        toast({ type: 'critical', message: k('map.plan.saveError') })
      } finally {
        setSaving(false)
      }
      return
    }
    try {
      const res = await send('/api/plans', 'POST', {
        title: planName.trim(),
        stops,
        is_published: false,
      })
      const id: string | undefined = res?.plan?.id
      // Saving publishes it, as on the live map (DEC-29).
      if (id) await send(`/api/plans/${id}`, 'PATCH', { is_published: true })
      draft.discard()
      setSaveOpen(false)
      toast({ type: 'success', message: t('CD1636') })
      // Save plan: the plan in progress is saved, then the published plan opens for editing.
      if (pendingEdit) loadForEdit(pendingEdit)
      else if (id) router.push(`/plan/${id}`)
    } catch {
      toast({ type: 'critical', message: k('map.plan.saveError') })
    } finally {
      setSaving(false)
    }
  }

  // ── Panel content ──────────────────────────────────────────────────────────
  const switcher = (
    <Tabs label={t('CD0815')} width="equal" className={phone ? undefined : 'px-[var(--space-4)]'} value={mode} onValueChange={(v) => { setMode(v as 'nearby' | 'saved'); setSelectedId(null) }} tabs={[{ id: 'nearby', label: t('CD1576') }, { id: 'saved', label: k('saved.title') }]} />
  )
  const placeView = detail ? (
    <div className={cn('flex flex-col gap-[var(--space-2)] pb-[var(--space-4)]', phone && '-mx-[var(--space-4)] -mt-[var(--space-2)]')}>
      <PlaceDetail
        viewport={phone ? 'mobile' : 'desktop'}
        name={detailName}
        meta={[detail.display_domain && t(CATEGORIES.find((c) => c.slug === detail.display_domain)?.label ?? 'CD0804'), detail.display_region].filter(Boolean).join(' · ')}
        imageSrc={detail.primary_image_url}
        imageAlt={detailName}
        description={detail.description}
        details={detail.address ? [{ icon: 'address', title: detail.address }] : []}
        saved={savedIds.has(detail.poi_id)}
        liked={liked.has(detail.poi_id)}
        onAdd={() => addToPlan(detail)}
        onSave={() => toggleSave(detail)}
        onLike={() => toggleLike(detail.poi_id)}
        onShare={() => {
          // The shared link is the place page, not the map address.
          const url = `${location.origin}/${locale}/place/${detail.poi_id}`
          if (navigator.share) navigator.share({ title: detailName, url }).catch(() => {})
          else navigator.clipboard?.writeText(url).then(() => toast({ type: 'success', message: k('itinerary.copiedToast') }), () => {})
        }}
        labels={{ add: k('map.poiDetail.addToPlan'), save: k('map.poiDetail.save'), like: k('map.poiDetail.like'), share: k('map.poiDetail.share'), noPhoto: t('CD1678') }}
      />
    </div>
  ) : selectedId && placeMissing ? (
    <EmptyState
      type="no-results"
      title={t('CD1529')}
      action={<Button size="md" variant="secondary" onClick={() => setSelectedId(null)}>{t('CD0594')}</Button>}
      className={phone ? '-mx-[var(--space-4)] mt-[var(--space-2)]' : undefined}
    >
      {t('CD1530')}
    </EmptyState>
  ) : selectedId ? (
    // As drawn: the photo, name and meta lines, then three description lines.
    <div className={cn('flex flex-col gap-[var(--space-4)]', phone ? 'mt-[var(--space-2)]' : 'p-[var(--space-4)]')}>
      <Skeleton className={phone ? 'h-[225px]' : 'h-[252px]'} />
      <Skeleton shape="line" className="h-[var(--space-3)] w-[70%]" />
      <Skeleton shape="line" className="h-[var(--space-3)] w-[45%]" />
      <Skeleton shape="line" className="h-[var(--space-3)] w-full" />
      <Skeleton shape="line" className="h-[var(--space-3)] w-full" />
      <Skeleton shape="line" className="h-[var(--space-3)] w-[80%]" />
    </div>
  ) : null

  const nearbyList = (
    <div className={cn('flex flex-col gap-[var(--space-3)]', !phone && 'p-[var(--space-4)]')}>
      {(collectionOn ? collection.isLoading : isLoading) && !listPois.length ? (
        // As drawn: the area name and count, then each card's photo (4:3) and title.
        <div className="flex flex-col gap-[var(--space-4)]">
          <Skeleton shape="line" className="h-[var(--space-3)] w-1/2" />
          <Skeleton shape="line" className="h-[var(--space-3)] w-[30%]" />
          {Array.from({ length: 2 }, (_, i) => (
            <Fragment key={i}>
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton shape="line" className="h-[var(--space-3)] w-[60%]" />
            </Fragment>
          ))}
        </div>
      ) : null}
      {/* No places, as drawn: the area header's count line reads No places in this area, then the empty state. */}
      {!(collectionOn ? collection.isLoading : isLoading) && !listPois.length ? (
        <div className="flex flex-col gap-[var(--space-4)]">
          <p className="type-body-caption text-ui-fg-muted">{t('CD0626')}</p>
          <EmptyState type="no-results" title={t('CD0122')} action={<Button size="md" variant="secondary" onClick={() => mapRef.current?.zoomOut()}>{k('map.zoomOut')}</Button>}>{t('CD1531')}</EmptyState>
        </div>
      ) : null}
      <ul className="flex flex-col gap-[var(--space-4)]">
        {listPois.slice(0, 40).map((p) => (
          <li key={p.poi_id}>
            <Card
              type="place"
              href={`/map?poi=${p.poi_id}`}
              title={nameOf(p, locale)}
              imageSrc={p.primary_image_url}
              meta={p.display_region ?? ''}
              description={p.description}
              addToPlan={{ onAdd: () => addToPlan(p), label: `${k('map.poiDetail.addToPlan')}: ${nameOf(p, locale)}` }}
              save={{ saved: savedIds.has(p.poi_id), onSave: () => toggleSave(p), label: `${k('map.poiDetail.save')} ${nameOf(p, locale)}` }}
              like={{ liked: liked.has(p.poi_id), onLike: () => toggleLike(p.poi_id), label: liked.has(p.poi_id) ? k('explore.card.unlikeAria', { name: nameOf(p, locale) }) : k('explore.card.likeAria', { name: nameOf(p, locale) }) }}
            />
          </li>
        ))}
      </ul>
      {phone && listPois.length ? <MapLegalLine placement="list" /> : null}
    </div>
  )
  const savedView = !user ? (
    // Signed out: the Saved hub's empty view (bordered, bookmark), as drawn.
    <SavedHub
      view="empty"
      onOpenFolder={() => {}}
      onBack={() => {}}
      onAdd={() => {}}
      emptyAction={<Button size="md" onClick={() => requireSignIn({ title: t('CD1577'), run: () => {} })}>{t('CD0050')}</Button>}
      labels={{ back: k('saved.folder.back'), add: (n) => n, emptyTitle: t('CD1577'), emptyBody: t('CD1578') }}
    />
  ) : (
    <SavedHub
      view={!saved.data?.pois.length ? 'empty' : folderId ? 'folder' : 'places'}
      // The lists the person made; All Saved is the map itself (the design draws no All Saved row).
      folders={(saved.data?.folders ?? []).filter((f) => !f.is_default).map((f) => ({ id: f.id, name: f.name, count: k('saved.folder.poiCount', { count: f.pois.length }) }))}
      folder={(() => {
        const f = saved.data?.folders.find((x) => x.id === folderId)
        return f ? { name: f.name, places: f.pois.map((p) => ({ id: p.poi_id, name: nameOf(p, locale), meta: p.display_region, imageSrc: p.primary_image_url })) } : undefined
      })()}
      onOpenFolder={setFolderId}
      onBack={() => setFolderId(null)}
      onAdd={(id) => {
        const p = saved.data?.pois.find((x) => x.poi_id === id)
        if (p) addToPlan({ poi_id: p.poi_id, name_ko: p.name_ko, name_en: p.name_en, coords_lat: p.coords_lat, coords_lng: p.coords_lng, display_region: p.display_region, primary_image_url: p.primary_image_url ?? undefined })
      }}
      emptyAction={<Button size="md" variant="secondary" onClick={() => setMode('nearby')}>{t('CD1430')}</Button>}
      labels={{ back: k('saved.folder.back'), add: (n) => `${k('map.poiDetail.addToPlan')}: ${n}`, emptyTitle: k('saved.empty.places.title'), emptyBody: t('CD1429') }}
    />
  )
  const content = selectedId ? placeView : mode === 'nearby' ? nearbyList : savedView

  const cartNode = (
    <PlanCart
      state={order.length || cart === 'open' ? cart : 'empty'}
      onToggle={() => {
        if (cart !== 'open' && order.length) fitPlan(order)
        setCart((c) => (c === 'open' ? 'collapsed' : 'open'))
        if (phone) setPlanSheet(false)
      }}
      stops={order.map((p, i) => ({
        id: p.poi_id,
        name: nameOf(p, locale),
        day: Math.min(draft.dayOf(p.poi_id), 8) as 1,
        duration: formatMinutes(draft.plan.durations[p.poi_id] ?? 60, k),
        durationLabel: k('map.plan.durationAriaLabel', { name: nameOf(p, locale) }),
        leg: order[i + 1] && draft.dayOf(order[i + 1].poi_id) === draft.dayOf(p.poi_id) ? k('itinerary.stats.min', { min: legMinutes(p, order[i + 1]) }) : undefined,
      }))}
      days={draft.days}
      activeDay={activeDay}
      onDayChange={(d) => setActiveDay(d)}
      onAddDay={draft.addDay}
      summary={editing ? GAP.editing(editing.title) : order.length ? `${k('map.plan.title')} · ${k('itinerary.stats.stops', { count: order.length })} · ${formatMinutes(totalMin, k)}` : t('CD1359')}
      lastAdded={order.length ? nameOf(order[order.length - 1], locale) : undefined}
      lastAddedImage={order.length ? order[order.length - 1].primary_image_url ?? null : undefined}
      lastAddedMeta={order.length ? GAP.lastAddedMore(order.length - 1) : undefined}
      dayTotal={dayTotal !== null ? (dayStops && typeof activeDay === 'number' ? GAP.dayTotal(activeDay, formatMinutes(dayTotal, k), dayStops, PER_DAY) : [k('map.plan.dayTab', { n: activeDay }), k('itinerary.stats.stops', { count: dayStops })].join(' · ')) : order.length ? GAP.allDaysTotal(formatMinutes(totalMin, k), order.length) : undefined}
      durationMenu={(id) => DURATIONS.map((m) => (
        <MenuItem key={m} checked={draft.plan.durations[id] === m} onClick={() => draft.setDuration(id, m)}>{formatMinutes(m, k)}</MenuItem>
      ))}
      onRemove={draft.remove}
      onMove={draft.move}
      onSelect={(id) => {
        setSelectedId(id)
        const p = order.find((x) => x.poi_id === id)
        if (p) mapRef.current?.panTo(p.coords_lat, p.coords_lng)
      }}
      onSave={() => (user || editing ? openSaveSheet() : requireSignIn({ title: t('CD0025'), draftNotice: t('CD1489'), pending: { type: 'save_own_plan' }, run: openSaveSheet }))}
      onDiscard={() => (editing ? stopEditing() : setDiscardOpen(true))}
      labels={{
        region: k('map.plan.title'), emptyTitle: t('CD1359'), emptyBody: t('CD1607'), all: k('map.plan.allDays'),
        day: (n) => k('map.plan.dayTab', { n }), addDay: k('map.plan.addDay'), save: editing ? t('CD0993') : k('map.plan.save'), discard: editing ? t('CD1528') : k('map.plan.discardDraft'),
        remove: (n) => `${k('saved.poi.removeLabel')} ${n}`, reorder: (n) => k('map.plan.dragHandle', { n }),
        open: k('map.plan.stripExpand'), close: k('map.plan.stripCollapse'), about: GAP.about,
      }}
    />
  )

  const chips = (
    <div className="flex gap-[var(--space-2)] overflow-x-auto [scrollbar-width:none]">
      {CATEGORIES.map((c) => (
        <Chip key={c.slug} type="map" selected={filter === c.slug} onClick={() => { setCart((x) => (x === 'open' ? 'collapsed' : x)); setPlanSheet(false); setCollectionOn(false); setAreaBounds(bounds); setAreaMoved(false); setFilter((f) => (f === c.slug ? null : c.slug)) }}>{t(c.label)}</Chip>
      ))}
    </div>
  )

  const searchArea = filter && areaMoved && !selectedId ? (
    <div className="flex justify-center">
      <Chip type="map" selected aria-pressed={undefined} leadingIcon={<Search />} onClick={() => { setAreaBounds(bounds); setAreaMoved(false) }}>
        {GAP.searchArea}
      </Chip>
    </div>
  ) : null

  const map = (
    <V2MapCanvas
      ref={mapRef}
      pois={mapPois}
      selectedId={selectedId}
      onSelect={(id) => { setSelectedId(id); if (id) { setMode('nearby'); setSnap('mid') } }}
      planStops={planVisible ? planStops : []}
      activeDay={activeDay}
      savedIds={savedIds}
      onBounds={(b, z) => { setZoom(z); if (boundsTimer.current) clearTimeout(boundsTimer.current); boundsTimer.current = setTimeout(() => { setBounds(b); if (filterOn.current) setAreaMoved(true) }, 300) }}
      userLocation={locate.location}
      label={k('itinerary.mapAriaLabel')}
      errorText={GAP.mapError}
    />
  )

  const dialogs = (
    <>
      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        size="md"
        title={t('CD0642')}
        closeLabel={k('badges.detail.close')}
        secondaryAction={<Button variant="secondary" onClick={() => setSaveOpen(false)}>{k('map.plan.discardCancel')}</Button>}
        primaryAction={<Button loading={saving} onClick={savePlan}>{k('map.plan.save')}</Button>}
      >
        <div className="flex flex-col gap-[var(--space-4)]">
          <p className="type-body-base text-ui-fg-muted">{t('CD1458')}</p>
          <TextInput label={t('CD1459')} showLabel required placeholder={t('CD0645')} value={planName} maxLength={80} onChange={(e) => { setPlanName(e.target.value); setNameError(false) }} help={`${planName.length}/80`} error={nameError ? t('CD1799') : undefined} data-autofocus />
        </div>
      </Modal>
      <Dialog
        open={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        title={t('CD1536')}
        body={GAP.discardBody(order.length)}
        cancel={<Button variant="secondary" data-autofocus onClick={() => setDiscardOpen(false)}>{k('map.plan.discardCancel')}</Button>}
        confirm={<Button variant="danger" onClick={() => { draft.discard(); setDiscardOpen(false); setCart('collapsed'); setPlanSheet(false) }}>{k('map.plan.discardConfirm')}</Button>}
      />
      <Dialog
        open={!!pendingEdit}
        onCancel={() => { setPendingEdit(null); if (pendingEdit) router.push(`/plan/${pendingEdit.id}`) }}
        title={t('CD1525')}
        body={pendingEdit ? GAP.editDraftBody(order.length, pendingEdit.title) : ''}
        cancel={<Button variant="secondary" data-autofocus onClick={() => { const id = pendingEdit?.id; setPendingEdit(null); if (id) router.push(`/plan/${id}`) }}>{k('map.plan.discardCancel')}</Button>}
        third={<Button variant="ghost" onClick={() => { if (pendingEdit) { draft.discard(); loadForEdit(pendingEdit) } }}>{t('CD1527')}</Button>}
        confirm={<Button onClick={openSaveSheet}>{k('map.plan.save')}</Button>}
      />
    </>
  )

  if (phone) {
    return (
      <div className="relative h-[calc(100dvh)] w-full overflow-hidden">
        {/* The map ends at the navigation bar, so Naver's logo stays in view. */}
        <main id="main" className="absolute inset-x-0 top-0 bottom-[calc(var(--fab-size)+env(safe-area-inset-bottom))]">{map}</main>
        <div className="absolute inset-x-0 top-0 z-20 flex flex-col pt-[var(--space-2)]">
          <TopAppBar type="map" labels={labels} onMenu={openDrawer} search={<SearchPill label={labels.search} href="/search" />} />
          <div className="px-[var(--space-4)]">{chips}</div>
          {searchArea ? <div className="mt-[var(--space-4)]">{searchArea}</div> : null}
        </div>
        {/* The open plan dims the map and the bar above it, as drawn; a tap there closes it. */}
        {planSheet ? <Scrim onClick={() => setPlanSheet(false)} className="bottom-[calc(var(--fab-size)+env(safe-area-inset-bottom))] z-30" /> : null}
        <BottomSheet
          type="map"
          open
          label={k('map.plan.title')}
          snap={planSheet ? 'full' : snap}
          onSnapChange={(s) => (planSheet ? s !== 'full' && setPlanSheet(false) : setSnap(s))}
          onClose={() => (planSheet ? setPlanSheet(false) : setSnap('peek'))}
          resizeLabel={k('itinerary.sheet.handle')}
          heights={planSheet ? { full: '70dvh' } : undefined}
          header={selectedId || planSheet ? undefined : <div className="pt-[var(--space-4)]">{switcher}</div>}
          aboveEnd={planSheet ? undefined : locate.control}
          above={order.length && !planSheet ? <PlanPill label={`${k('map.plan.title')} · ${k('itinerary.stats.stops', { count: order.length })}`} accessibleLabel={k('map.plan.stripExpand')} expanded={planSheet} onClick={() => { setCart('open'); setPlanSheet(true); fitPlan(order) }} /> : undefined}
          className="bottom-[calc(var(--fab-size)+env(safe-area-inset-bottom))] pb-0"
        >
          {planSheet ? <div className="-mx-[var(--space-4)] -mb-[var(--space-6)] -mt-[var(--space-2)] flex min-h-0 flex-1 flex-col">{cartNode}</div> : content}
        </BottomSheet>
        {dialogs}
      </div>
    )
  }
  return (
    <div className="flex min-h-0 flex-1">
      <LeftPanel type="map" label={k('map.plan.title')} cart={cartNode} cartOpen={cart === 'open'}>
        {selectedId ? null : <div className="sticky top-0 z-10 bg-ui-bg pt-[var(--space-4)]">{switcher}</div>}
        {/* The Saved hub's raised background sits 16 under the tabs and 16 above the Plan cart, as drawn. */}
        {!selectedId && mode === 'saved' ? <div className="my-[var(--space-4)] flex-1 bg-ui-bg-raised">{content}</div> : content}
      </LeftPanel>
      <main id="main" className="relative min-w-0 flex-1">
        {map}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-[var(--space-4)] p-[var(--space-4)] [&>*]:pointer-events-auto">
          {chips}
          {searchArea}
        </div>
        <MapLegalLine />
        <div className={cn('absolute right-[var(--space-4)] flex flex-col gap-[var(--space-2)]', ABOVE_LEGAL_LINE)}>
          {locate.control}
          <ZoomControl onZoomIn={() => mapRef.current?.zoomIn()} onZoomOut={() => mapRef.current?.zoomOut()} zoomInLabel={k('map.zoomIn')} zoomOutLabel={k('map.zoomOut')} atMax={zoom >= 18} atMin={zoom <= 6} />
        </div>
      </main>
      {dialogs}
    </div>
  )
}

