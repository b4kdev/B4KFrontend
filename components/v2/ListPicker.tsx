'use client'

import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ROW_DIVIDER } from '@/components/library/Lists'
import { Button, Image, Modal, TextInput } from '@/components/library'
import type { SavedData } from '@/app/api/saved/route'
import { httpError } from '@/lib/session-expired'
import { useCd, useCdKey } from './cd'

// Add to list and Move to list: one picker sheet listing the user's
// lists with + New list. Figma Saved: 'Add to list picker', 'Move to list picker'.

const jsonFetch = <T,>(url: string) => fetch(url).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(r.status)))
const send = (url: string, method: string, body?: unknown) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then((r) => {
    if (!r.ok) throw httpError(r.status)
    return r.json().catch(() => ({}))
  })

/** Name sheet for New folder and Rename folder (one sheet like Save plan). */
export function FolderNameSheet({ open, mode, initial, onClose, onSave }: { open: boolean; mode: 'new' | 'rename'; initial?: string; onClose: () => void; onSave: (name: string) => Promise<void> }) {
  const t = useCd()
  const k = useCdKey()
  const [name, setName] = useState(initial ?? '')
  const [busy, setBusy] = useState(false)
  const [empty, setEmpty] = useState(false)
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
          onClick={async () => {
            // Save stays enabled; an empty name is said on the field.
            if (!name.trim()) return setEmpty(true)
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
        <TextInput label={t('CD1207')} showLabel required help={`${name.length}/40`} placeholder={t('CD1612')} value={name} maxLength={40} onChange={(e) => { setName(e.target.value); setEmpty(false) }} error={empty ? t('CD1798') : undefined} data-autofocus />
      </div>
    </Modal>
  )
}

/** add: from the Save toast; move: from a saved place's menu. The title repeats the action that opened it. */
export type ListPickRequest = { poiId: string; mode: 'add' | 'move' }

type Toast = (t: { type?: 'info' | 'success' | 'warning' | 'critical'; message: string; action?: { label: string; onClick: () => void } }) => void

const ROW = cn(ROW_DIVIDER, 'b4k-press flex w-full min-h-[var(--target-touch-min)] items-center gap-[var(--space-3)] py-[var(--space-3)] text-left hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none')

/**
 * The picker: the user's own lists (All saved places is not one to pick; the list the place is in
 * now is left out), each with its first photo, then + New list. A pick puts the place in that list
 * (a place sits in one list; All saved places keeps every save) and the toast offers Undo, which
 * puts it back where it was.
 */
export function ListPicker({ request, onClose, toast }: { request: ListPickRequest | null; onClose: () => void; toast: Toast }) {
  const t = useCd()
  const k = useCdKey()
  const { mutate } = useSWRConfig()
  const { data } = useSWR<SavedData>(request ? '/api/saved' : null, jsonFetch)
  const [naming, setNaming] = useState(false)
  const poiId = request?.poiId
  const all = data?.folders.find((f) => f.is_default)
  const from = data?.folders.find((f) => !f.is_default && f.pois.some((p) => p.poi_id === poiId))
  const lists = (data?.folders ?? []).filter((f) => !f.is_default && f.id !== from?.id)
  // The fixed list is 'folder-000' until the BFF has made it; no folder_id then means Default.
  const folderBody = (id?: string) => (id && id !== 'folder-000' ? { folder_id: id } : {})
  const failed = () => toast({ type: 'critical', message: navigator.onLine === false ? t('CD1208') : t('CD0061') })

  const put = async (id: string, name: string) => {
    if (!poiId) return
    const back = from?.id ?? all?.id
    onClose()
    try {
      await send('/api/saved/poi', 'POST', { poi_id: poiId, ...folderBody(id) })
      toast({
        type: 'success',
        message: t('CD1907', { name }),
        action: { label: t('CD1428'), onClick: () => { send('/api/saved/poi', 'POST', { poi_id: poiId, ...folderBody(back) }).catch(failed).finally(() => mutate('/api/saved')) } },
      })
    } catch {
      failed()
    }
    mutate('/api/saved')
  }

  return (
    <>
      <Modal
        open={!!request && !naming}
        onClose={onClose}
        size="md"
        title={request?.mode === 'move' ? t('CD1906') : t('CD1905')}
        closeLabel={k('badges.detail.close')}
        secondaryAction={<Button variant="secondary" onClick={onClose}>{k('saved.folder.cancel')}</Button>}
      >
        <ul className="-my-[var(--space-3)]">
          {lists.map((f) => (
            <li key={f.id}>
              <button type="button" className={ROW} onClick={() => put(f.id, f.name)}>
                <Image ratio="1:1" src={f.pois.find((p) => p.primary_image_url)?.primary_image_url ?? null} alt="" sizes="80px" className="size-[var(--space-12)] shrink-0 rounded-sq-lg" />
                <span className="min-w-0 flex-1 truncate type-body-base text-ui-fg">{f.name}</span>
              </button>
            </li>
          ))}
          <li>
            <button type="button" className={cn(ROW, 'after:hidden')} onClick={() => setNaming(true)}>
              <span aria-hidden className="flex size-[var(--space-12)] shrink-0 items-center justify-center"><Plus className="size-[var(--icon-size-md)]" /></span>
              <span className="min-w-0 flex-1 truncate type-body-base text-ui-fg">{t('CD1206')}</span>
            </button>
          </li>
        </ul>
      </Modal>
      {/* + New list: name the list, then the place goes straight into it. */}
      <FolderNameSheet
        key={naming ? 'naming' : 'closed'}
        open={!!request && naming}
        mode="new"
        onClose={() => { setNaming(false); onClose() }}
        onSave={async (name) => {
          try {
            const res = (await send('/api/folders', 'POST', { name })) as { folder?: { id: string; name: string } }
            setNaming(false)
            if (res.folder) await put(res.folder.id, res.folder.name)
            else onClose()
          } catch {
            failed()
          }
        }}
      />
    </>
  )
}
