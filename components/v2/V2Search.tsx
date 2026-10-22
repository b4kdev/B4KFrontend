'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import useSWR from 'swr'
import { usePathname, useRouter } from '@/i18n/navigation'
import { SearchInput, SearchSuggestions } from '@/components/library'
import { useCd } from './cd'

// Search field and suggestions: the desktop Header field with its suggestions
// dropdown on every page, and the phone Search screen's field. Recent searches stay on the device.

const jsonFetch = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
const RECENT_KEY = 'b4k-v2-recent-searches'

export function useRecent() {
  const [recent, setRecent] = useState<string[]>([])
  const load = () => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'))
    } catch {}
  }
  useEffect(load, [])
  const save = (next: string[]) => {
    setRecent(next)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {}
  }
  return {
    recent,
    load,
    add: (q: string) => save([q, ...recent.filter((r) => r !== q)].slice(0, 8)),
    remove: (q: string) => save(recent.filter((r) => r !== q)),
    clear: () => save([]),
  }
}

const CATEGORIES = [['k-pop', 'CD1247'], ['k-drama', 'CD1246'], ['k-beauty', 'CD1244'], ['k-culture', 'CD1245'], ['k-food', 'CD0251']]

/** The field's text, the suggestions open or not, and the suggestions card for it. */
export function useSearchBox({ viewport, initial = '', open: startOpen = false }: { viewport: 'desktop' | 'mobile'; initial?: string; open?: boolean }) {
  const t = useCd()
  const locale = useLocale()
  const router = useRouter()
  const recents = useRecent()
  const [draft, setDraft] = useState(initial)
  const [open, setOpen] = useState(startOpen)
  useEffect(() => setDraft(initial), [initial])
  // Another tab or field may have added a search since: read the list again on open.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) recents.load() }, [open])
  const { data: sugg } = useSWR<{ suggestions: string[] }>(open && draft.trim().length >= 2 ? `/api/search/suggestions?q=${encodeURIComponent(draft)}&lang=${locale}` : null, jsonFetch)
  const go = (text: string) => {
    if (!text.trim()) return
    recents.add(text.trim())
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(text.trim())}`)
  }
  const suggestions = (
    <SearchSuggestions
      viewport={viewport}
      state={draft.trim() ? 'typing' : 'empty'}
      query={draft}
      onSearch={go}
      places={(sugg?.suggestions ?? []).slice(0, 3).map((s, i) => ({ id: `s${i}`, name: s, meta: '', href: `/search?q=${encodeURIComponent(s)}` }))}
      recent={recents.recent.map((r) => ({ id: r, text: r }))}
      onRemoveRecent={recents.remove}
      onClearRecent={recents.clear}
      trending={[['K-Pop', 'CD1247'], ['K-Drama', 'CD1246'], ['K-Beauty', 'CD1244']].map(([id, cd]) => ({ id, text: t(cd) }))}
      categories={CATEGORIES.map(([id, cd]) => ({ id, name: t(cd), href: `/explore/${id}` }))}
      labels={{ searchFor: (x) => `${t('CD1317')}: “${x}”`, places: t('CD1316'), plans: t('CD1300'), explore: t('CD1299'), recent: t('CD1297'), clearAll: t('CD1248'), trending: t('CD0313'), browse: t('CD1299'), remove: (x) => t('CD1298', { query: x }) }}
    />
  )
  return { draft, setDraft, open, setOpen, go, suggestions }
}

/** Desktop Header search: the field holds the current query; focus opens the suggestions under it. */
export function V2HeaderSearch({ label }: { label: string }) {
  const t = useCd()
  const pathname = usePathname()
  const q = useSearchParams()?.get('q') ?? ''
  const box = useSearchBox({ viewport: 'desktop', initial: pathname === '/search' ? q : '' })
  const wrap = useRef<HTMLDivElement>(null)
  const listId = useId()
  const { setOpen } = box
  useEffect(() => setOpen(false), [pathname, setOpen])
  useEffect(() => {
    if (!box.open) return
    const away = (e: MouseEvent | FocusEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', away)
    document.addEventListener('focusin', away)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('focusin', away)
    }
  }, [box.open, setOpen])
  return (
    <div ref={wrap} className="relative">
      <SearchInput
        label={label}
        placeholder={label}
        value={box.draft}
        role="combobox"
        aria-expanded={box.open}
        aria-controls={listId}
        aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onChange={(e) => { box.setDraft(e.target.value); setOpen(true) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') box.go(box.draft)
          if (e.key === 'Escape') setOpen(false)
        }}
        onClear={() => box.setDraft('')}
        clearLabel={t('CD1248')}
        size="md"
      />
      {box.open ? <div id={listId} className="absolute left-0 top-full z-50 mt-[var(--space-2)]">{box.suggestions}</div> : null}
    </div>
  )
}
