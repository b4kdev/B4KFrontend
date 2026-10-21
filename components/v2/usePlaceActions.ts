'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/contexts/AuthContext'
import type { SavedData } from '@/app/api/saved/route'
import { useCd, useCdKey } from './cd'
import { useV2Shell } from './V2Shell'
import { usePendingAction } from './V2SignInGate'

const jsonFetch = <T,>(url: string) => fetch(url).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(r.status)))
const send = (url: string, method: string, body: unknown) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
  })

/**
 * Save and Like for place cards (Home, Explore): the Card `save` and `like` props for a place.
 * A guest gets the sign-in gate and the save or like is done after the sign-in. Pass
 * `resume` once per screen so an action kept across Google or the Consent step is finished there.
 * Liked state is local: the backend has no "liked by me" read for places yet.
 */
export function usePlaceActions({ resume = false }: { resume?: boolean } = {}) {
  const t = useCd()
  const k = useCdKey()
  const { user } = useAuth()
  const { toast, requireSignIn } = useV2Shell()
  const saved = useSWR<SavedData>(user ? '/api/saved' : null, jsonFetch)
  const savedIds = new Set((saved.data?.pois ?? []).map((p) => p.poi_id))
  const [liked, setLiked] = useState<Set<string>>(new Set())

  const setSave = async (id: string, on: boolean) => {
    await send('/api/saved/poi', on ? 'DELETE' : 'POST', { poi_id: id })
      .then(() => toast({ type: 'success', message: on ? k('map.poiDetail.removedSave') : k('map.poiDetail.savedToast') }))
      .catch(() => toast({ type: 'critical', message: t('CD1426') }))
    saved.mutate()
  }
  const setLike = async (id: string, on: boolean) => {
    setLiked((s) => { const n = new Set(s); if (on) n.delete(id); else n.add(id); return n })
    await send('/api/likes/poi', on ? 'DELETE' : 'POST', { poi_id: id }).catch(() => {
      setLiked((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n })
    })
  }
  usePendingAction('save_poi', resume && !!user, (id) => { if (id) setSave(id, false) })
  usePendingAction('like_poi', resume && !!user, (id) => { if (id) setLike(id, false) })

  return (id: string, name: string) => {
    const isSaved = savedIds.has(id)
    const isLiked = liked.has(id)
    return {
      save: {
        saved: isSaved,
        label: isSaved ? k('explore.card.unsaveAria', { name }) : k('explore.card.saveAria', { name }),
        onSave: () => (user ? setSave(id, isSaved) : requireSignIn({ title: t('CD0027'), pending: { type: 'save_poi', id }, run: () => setSave(id, false) })),
      },
      like: {
        liked: isLiked,
        label: isLiked ? k('explore.card.unlikeAria', { name }) : k('explore.card.likeAria', { name }),
        onLike: () => (user ? setLike(id, isLiked) : requireSignIn({ title: t('CD0054'), pending: { type: 'like_poi', id }, run: () => setLike(id, false) })),
      },
    }
  }
}
