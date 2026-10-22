'use client'

import { useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft, Bookmark, Ellipsis, Map as MapIcon, Pencil, Share2, Trash2, Lock } from 'lucide-react'
import { Link as IntlLink, useRouter } from '@/i18n/navigation'
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  DropdownMenu,
  EmptyState,
  IconButton,
  Image,
  ListItem,
  MenuGroup,
  MenuItem,
  Modal,
  Skeleton,
  Tabs,
  TextInput,
} from '@/components/library'
import { useAuth } from '@/contexts/AuthContext'
import { saveCourseHandoff } from '@/lib/quickplan'
import type { SavedData, SavedPoi } from '@/app/api/saved/route'
import { useCd, useCdKey } from '../cd'
import { V2Page } from '../V2Page'
import { useV2Shell } from '../V2Shell'
import { jsonFetch } from './A2Home'

// Saved (SCR-016, PD-48, PD-31) and Plan from saved places (SCR-035, PD-33, PD-30, PD-45).
// Live /api/saved, /api/folders, /api/plans, /api/profile/trips.

const send = (url: string, method: string, body?: unknown) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json().catch(() => ({}))
  })

const poiName = (p: SavedPoi, locale: string) => (locale === 'ko' ? p.name_ko : p.name_en || p.name_ko)

export function SignedOutPrompt({ title, text }: { title: string; text: string }) {
  const t = useCd()
  const { requireSignIn } = useV2Shell()
  // Sign in opens the gate; Google returns to this page, and the page fills in once signed in.
  return (
    <EmptyState
      container="bordered"
      title={title}
      action={<Button size="lg" onClick={() => requireSignIn({ title, run: () => {} })}>{t('CD0050')}</Button>}
    >
      {text}
    </EmptyState>
  )
}

/** Name sheet for New folder and Rename folder (one sheet like Save plan, PD-48 update). */
function FolderNameSheet({ open, mode, initial, onClose, onSave }: { open: boolean; mode: 'new' | 'rename'; initial?: string; onClose: () => void; onSave: (name: string) => Promise<void> }) {
  const t = useCd()
  const k = useCdKey()
  const [name, setName] = useState(initial ?? '')
  const [busy, setBusy] = useState(false)
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={mode === 'new' ? t('CD1206') : k('saved.folder.renameTitle')}
      closeLabel={k('badges.detail.close')}
      secondaryAction={<Button variant="ghost" onClick={onClose}>{k('saved.folder.cancel')}</Button>}
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
      <div className="flex flex-col gap-[var(--space-4)] pb-[var(--space-2)]">
        <p className="type-body-base text-ui-fg-muted">{mode === 'new' ? t('CD1611') : t('CD1614')}</p>
        <TextInput label={k('saved.folder.newFolderPlaceholder')} showLabel placeholder={t('CD1612')} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} data-autofocus />
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

  const tabs = [
    { id: 'places', label: k('saved.tabs.places') },
    { id: 'my-plans', label: k('saved.tabs.myPlans') },
    { id: 'saved-plans', label: k('saved.tabs.savedPlans') },
  ]
  // Figma 247:445: Saved is a top-level destination (phone bar with Menu and search), title as a
  // section header on every width, then Tabs, then the Places toolbar (New list, Plan from Saved).
  const head = <h1 className="type-display-h3">{k('saved.title')}</h1>
  const toolbar = (
    <div className="flex items-center justify-between gap-[var(--space-4)]">
      <Button variant="ghost" size="md" onClick={() => setSheet({ mode: 'new' })}>{t('CD1206')}</Button>
      <IntlLink href="/saved/plan" aria-disabled={!data?.pois.length} className="inline-flex h-[var(--control-height-md)] items-center gap-[var(--gap-sm)] bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse aria-disabled:pointer-events-none aria-disabled:bg-ui-bg-disabled aria-disabled:text-ui-fg-disabled">
        {t('CD1363')}
      </IntlLink>
    </div>
  )

  if (!user) {
    return (
      <V2Page>
        <div className="flex flex-col gap-[var(--space-4)]">{head}<SignedOutPrompt title={t('CD1577')} text={t('CD1581')} /></div>
      </V2Page>
    )
  }

  const placesView = folder ? (
    <div className="flex flex-col gap-[var(--space-4)]">
      <div className="flex items-center gap-[var(--space-2)]">
        <IconButton label={k('saved.folder.back')} icon={<ArrowLeft />} onClick={() => setFolderId(null)} />
        <h2 className="flex-1 type-display-h3">{folder.name}</h2>
        <IntlLink href={`/map?saved=1&folder=${folder.id}`} className="inline-flex items-center gap-[var(--space-1-5)] type-label-button text-ui-link hover:text-ui-link-hover"><MapIcon aria-hidden className="size-[var(--icon-size-sm)]" />{k('saved.folder.viewOnMap')}</IntlLink>
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
      <ul className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-4">
        {folder.pois.map((p) => (
          <li key={p.poi_id}><Card type="place" href={`/map?poi=${p.poi_id}`} title={poiName(p, locale)} imageSrc={p.primary_image_url} meta={p.display_region} /></li>
        ))}
      </ul>
    </div>
  ) : data && !data.pois.length ? (
    <EmptyState icon={<Bookmark />} title={k('saved.empty.places.title')} className="flex-1" action={<IntlLink href="/map" className="inline-flex h-[var(--control-height-md)] items-center bg-ui-bg-inverse px-[var(--button-padding-x)] type-label-button text-ui-fg-inverse">{k('saved.empty.places.cta')}</IntlLink>}>{t('CD1429')}</EmptyState>
  ) : (
    <div className="flex flex-col gap-[var(--space-4)]">
      <ul className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-4">
        {data?.folders.map((f) => (
          <li key={f.id}>
            <button type="button" onClick={() => setFolderId(f.id)} aria-label={k('saved.folder.openAriaLabel', { name: f.name })} className="block w-full text-left focus-visible:shadow-focus-ring focus-visible:outline-none">
              <span className="flex flex-col bg-ui-bg-raised hover:bg-[image:linear-gradient(var(--color-state-hover),var(--color-state-hover))]">
                <ListCover name={f.name} photos={f.pois.map((p) => p.primary_image_url).filter((u): u is string => !!u)} />
                <span className="flex flex-col gap-[var(--space-1)] p-[var(--space-3)]">
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
          // Figma 248:943: status in the second line ("5 stops · 2 days · Public", "Draft · 3 stops").
          secondary={p.is_draft
            ? `${k('saved.myPlan.draft')} · ${k('saved.plan.stops', { count: p.stop_count })}`
            : `${k('saved.plan.stops', { count: p.stop_count })} · ${k('saved.plan.days', { count: p.duration_days })} · ${k('profile.settings.privacy.public')}`}
          leading={<Image ratio="1:1" src={p.cover_image_url} alt="" sizes="48px" className="size-[var(--space-12)]" />}
          href={`/plan/${p.id}`}
          renderLink={({ href, className, children }) => (
            <div className="flex items-center">
              <IntlLink href={href} className={`${className} flex-1`}>{children}</IntlLink>
              <DropdownMenu label={p.title} align="end" trigger={<IconButton label={k('saved.myPlan.ariaLabel', { title: p.title })} icon={<Ellipsis />} className="mr-[var(--space-2)]" />}>
                <MenuGroup>
                  <MenuItem icon={<Pencil />} onClick={() => router.push(`/map?plan=edit&id=${p.id}`)}>{k('saved.myPlan.edit')}</MenuItem>
                  <MenuItem icon={<Share2 />} onClick={() => { navigator.clipboard?.writeText(`${location.origin}/${locale}/plan/${p.id}`); toast({ type: 'success', message: k('profile.trips.card.shareCopiedToast') }) }}>{k('saved.myPlan.share')}</MenuItem>
                  {!p.is_draft ? (
                    <MenuItem icon={<Lock />} onClick={async () => { await send(`/api/plans/${p.id}`, 'PATCH', { is_published: false }).catch(() => {}); mutate() }}>{k('profile.settings.privacy.private')}</MenuItem>
                  ) : null}
                </MenuGroup>
                <MenuGroup>
                  <MenuItem icon={<Trash2 />} variant="danger" onClick={() => setDel({ kind: 'plan', id: p.id, name: p.title })}>{k('saved.myPlan.delete')}</MenuItem>
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
    <ul className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-4">
      {data.plans.map((p) => (
        <li key={p.id}><Card type="plan" href={`/plan/${p.id}`} title={p.title} imageSrc={p.cover_image_url} author={p.author_name} saves={String(p.saves_count)} stops={k('saved.plan.stops', { count: p.stop_count })} /></li>
      ))}
    </ul>
  ) : (
    <EmptyState container="bordered" title={k('saved.empty.savedPlans.title')}>{k('saved.empty.savedPlans.desc')}</EmptyState>
  )

  return (
    <V2Page className="flex flex-col">
      <div className="flex flex-1 flex-col gap-[var(--space-4)]">
        {head}
        <Tabs label={k('saved.tabs.ariaLabel')} value={tab} onValueChange={(v) => { setTab(v); setFolderId(null) }} tabs={tabs} className="self-start" />
        {tab === 'places' && !folder ? toolbar : null}
        {isLoading ? <div aria-busy className="grid grid-cols-2 gap-[var(--space-4)] lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div> : null}
        {error ? <EmptyState type="error" container="bordered" title={k('saved.error.title')} action={<Button size="md" variant="secondary" onClick={() => mutate()}>{k('saved.error.retry')}</Button>} /> : null}
        {data ? (tab === 'places' ? placesView : tab === 'my-plans' ? myPlans : savedPlans) : null}
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
        cancel={<Button variant="ghost" data-autofocus onClick={() => setDel(null)}>{k('saved.confirmDelete.cancel')}</Button>}
        confirm={
          <Button
            variant="danger"
            onClick={async () => {
              if (!del) return
              await (del.kind === 'folder' ? send(`/api/folders/${del.id}`, 'DELETE') : send(`/api/profile/trips?id=${del.id}`, 'DELETE')).catch(() => {})
              setDel(null)
              setFolderId(null)
              mutate()
            }}
          >
            {k('saved.confirmDelete.confirm')}
          </Button>
        }
      />
    </V2Page>
  )
}

// ── Plan from saved places (SCR-035) ─────────────────────────────────────────

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
  const [picked, setPicked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const folders = useMemo(() => (data?.folders ?? []).filter((f) => !f.is_default && f.pois.length), [data])
  const loose = useMemo(() => {
    const inFolders = new Set(folders.flatMap((f) => f.pois.map((p) => p.poi_id)))
    return (data?.pois ?? []).filter((p) => !inFolders.has(p.poi_id))
  }, [data, folders])
  const all = data?.pois ?? []
  const toggle = (id: string) =>
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id)
      if (p.length >= LIMIT) {
        toast({ type: 'warning', message: t('CD1589') })
        return p
      }
      return [...p, id]
    })
  const toggleGroup = (ids: string[]) => {
    const every = ids.every((id) => picked.includes(id))
    setPicked((p) => (every ? p.filter((x) => !ids.includes(x)) : Array.from(new Set([...p, ...ids])).slice(0, LIMIT)))
  }
  const make = () => {
    setBusy(true)
    const chosen = all.filter((p) => picked.includes(p.poi_id))
    saveCourseHandoff(
      chosen.map((p, i) => ({ poi_id: p.poi_id, name_ko: p.name_ko, name_preferred: poiName(p, locale), coords_lat: p.coords_lat, coords_lng: p.coords_lng, display_region: p.display_region, primary_image_url: p.primary_image_url ?? undefined, day: Math.floor(i / PER_DAY) + 1 })),
    )
    router.push('/map?from=saved')
  }
  const group = (title: string, pois: SavedPoi[]) => {
    const ids = pois.map((p) => p.poi_id)
    const n = ids.filter((id) => picked.includes(id)).length
    return (
      <section key={title} className="flex flex-col">
        <div className="border-b border-ui-border px-[var(--space-4)]">
          <Checkbox label={<span className="type-title-card">{title}</span>} checked={n === ids.length && n > 0} indeterminate={n > 0 && n < ids.length} onChange={() => toggleGroup(ids)} />
        </div>
        <ul>
          {pois.map((p) => (
            <li key={p.poi_id} className="border-b border-ui-border-subtle px-[var(--space-4)]">
              <Checkbox label={<span className="flex flex-col"><span>{poiName(p, locale)}</span><span className="type-body-caption text-ui-fg-muted">{p.display_region}</span></span>} checked={picked.includes(p.poi_id)} disabled={!picked.includes(p.poi_id) && picked.length >= LIMIT} onChange={() => toggle(p.poi_id)} className="w-full" />
            </li>
          ))}
        </ul>
      </section>
    )
  }
  return (
    <V2Page bar={{ type: 'page', title: t('CD1363') }} noFooter>
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-[var(--space-6)] pb-[calc(var(--space-24))]">
        <header className="flex flex-col gap-[var(--space-2)]">
          <h1 className="type-display-h2">{t('CD1584')}</h1>
          <p className="type-body-base text-ui-fg-muted">{t('CD1638')}</p>
        </header>
        {!user ? <SignedOutPrompt title={t('CD1577')} text={t('CD1578')} /> : null}
        {isLoading ? <Skeleton className="h-[240px]" /> : null}
        {folders.map((f) => group(f.name, f.pois))}
        {loose.length ? group(k('saved.tabs.places'), loose) : null}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ui-border bg-ui-bg-raised pb-[env(safe-area-inset-bottom)] lg:left-[var(--layout-nav-rail)]">
        <div className="mx-auto flex max-w-[640px] items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)]">
          <span aria-live="polite" className="flex-1 type-body-label">{picked.length === all.length && all.length ? t('CD1587', { n: all.length }) : t('CD1586', { n: picked.length, m: Math.min(all.length, LIMIT) })}</span>
          <Button variant="ghost" size="md" onClick={() => router.back()}>{k('saved.folder.cancel')}</Button>
          <Button size="md" disabled={!picked.length} loading={busy} onClick={make}>{t('CD1588', { n: picked.length })}</Button>
        </div>
      </div>
    </V2Page>
  )
}

/** List card cover: 4 or more photos = 2 by 2 mosaic; 1 to 3 = the first photo full size; none = the list name as a typographic cover. */
function ListCover({ name, photos }: { name: string; photos: string[] }) {
  return (
    <span aria-hidden className="relative block aspect-[4/3] w-full overflow-hidden bg-ui-state-selected">
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
