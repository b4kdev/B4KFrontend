'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/contexts/AuthContext'
import type { SavedData } from '@/app/api/saved/route'
import { useCd, useCdKey } from './cd'
import { useV2Shell } from './V2Shell'
import { usePendingAction } from './V2SignInGate'
import { useBadgeUnlock } from './badges'

const jsonFetch = <T,>(url: string) => fetch(url).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(r.status)))
const send = (url: string, method: string, body: unknown) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
  })

/**
 * Save and Like for place cards (Home, Explore): the Card `save` and `like` props for a place.
 * A guest gets the sign-in gate and the save or like is done after the sign-in. Pass
 * `resume` once per screen so an action kept across Google or the Consent step is finished there.
 * Save is set optimistically (as plans). Liked state is local: the backend has no "liked by me"
 * read for places yet.
 */
export function usePlaceActions({ resume = false }: { resume?: boolean } = {}) {
  const t = useCd()
  const k = useCdKey()
  const { user } = useAuth()
  const { toast, requireSignIn } = useV2Shell()
  const saved = useSWR<SavedData>(user ? '/api/saved' : null, jsonFetch)
  const unlock = useBadgeUnlock()
  // The tapped state shows at once; the old one comes back when the request fails.
  const [taps, setTaps] = useState<Map<string, boolean>>(new Map())
  const isSaved = (id: string) => taps.get(id) ?? (saved.data?.pois ?? []).some((p) => p.poi_id === id)
  const [liked, setLiked] = useState<Set<string>>(new Set())

  // on: saved before the tap. signedIn: the save a guest started, finished after the sign-in (its own toast).
  const setSave = async (id: string, on: boolean, signedIn = false) => {
    const tap = (next: boolean) => setTaps((m) => new Map(m).set(id, next))
    tap(!on)
    await send('/api/saved/poi', on ? 'DELETE' : 'POST', { poi_id: id })
      .then(() => {
        toast({ type: 'success', message: on ? k('map.poiDetail.removedSave') : signedIn ? t('CD1608') : k('map.poiDetail.savedToast') })
        if (!on) unlock()
      })
      .catch(() => {
        tap(on)
        toast({ type: 'critical', message: t('CD1426') })
      })
    saved.mutate()
  }
  const setLike = async (id: string, on: boolean) => {
    setLiked((s) => { const n = new Set(s); if (on) n.delete(id); else n.add(id); return n })
    await send('/api/likes/poi', on ? 'DELETE' : 'POST', { poi_id: id }).then(() => { if (!on) unlock() }).catch(() => {
      setLiked((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n })
      toast({ type: 'critical', message: t('CD0061') })
    })
  }
  usePendingAction('save_poi', resume && !!user, (id) => { if (id) setSave(id, false, true) })
  usePendingAction('like_poi', resume && !!user, (id) => { if (id) setLike(id, false) })

  return (id: string, name: string) => {
    const on = isSaved(id)
    const isLiked = liked.has(id)
    return {
      save: {
        saved: on,
        label: on ? k('explore.card.unsaveAria', { name }) : k('explore.card.saveAria', { name }),
        onSave: () => (user ? setSave(id, on) : requireSignIn({ title: t('CD0027'), pending: { type: 'save_poi', id }, run: () => setSave(id, false, true) })),
      },
      like: {
        liked: isLiked,
        label: isLiked ? k('explore.card.unlikeAria', { name }) : k('explore.card.likeAria', { name }),
        onLike: () => (user ? setLike(id, isLiked) : requireSignIn({ title: t('CD0054'), pending: { type: 'like_poi', id }, run: () => setLike(id, false) })),
      },
    }
  }
}

/**
 * Save for plan cards (Home, Explore, Saved plans, profiles): the Card `save` prop for a plan.
 * Same gate and resume rules as places; the saved state is read from /api/saved and set
 * optimistically, with the error toast and the old state back when the request fails.
 */
export function usePlanActions({ resume = false }: { resume?: boolean } = {}) {
  const t = useCd()
  const k = useCdKey()
  const { user } = useAuth()
  const { toast, requireSignIn } = useV2Shell()
  const saved = useSWR<SavedData>(user ? '/api/saved' : null, jsonFetch)
  const [taps, setTaps] = useState<Map<string, boolean>>(new Map())
  const unlock = useBadgeUnlock()
  const isSaved = (id: string) => taps.get(id) ?? (saved.data?.plans ?? []).some((p) => p.id === id)

  const setSave = (id: string, next: boolean, signedIn = false) => {
    const tap = (on: boolean) => setTaps((m) => new Map(m).set(id, on))
    tap(next)
    send('/api/saved/plan', next ? 'POST' : 'DELETE', { plan_id: id })
      .then(() => {
        toast({ type: 'success', message: next ? (signedIn ? t('CD1608') : k('itinerary.actions.savedToast')) : k('itinerary.actions.unsavedToast') })
        saved.mutate()
        if (next) unlock()
      })
      .catch(() => {
        tap(!next)
        toast({ type: 'critical', message: t('CD0061') })
      })
  }
  usePendingAction('save_plan', resume && !!user, (id) => { if (id) setSave(id, true, true) })

  return (id: string, title: string) => {
    const on = isSaved(id)
    return {
      saved: on,
      label: on ? k('explore.card.unsaveAria', { name: title }) : k('explore.card.saveAria', { name: title }),
      onSave: () => (user ? setSave(id, !on) : requireSignIn({ title: t('CD1541'), pending: { type: 'save_plan', id }, run: () => setSave(id, true, true) })),
    }
  }
}
