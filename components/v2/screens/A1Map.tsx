'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import {
  BottomSheet,
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
import { useV2Shell } from '../V2Shell'
import { V2MapCanvas, type V2MapHandle } from '../map/V2MapCanvas'
import { DURATIONS, MAX_STOPS, formatMinutes, itineraryToDraft, legMinutes, usePlanDraft } from '../map/usePlanDraft'
import { CATEGORIES, jsonFetch } from './A2Home'

// The map (A1; PD-20, PD-24 to PD-31, PD-45, PD-48; UI-74, UI-77, UI-89, UI-90): Map browse
// (SCR-004), Place selected (SCR-003), Plan in progress / Plan editor (SCR-005, SCR-013), Save plan
// (SCR-006), Quick plan and Plan from Saved results (SCR-009, SCR-035), Saved on the map (SCR-011).
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
  const { labels, openDrawer, toast } = useV2Shell()
  const mapRef = useRef<V2MapHandle>(null)
  const draft = usePlanDraft()

  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [zoom, setZoom] = useState(13)
  const [filter, setFilter] = useState<string | null>(null)
  const [mode, setMode] = useState<'nearby' | 'saved'>(params?.get('saved') ? 'saved' : 'nearby')
  const [selectedId, setSelectedId] = useState<string | null>(poiId ?? params?.get('poi') ?? null)
  const [cart, setCart] = useState<'collapsed' | 'open'>(params?.get('plan') ? 'open' : 'collapsed')
  const [activeDay, setActiveDay] = useState<'all' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>('all')
  const [snap, setSnap] = useState<SheetSnap>('mid')
  const [planSheet, setPlanSheet] = useState(!!params?.get('plan') && phone)
  const [saveOpen, setSaveOpen] = useState(false)
  const [planName, setPlanName] = useState('')
  const [saving, setSaving] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [durationFor, setDurationFor] = useState<string | null>(null)
  const [folderId, setFolderId] = useState<string | null>(params?.get('folder'))
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null)
  const [pendingEdit, setPendingEdit] = useState<ItineraryDetail | null>(null)

  const { pois, isLoading } = useMapPois(null, filter ? [filter] : [], bounds, zoom)
  const { detail } = usePlaceDetail(selectedId)
  const detailName = detail ? nameOf(detail, locale) : ''
  const saved = useSWR<SavedData>(user ? '/api/saved' : null, jsonFetch)
  const savedIds = useMemo(() => new Set((saved.data?.pois ?? []).map((p) => p.poi_id)), [saved.data])
  const [liked, setLiked] = useState<Set<string>>(new Set())

  const loadForEdit = (it: ItineraryDetail) => {
    const { stops, days: dayMap, durations } = itineraryToDraft(it)
    draft.replace(stops, dayMap, it.title, durations, { editing: true })
    setEditing({ id: it.id, title: it.title })
    setPendingEdit(null)
    setCart('open')
    if (phone) setPlanSheet(true)
    if (stops[0]) mapRef.current?.panTo(stops[0].coords_lat, stops[0].coords_lng)
  }
  const stopEditing = () => {
    const id = editing?.id
    draft.discard()
    setEditing(null)
    if (id) router.push(`/plan/${id}`)
  }

  // Hand-offs: Quick plan (PD-45) and Plan from Saved (SCR-035) open the plan unsaved; ?plan=edit
  // loads a published plan for editing (PD-28).
  useEffect(() => {
    const from = params?.get('from')
    if (from) {
      const stops = takeCourseHandoff()
      if (stops) {
        const had = draft.plan.stops.length > 0
        const asPois: MapPoi[] = stops.map((s) => ({ poi_id: s.poi_id, name_ko: s.name_ko, name_preferred: s.name_preferred, coords_lat: s.coords_lat, coords_lng: s.coords_lng, display_region: s.display_region ?? null, primary_image_url: s.primary_image_url }))
        draft.replace(asPois, Object.fromEntries(stops.map((s) => [s.poi_id, s.day])))
        setCart('open')
        if (phone) setPlanSheet(true)
        if (asPois[0]) mapRef.current?.panTo(asPois[0].coords_lat, asPois[0].coords_lng)
        toast({ type: 'success', message: had ? k('map.plan.replacedDraftToast') : t('CD1548') })
      }
    }
    const editId = params?.get('plan') === 'edit' ? params.get('id') : null
    if (editId) {
      // A plan in progress: on this device, or in the account (signed in; 401 for guests).
      const inProgress = async () =>
        !!getDraftPlan()?.stops.length ||
        (await fetch('/api/plans/draft').then((r) => (r.ok ? r.json() : null)).then((d: { stop_count?: number } | null) => (d?.stop_count ?? 0) > 0).catch(() => false))
      fetch(`/api/plans/${editId}`).then((r) => (r.ok ? r.json() : Promise.reject())).then(async (it: ItineraryDetail) => {
        // SCR-008: a plan in progress is saved or discarded before the published plan loads.
        if (await inProgress()) setPendingEdit(it)
        else loadForEdit(it)
      }).catch(() => toast({ type: 'critical', message: k('itinerary.error.title') }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (detail) mapRef.current?.panTo(detail.coords_lat, detail.coords_lng)
  }, [detail?.poi_id]) // eslint-disable-line react-hooks/exhaustive-deps

  const order = draft.plan.stops
  const planStops = order.map((poi, i) => ({ poi, day: draft.dayOf(poi.poi_id), order: i + 1 }))
  const addToPlan = (poi: MapPoi) => {
    const day = draft.add(poi, typeof activeDay === 'number' ? activeDay : undefined)
    if (day === null) toast({ type: 'warning', message: k('map.plan.maxStopsToast', { max: MAX_STOPS }) })
    else toast({ type: 'success', message: GAP.addedToDay(day) })
  }
  const toggleSave = async (poi: { poi_id: string }) => {
    if (!user) return router.push(`/login?next=/map?poi=${poi.poi_id}`)
    const on = savedIds.has(poi.poi_id)
    await send('/api/saved/poi', on ? 'DELETE' : 'POST', { poi_id: poi.poi_id }).then(() => toast({ type: 'success', message: on ? k('map.poiDetail.removedSave') : k('map.poiDetail.savedToast') })).catch(() => toast({ type: 'critical', message: t('CD1426') }))
    saved.mutate()
  }
  const toggleLike = async (id: string) => {
    if (!user) return router.push(`/login?next=/map?poi=${id}`)
    const on = liked.has(id)
    await send('/api/likes/poi', on ? 'DELETE' : 'POST', { poi_id: id }).catch(() => {})
    setLiked((s) => { const n = new Set(s); if (on) n.delete(id); else n.add(id); return n })
  }
  const totalMin = order.reduce((s, p) => s + (draft.plan.durations[p.poi_id] ?? 60), 0)
  const dayTotal = typeof activeDay === 'number' ? order.filter((p) => draft.dayOf(p.poi_id) === activeDay).reduce((s, p) => s + (draft.plan.durations[p.poi_id] ?? 60), 0) : null

  const savePlan = async () => {
    if (!user) return router.push('/login?next=/map?plan=open')
    setSaving(true)
    try {
      const res = await send('/api/plans', 'POST', {
        title: planName.trim(),
        stops: order.map((p, i) => ({ poi_id: p.poi_id, stop_order: i + 1, duration_min: draft.plan.durations[p.poi_id] ?? 60, day: draft.dayOf(p.poi_id) })),
        is_published: false,
      })
      const id: string | undefined = res?.plan?.id
      // Saving publishes it, as on the live map (DEC-29).
      if (id) await send(`/api/plans/${id}`, 'PATCH', { is_published: true })
      draft.discard()
      setSaveOpen(false)
      toast({ type: 'success', message: t('CD1636') })
      // SCR-008 Save plan: the plan in progress is saved, then the published plan opens for editing.
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
    <Tabs label={t('CD0815')} width="equal" value={mode} onValueChange={(v) => { setMode(v as 'nearby' | 'saved'); setSelectedId(null) }} tabs={[{ id: 'nearby', label: t('CD1576') }, { id: 'saved', label: k('saved.title') }]} />
  )
  const placeView = detail ? (
    <div className="flex flex-col gap-[var(--space-2)] pb-[var(--space-4)]">
      <Button variant="ghost" size="sm" leadingIcon={<ArrowLeft />} className="self-start" onClick={() => setSelectedId(null)}>{k('map.aiOverlay.back')}</Button>
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
          if (navigator.share) navigator.share({ title: detailName, url: location.href }).catch(() => {})
          else navigator.clipboard?.writeText(location.href)
        }}
        labels={{ add: k('map.poiDetail.addToPlan'), save: k('map.poiDetail.save'), like: k('map.poiDetail.like'), share: k('map.poiDetail.share') }}
      />
    </div>
  ) : selectedId ? <Skeleton className="m-[var(--space-4)] h-[320px]" /> : null

  const nearbyList = (
    <div className="flex flex-col gap-[var(--space-3)] p-[var(--space-4)]">
      {isLoading && !pois.length ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[80px]" />) : null}
      {!isLoading && !pois.length ? <EmptyState title={k('map.empty.title')} action={<Button size="md" variant="secondary" onClick={() => mapRef.current?.zoomOut()}>{k('map.zoomOut')}</Button>}>{t('CD1531')}</EmptyState> : null}
      <ul className="flex flex-col gap-[var(--space-3)]">
        {pois.slice(0, 40).map((p) => (
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
            />
          </li>
        ))}
      </ul>
    </div>
  )
  const savedView = !user ? (
    <EmptyState title={t('CD1577')} action={<Button size="md" onClick={() => router.push('/login?next=/map?saved=1')}>{t('CD0050')}</Button>}>{t('CD1578')}</EmptyState>
  ) : (
    <SavedHub
      view={!saved.data?.pois.length ? 'empty' : folderId ? 'folder' : 'places'}
      folders={(saved.data?.folders ?? []).map((f) => ({ id: f.id, name: f.name, count: k('saved.folder.poiCount', { count: f.pois.length }) }))}
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
      onToggle={() => { setCart((c) => (c === 'open' ? 'collapsed' : 'open')); if (phone) setPlanSheet(false) }}
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
      dayTotal={dayTotal !== null ? `${k('map.plan.dayTab', { n: activeDay })} · ${formatMinutes(dayTotal, k)}` : undefined}
      onDuration={setDurationFor}
      onRemove={draft.remove}
      onSave={() => { setPlanName(draft.plan.name ?? ''); setSaveOpen(true) }}
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
        <Chip key={c.slug} type="map" selected={filter === c.slug} onClick={() => setFilter((f) => (f === c.slug ? null : c.slug))}>{t(c.label)}</Chip>
      ))}
    </div>
  )

  const map = (
    <V2MapCanvas
      ref={mapRef}
      pois={pois}
      selectedId={selectedId}
      onSelect={(id) => { setSelectedId(id); if (id) { setMode('nearby'); setSnap('mid') } }}
      planStops={planStops}
      activeDay={activeDay}
      onBounds={(b, z) => { setBounds(b); setZoom(z) }}
      label={k('itinerary.mapAriaLabel')}
      errorText={GAP.mapError}
    />
  )

  const dialogs = (
    <>
      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        size="sm"
        title={k('map.plan.save')}
        closeLabel={k('badges.detail.close')}
        secondaryAction={<Button variant="ghost" onClick={() => setSaveOpen(false)}>{k('map.plan.discardCancel')}</Button>}
        primaryAction={<Button loading={saving} disabled={!planName.trim()} onClick={savePlan}>{k('map.plan.save')}</Button>}
      >
        <div className="flex flex-col gap-[var(--space-4)] pb-[var(--space-2)]">
          <p className="type-body-base text-ui-fg-muted">{t('CD1458')}</p>
          <TextInput label={t('CD1459')} showLabel value={planName} maxLength={80} onChange={(e) => setPlanName(e.target.value)} help={`${planName.length}/80`} data-autofocus />
          {!user ? <p className="type-body-caption text-ui-fg-muted">{t('CD1489')}</p> : null}
        </div>
      </Modal>
      <Dialog
        open={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        title={t('CD1536')}
        body={GAP.discardBody(order.length)}
        cancel={<Button variant="ghost" data-autofocus onClick={() => setDiscardOpen(false)}>{k('map.plan.discardCancel')}</Button>}
        confirm={<Button variant="danger" onClick={() => { draft.discard(); setDiscardOpen(false); setCart('collapsed'); setPlanSheet(false) }}>{k('map.plan.discardConfirm')}</Button>}
      />
      <Dialog
        open={!!pendingEdit}
        onCancel={() => { setPendingEdit(null); if (pendingEdit) router.push(`/plan/${pendingEdit.id}`) }}
        title={t('CD1525')}
        body={pendingEdit ? GAP.editDraftBody(order.length, pendingEdit.title) : ''}
        cancel={<Button variant="ghost" data-autofocus onClick={() => { const id = pendingEdit?.id; setPendingEdit(null); if (id) router.push(`/plan/${id}`) }}>{k('map.plan.discardCancel')}</Button>}
        third={<Button variant="ghost" onClick={() => { if (pendingEdit) { draft.discard(); loadForEdit(pendingEdit) } }}>{t('CD1527')}</Button>}
        confirm={<Button onClick={() => { setPlanName(draft.plan.name ?? ''); setSaveOpen(true) }}>{k('map.plan.save')}</Button>}
      />
      <Modal open={!!durationFor} onClose={() => setDurationFor(null)} size="sm" title={k('map.plan.durationAriaLabel', { name: order.find((p) => p.poi_id === durationFor) ? nameOf(order.find((p) => p.poi_id === durationFor)!, locale) : '' })} closeLabel={k('badges.detail.close')}>
        <div role="menu" className="-mx-[var(--space-6)]">
          {DURATIONS.map((m) => (
            <MenuItem key={m} checked={durationFor ? draft.plan.durations[durationFor] === m : false} onClick={() => { if (durationFor) draft.setDuration(durationFor, m); setDurationFor(null) }}>{formatMinutes(m, k)}</MenuItem>
          ))}
        </div>
      </Modal>
    </>
  )

  if (phone) {
    return (
      <div className="relative h-[calc(100dvh)] w-full overflow-hidden">
        <main id="main" className="absolute inset-0">{map}</main>
        <div className="absolute inset-x-0 top-0 z-20 flex flex-col gap-[var(--space-2)]">
          <TopAppBar type="map" labels={labels} onMenu={openDrawer} search={<SearchPill label={labels.search} href="/search" />} />
          <div className="px-[var(--space-2)]">{chips}</div>
        </div>
        {order.length ? (
          <div className="absolute bottom-[calc(76px+var(--space-3))] left-[var(--space-3)] z-30">
            <PlanPill label={`${k('map.plan.title')} · ${k('itinerary.stats.stops', { count: order.length })}`} accessibleLabel={k('map.plan.stripExpand')} expanded={planSheet} onClick={() => { setCart('open'); setPlanSheet(true) }} />
          </div>
        ) : null}
        <BottomSheet type="map" open label={k('map.plan.title')} snap={snap} onSnapChange={setSnap} onClose={() => setSnap('peek')} resizeLabel={k('itinerary.sheet.handle')} header={selectedId ? undefined : switcher}>
          {content}
        </BottomSheet>
        <BottomSheet type="modal" open={planSheet} onClose={() => setPlanSheet(false)} label={k('map.plan.title')}>
          <div className="-mx-[var(--space-4)] h-[70dvh]">{cartNode}</div>
        </BottomSheet>
        {dialogs}
      </div>
    )
  }
  return (
    <div className="flex min-h-0 flex-1">
      <LeftPanel type="map" label={k('map.plan.title')} cart={cartNode} cartOpen={cart === 'open'}>
        {selectedId ? null : <div className="sticky top-0 z-10 bg-ui-bg">{switcher}</div>}
        {content}
      </LeftPanel>
      <main id="main" className="relative min-w-0 flex-1">
        {map}
        <div className="pointer-events-none absolute inset-x-0 top-0 p-[var(--space-3)] [&>*]:pointer-events-auto">{chips}</div>
        <ZoomControl className="absolute bottom-[var(--space-6)] right-[var(--space-6)]" onZoomIn={() => mapRef.current?.zoomIn()} onZoomOut={() => mapRef.current?.zoomOut()} zoomInLabel={k('map.zoomIn')} zoomOutLabel={k('map.zoomOut')} atMax={zoom >= 18} atMin={zoom <= 6} />
      </main>
      {dialogs}
    </div>
  )
}

