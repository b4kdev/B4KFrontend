'use client'

import { useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { cn } from '@/lib/cn'
import { usePhone } from '@/components/library/hooks'
import { ROW_DIVIDER } from '@/components/library/Lists'
import { ArrowLeft, Bookmark, Ellipsis, Folder, Globe, Pencil, Share2, Trash2, Lock, X } from 'lucide-react'
import { Link as IntlLink, useRouter } from '@/i18n/navigation'
import {
  Button,
  buttonVariants,
  Card,
  Checkbox,
  Dialog,
  DropdownMenu,
  EmptyState,
  IconButton,
  Image,
  Logo,
  ListItem,
  MenuGroup,
  MenuItem,
  Modal,
  SectionHeader,
  Skeleton,
  Tabs,
  TextInput,
} from '@/components/library'
import { useAuth } from '@/contexts/AuthContext'
import { saveCourseHandoff } from '@/lib/quickplan'
import type { SavedData, SavedPoi } from '@/app/api/saved/route'
import { GAMIFICATION } from '@/lib/features'
import { useCd, useCdKey } from '../cd'
import { V2Page } from '../V2Page'
import { useV2Shell } from '../V2Shell'
import { usePlaceActions } from '../usePlaceActions'
import { jsonFetch } from './A2Home'
import { LeaderboardTab } from './A3Account'

// Saved and Plan from saved places.
// Live /api/saved, /api/folders, /api/plans, /api/profile/trips.

const send = (url: string, method: string, body?: unknown) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json().catch(() => ({}))
  })

const poiName = (p: SavedPoi, locale: string) => (locale === 'ko' ? p.name_ko : p.name_en || p.name_ko)

export function SignedOutPrompt({ title, text, icon, plain, className }: { title: string; text: string; icon?: React.ReactNode; plain?: boolean; className?: string }) {
  const t = useCd()
  const { requireSignIn } = useV2Shell()
  // Sign in opens the gate; Google returns to this page, and the page fills in once signed in.
  return (
    <EmptyState
      container={plain ? 'plain' : 'bordered'}
      icon={icon}
      className={className}
      title={title}
      action={<Button size="md" onClick={() => requireSignIn({ title, run: () => {} })}>{t('CD0050')}</Button>}
    >
      {text}
    </EmptyState>
  )
}

/** Name sheet for New folder and Rename folder (one sheet like Save plan). */
function FolderNameSheet({ open, mode, initial, onClose, onSave }: { open: boolean; mode: 'new' | 'rename'; initial?: string; onClose: () => void; onSave: (name: string) => Promise<void> }) {
  const t = useCd()
  const k = useCdKey()
  const [name, setName] = useState(initial ?? '')
  const [busy, setBusy] = useState(false)
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={mode === 'new' ? t('CD1206') : t('CD1212')}
      closeLabel={k('badges.detail.close')}
      secondaryAction={<Button variant="secondary" onClick={onClose}>{k('saved.folder.cancel')}</Button>}
      primaryAction={
        <Button
          loading={busy}
          disabled={!name.trim()}
          onClick={async () => {
            setBusy(true)
            await onSave(name.trim()).finally(() => setBusy(false))
          }}
        >
          {mode === 'new' ? t('CD1613') : k('saved.folder.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-[var(--space-4)]">
        <p className="type-body-base text-ui-fg-muted">{mode === 'new' ? t('CD1611') : t('CD1614')}</p>
        <TextInput label={t('CD1207')} showLabel required help={`${name.length}/40`} placeholder={t('CD1612')} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} data-autofocus />
      </div>
    </Modal>
  )
}

export function SavedScreen() {
  const t = useCd()
  const k = useCdKey()
  const locale = useLocale()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useV2Shell()
  const params = useSearchParams()
  const [tab, setTab] = useState(params?.get('tab') ?? 'places')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [sheet, setSheet] = useState<{ mode: 'new' | 'rename'; id?: string; name?: string } | null>(null)
  const [del, setDel] = useState<{ kind: 'folder' | 'plan'; id: string; name: string; count?: number } | null>(null)
  const { data, error, isLoading, mutate } = useSWR<SavedData>(user ? '/api/saved' : null, jsonFetch)
  const folder = data?.folders.find((f) => f.id === folderId)
  const placeActions = usePlaceActions()

  const tabs = [
    { id: 'places', label: t('CD1238') },
    { id: 'my-plans', label: t('CD1237') },
    { id: 'saved-plans', label: t('CD1239') },
    // Leaderboard: the fourth tab, behind the gamification switch.
    ...(GAMIFICATION ? [{ id: 'leaderboard', label: t('CD1645') }] : []),
  ]
  const board = GAMIFICATION && tab === 'leaderboard'
  // Figma: Saved is a top-level destination (phone bar with Menu and search), title as a
  // section header on every width, then Tabs, then the Places toolbar (New list, Plan from Saved).
  const head = <h1 className="type-display-h3">{k('saved.title')}</h1>
  const toolbar = (
    <div className="flex items-center justify-between gap-[var(--space-4)]">
      <Button variant="ghost" size="md" onClick={() => setSheet({ mode: 'new' })}>{t('CD1206')}</Button>
      <IntlLink href="/saved/plan" aria-disabled={!!data && !data.pois.length} className="inline-flex h-[var(--control-height-md)] items-center gap-[var(--gap-sm)] bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse aria-disabled:pointer-events-none aria-disabled:bg-ui-bg-disabled aria-disabled:text-ui-fg-disabled">
        {t('CD1363')}
      </IntlLink>
    </div>
  )

  // Figma: content 16 from the bar and the footer on phones, 24 under the Header and 32 above the footer on desktop.
  const page = 'flex flex-col max-lg:py-[var(--space-4)] lg:pb-[var(--space-8)]'

  if (!user) {
    return (
      <V2Page className={page}>
        {/* Figma: the tabs stay; a plain prompt with the bookmark icon fills the page. */}
        <div className="flex flex-1 flex-col gap-[var(--space-4)]">
          {head}
          <Tabs label={k('saved.tabs.ariaLabel')} value={tab} onValueChange={setTab} tabs={tabs} className="self-start" />
          {board ? <LeaderboardTab /> : <SignedOutPrompt title={t('CD1577')} text={t('CD1581')} icon={<Bookmark />} plain className="flex-1" />}
        </div>
      </V2Page>
    )
  }

  // Figma Folder open: back and the list name with its count, then View on map and the list menu.
  const placesView = folder ? (
    <div className="flex flex-col gap-[var(--space-4)]">
      <h1 className="sr-only">{k('saved.title')}</h1>
      <div className="flex items-center gap-[var(--space-2)]">
        <IconButton label={k('saved.folder.back')} icon={<ArrowLeft />} onClick={() => setFolderId(null)} />
        <SectionHeader title={folder.name} subtitle={k('saved.folder.poiCount', { count: folder.pois.length })} className="min-w-0 flex-1" />
      </div>
      <div className="flex items-center justify-between gap-[var(--space-4)]">
        <IntlLink href={`/map?saved=1&folder=${folder.id}`} className={buttonVariants({ variant: 'secondary', size: 'md' })}>{k('saved.folder.viewOnMap')}</IntlLink>
        {!folder.is_default ? (
          <DropdownMenu label={k('saved.folder.folderMenu', { name: folder.name })} align="end" trigger={<IconButton label={k('saved.folder.folderMenu', { name: folder.name })} icon={<Ellipsis />} />}>
            <MenuGroup>
              <MenuItem icon={<Pencil />} onClick={() => setSheet({ mode: 'rename', id: folder.id, name: folder.name })}>{k('saved.folder.rename')}</MenuItem>
            </MenuGroup>
            <MenuGroup>
              <MenuItem icon={<Trash2 />} variant="danger" onClick={() => setDel({ kind: 'folder', id: folder.id, name: folder.name, count: folder.pois.length })}>{t('CD1580')}</MenuItem>
            </MenuGroup>
          </DropdownMenu>
        ) : null}
      </div>
      <ul className="grid grid-cols-2 gap-[var(--space-3)] lg:grid-cols-4 lg:gap-[var(--space-4)]">
        {folder.pois.map((p) => (
          <li key={p.poi_id}><Card type="place" href={`/map?poi=${p.poi_id}`} title={poiName(p, locale)} imageSrc={p.primary_image_url} meta={p.display_region} {...placeActions(p.poi_id, poiName(p, locale))} /></li>
        ))}
      </ul>
    </div>
  ) : data && !data.pois.length ? (
    <EmptyState icon={<Bookmark />} title={k('saved.empty.places.title')} className="flex-1" action={<IntlLink href="/map" className="inline-flex h-[var(--control-height-md)] items-center bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse">{t('CD1430')}</IntlLink>}>{t('CD1429')}</EmptyState>
  ) : (
    <div className="flex flex-col gap-[var(--space-4)]">
      <ul className="grid grid-cols-2 gap-[var(--space-3)] lg:grid-cols-4 lg:gap-[var(--space-4)]">
        {data?.folders.map((f) => (
          <li key={f.id}>
            <button type="button" onClick={() => setFolderId(f.id)} aria-label={k('saved.folder.openAriaLabel', { name: f.name })} className="block w-full text-left focus-visible:shadow-focus-ring focus-visible:outline-none">
              <span className="flex flex-col bg-ui-bg-raised hover:bg-[image:linear-gradient(var(--color-state-hover),var(--color-state-hover))]">
                <ListCover name={f.name} photos={f.pois.map((p) => p.primary_image_url).filter((u): u is string => !!u)} />
                <span className="flex flex-col gap-[var(--space-1)] bg-ui-bg-raised p-[var(--space-3)]">
                  <span className="type-title-card text-ui-fg">{f.name}</span>
                  <span className="type-body-caption text-ui-fg-muted">{k('saved.folder.poiCount', { count: f.pois.length })}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )

  const myPlans = data?.myPlans.length ? (
    <ul>
      {data.myPlans.map((p) => (
        <ListItem
          key={p.id}
          title={p.title || k('profile.untitledPlan')}
          // Figma: status in the second line ("5 stops · 2 days · Public", "Draft · 3 stops").
          secondary={p.is_draft
            ? `${k('saved.myPlan.draft')} · ${k('saved.plan.stops', { count: p.stop_count })}`
            : `${k('saved.plan.stops', { count: p.stop_count })} · ${k('saved.plan.days', { count: p.duration_days })} · ${p.is_public ? k('profile.settings.privacy.public') : k('profile.settings.privacy.private')}`}
          leading={<Image ratio="1:1" src={p.cover_image_url} alt="" sizes="48px" className="size-[var(--space-12)]" />}
          href={`/plan/${p.id}`}
          renderLink={({ href, className, children }) => (
            <div className="flex items-center">
              <IntlLink href={href} className={`${className} flex-1`}>{children}</IntlLink>
              <DropdownMenu label={p.title} align="end" trigger={<IconButton label={k('saved.myPlan.ariaLabel', { title: p.title })} icon={<Ellipsis />} className="mr-[var(--space-4)]" />}>
                <MenuGroup>
                  <MenuItem icon={<Pencil />} onClick={() => router.push(`/map?plan=edit&id=${p.id}`)}>{t('CD1487')}</MenuItem>
                  <MenuItem icon={<Share2 />} onClick={() => { navigator.clipboard?.writeText(`${location.origin}/${locale}/plan/${p.id}`); toast({ type: 'success', message: k('profile.trips.card.shareCopiedToast') }) }}>{k('saved.myPlan.share')}</MenuItem>
                  {!p.is_draft ? (
                    // A published plan switches between public and private; a failed switch says so.
                    <MenuItem
                      icon={p.is_public ? <Lock /> : <Globe />}
                      onClick={async () => {
                        await send(`/api/plans/${p.id}`, 'PATCH', { is_published: !p.is_public }).catch(() => toast({ type: 'critical', message: t('CD0061') }))
                        mutate()
                      }}
                    >
                      {p.is_public ? t('CD0517') : t('CD0518')}
                    </MenuItem>
                  ) : null}
                </MenuGroup>
                <MenuGroup>
                  <MenuItem icon={<Trash2 />} variant="danger" onClick={() => setDel({ kind: 'plan', id: p.id, name: p.title })}>{t('CD1454')}</MenuItem>
                </MenuGroup>
              </DropdownMenu>
            </div>
          )}
        />
      ))}
    </ul>
  ) : (
    <EmptyState container="bordered" title={k('saved.empty.myPlans.title')} action={<IntlLink href="/map?plan=new" className="inline-flex h-[var(--control-height-md)] items-center bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse">{k('saved.empty.myPlans.cta')}</IntlLink>}>{k('saved.empty.myPlans.desc')}</EmptyState>
  )

  const savedPlans = data?.plans.length ? (
    <ul className="grid grid-cols-2 gap-[var(--space-3)] lg:grid-cols-4 lg:gap-[var(--space-4)]">
      {data.plans.map((p) => (
        <li key={p.id}><Card type="plan" href={`/plan/${p.id}`} title={p.title} imageSrc={p.cover_image_url} author={p.author_name} saves={String(p.saves_count)} stops={`${k('saved.plan.stops', { count: p.stop_count })} · ${k('saved.plan.days', { count: p.duration_days })}`} /></li>
      ))}
    </ul>
  ) : (
    <EmptyState container="bordered" title={k('saved.empty.savedPlans.title')}>{k('saved.empty.savedPlans.desc')}</EmptyState>
  )

  return (
    <V2Page className={page}>
      <div className="flex flex-1 flex-col gap-[var(--space-4)]">
        {folder && tab === 'places' ? null : (
          <>
            {head}
            <Tabs label={k('saved.tabs.ariaLabel')} value={tab} onValueChange={(v) => { setTab(v); setFolderId(null) }} tabs={tabs} className="self-start" />
          </>
        )}
        {tab === 'places' && !folder ? toolbar : null}
        {board ? <LeaderboardTab /> : null}
        {board ? null : isLoading ? <div aria-busy className="grid grid-cols-2 gap-[var(--space-3)] lg:grid-cols-4 lg:gap-[var(--space-4)]">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-0 pb-[calc(75%+var(--space-16)+var(--space-1))]" />)}</div> : null}
        {error && !board ? <EmptyState type="error" container="bordered" title={k('saved.error.title')} action={<Button size="md" variant="secondary" onClick={() => mutate()}>{k('saved.error.retry')}</Button>} /> : null}
        {data && !board ? (tab === 'places' ? placesView : tab === 'my-plans' ? myPlans : savedPlans) : null}
      </div>
      <FolderNameSheet
        key={sheet ? `${sheet.mode}-${sheet.id ?? 'new'}` : 'closed'}
        open={!!sheet}
        mode={sheet?.mode ?? 'new'}
        initial={sheet?.name}
        onClose={() => setSheet(null)}
        onSave={async (name) => {
          try {
            if (sheet?.mode === 'rename' && sheet.id) await send(`/api/folders/${sheet.id}`, 'PATCH', { name })
            else await send('/api/folders', 'POST', { name })
            setSheet(null)
            mutate()
          } catch {
            toast({ type: 'critical', message: t('CD1426') })
          }
        }}
      />
      <Dialog
        open={!!del}
        onCancel={() => setDel(null)}
        title={del?.kind === 'folder' ? t('CD1582', { folder: del.name }) : k('saved.confirmDelete.title')}
        body={del?.kind === 'folder' ? t('CD1583', { n: del.count ?? 0 }) : k('saved.confirmDelete.desc')}
        cancel={<Button variant="secondary" data-autofocus onClick={() => setDel(null)}>{k('saved.confirmDelete.cancel')}</Button>}
        confirm={
          <Button
            variant="danger"
            onClick={async () => {
              if (!del) return
              // A failed delete says so and keeps the list or plan open; plans: CD-0508, lists: the general error.
              const ok = await (del.kind === 'folder' ? send(`/api/folders/${del.id}`, 'DELETE') : send(`/api/profile/trips?id=${del.id}`, 'DELETE')).then(() => true, () => false)
              if (!ok) toast({ type: 'critical', message: del.kind === 'folder' ? t('CD0061') : t('CD0508') })
              setDel(null)
              if (ok) setFolderId(null)
              mutate()
            }}
          >
            {del?.kind === 'folder' ? t('CD1580') : k('saved.confirmDelete.confirm')}
          </Button>
        }
      />
    </V2Page>
  )
}

// ── Plan from saved places ─────────────────────────────────────────

const LIMIT = 48
const PER_DAY = 6

export function PlanFromSavedScreen() {
  const t = useCd()
  const k = useCdKey()
  const locale = useLocale()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useV2Shell()
  const { data, isLoading } = useSWR<SavedData>(user ? '/api/saved' : null, jsonFetch)
  const phone = usePhone()
  const [picked, setPicked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const folders = useMemo(() => (data?.folders ?? []).filter((f) => !f.is_default && f.pois.length), [data])
  const loose = useMemo(() => {
    const inFolders = new Set(folders.flatMap((f) => f.pois.map((p) => p.poi_id)))
    return (data?.pois ?? []).filter((p) => !inFolders.has(p.poi_id))
  }, [data, folders])
  const all = data?.pois ?? []
  // Figma Limit reached: the warning shows as the picks reach 48 (the rest then can't be checked).
  const limitToast = () => toast({ type: 'warning', message: t('CD1589') })
  const toggle = (id: string) => {
    if (picked.includes(id)) return setPicked(picked.filter((x) => x !== id))
    if (picked.length >= LIMIT) return limitToast()
    if (picked.length + 1 === LIMIT) limitToast()
    setPicked([...picked, id])
  }
  const toggleGroup = (ids: string[]) => {
    if (ids.every((id) => picked.includes(id))) return setPicked(picked.filter((x) => !ids.includes(x)))
    const next = Array.from(new Set([...picked, ...ids]))
    if (next.length >= LIMIT) limitToast()
    setPicked(next.slice(0, LIMIT))
  }
  const make = () => {
    setBusy(true)
    const chosen = all.filter((p) => picked.includes(p.poi_id))
    saveCourseHandoff(
      chosen.map((p, i) => ({ poi_id: p.poi_id, name_ko: p.name_ko, name_preferred: poiName(p, locale), coords_lat: p.coords_lat, coords_lng: p.coords_lng, display_region: p.display_region, primary_image_url: p.primary_image_url ?? undefined, day: Math.floor(i / PER_DAY) + 1 })),
    )
    router.push('/map?from=saved')
  }
  // Figma: a full-screen flow. Flow bar (logo, close), Pick places header, folder rows
  // (folder icon, "2 of 3 selected", select all) and place rows (48 photo, area) with the checkbox
  // at the end; the whole row toggles. Action bar: Cancel and Make plan on the 640 column.
  const row = cn(ROW_DIVIDER, 'w-full flex-row-reverse gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] hover:bg-ui-state-hover [&>span:last-child]:flex [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1 [&>span:last-child]:min-h-[var(--target-touch-min)] [&>span:last-child]:items-center [&>span:last-child]:gap-[var(--space-3)]')
  const group = (title: string, pois: SavedPoi[]) => {
    const ids = pois.map((p) => p.poi_id)
    const n = ids.filter((id) => picked.includes(id)).length
    return (
      <section key={title} className="flex flex-col">
        <Checkbox
          className={row}
          checked={n === ids.length && n > 0}
          indeterminate={n > 0 && n < ids.length}
          onChange={() => toggleGroup(ids)}
          label={<>
            <Folder aria-hidden className="size-[var(--icon-size-md)] shrink-0 text-ui-fg-muted" />
            <span className="flex min-w-0 flex-col gap-[var(--space-0-5)]"><span className="truncate">{title}</span><span className="type-body-caption text-ui-fg-muted">{n === ids.length ? t('CD1587', { n }) : t('CD1586', { n, m: ids.length })}</span></span>
          </>}
        />
        <ul>
          {pois.map((p) => (
            <li key={p.poi_id}>
              <Checkbox
                className={row}
                checked={picked.includes(p.poi_id)}
                disabled={!picked.includes(p.poi_id) && picked.length >= LIMIT}
                onChange={() => toggle(p.poi_id)}
                label={<>
                  <Image ratio="1:1" src={p.primary_image_url} alt="" sizes="48px" className="size-[var(--space-12)] shrink-0" />
                  <span className="flex min-w-0 flex-col gap-[var(--space-0-5)]"><span className="truncate text-ui-fg">{poiName(p, locale)}</span><span className="type-body-caption text-ui-fg-muted">{p.display_region}</span></span>
                </>}
              />
            </li>
          ))}
        </ul>
      </section>
    )
  }
  return (
    <V2Page bar={{ type: 'page', title: t('CD1363') }} noFooter bleed>
      {/* Phones use the Page top bar; desktop the Flow bar. */}
      <div className="sticky top-0 z-30 hidden h-[var(--layout-header-height)] items-center justify-between bg-ui-bg pl-[var(--space-6)] pr-[var(--space-3)] lg:flex">
        <IntlLink href="/" className="inline-flex focus-visible:shadow-focus-ring focus-visible:outline-none"><Logo label="B4K" className="h-[var(--space-6)] w-auto" /></IntlLink>
        <IconButton label={k('saved.folder.cancel')} icon={<X />} onClick={() => router.back()} />
      </div>
      <div className="mx-auto flex w-full max-w-[calc(640px+var(--space-8))] flex-col gap-[var(--space-4)] px-[var(--space-4)] pb-[calc(var(--space-24))] pt-[var(--space-4)] lg:pt-[var(--space-8)]">
        {/* Figma: a short subtitle on phones, the longer one on desktop. */}
        <SectionHeader title={t('CD1584')} subtitle={phone ? t('CD1585') : t('CD1638')} />
        {!user ? <SignedOutPrompt title={t('CD1577')} text={t('CD1578')} /> : null}
        {isLoading ? <Skeleton className="h-[240px]" /> : null}
        <div>
          {folders.map((f) => group(f.name, f.pois))}
          {loose.length ? group(k('saved.tabs.places'), loose) : null}
        </div>
      </div>
      <div data-toast-floor className="fixed inset-x-0 bottom-0 z-30 border-t border-ui-border bg-ui-bg-raised pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-[calc(640px+var(--space-8))] items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-4)]">
          <span aria-live="polite" className="sr-only">{picked.length === all.length && all.length ? t('CD1587', { n: all.length }) : t('CD1586', { n: picked.length, m: Math.min(all.length, LIMIT) })}</span>
          <Button variant="secondary" className="max-lg:hidden" onClick={() => router.back()}>{k('saved.folder.cancel')}</Button>
          <Button disabled={!picked.length} loading={busy} onClick={make} className="max-lg:w-full">{t('CD1588', { n: picked.length })}</Button>
        </div>
      </div>
    </V2Page>
  )
}

function ListCover({ name, photos }: { name: string; photos: string[] }) {
  return (
    <span aria-hidden className={cn('relative block w-full overflow-hidden bg-ui-state-selected', photos.length >= 4 ? 'aspect-[2/1]' : 'aspect-[4/3]')}>
      {photos.length >= 4 ? (
        <span className="grid size-full grid-cols-2 grid-rows-2 gap-[var(--space-0-5)] bg-ui-bg">
          {photos.slice(0, 4).map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="size-full object-cover" />
          ))}
        </span>
      ) : photos.length ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photos[0]} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-end p-[var(--space-3)] type-display-h4 text-ui-fg line-clamp-3">{name}</span>
      )}
    </span>
  )
}
