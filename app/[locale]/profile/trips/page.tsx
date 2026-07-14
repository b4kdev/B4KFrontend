'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  Map, Heart, Bookmark, Edit2, Trash2, RefreshCw, Share2,
  Route, Zap, AlertTriangle,
} from 'lucide-react'
import { useProfileTrips } from '@/hooks/useProfileTrips'
import { useToast } from '@/contexts/ToastContext'
import type { ProfileTrip } from '@/app/api/profile/trips/route'

function TripCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden animate-pulse" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
      <div className="aspect-video bg-muted-3" />
      <div className="p-sp-4 space-y-sp-2">
        <div className="h-4 w-3/4 rounded bg-muted-3" />
        <div className="h-3 w-1/2 rounded bg-muted-3" />
      </div>
    </div>
  )
}

function DeleteModal({
  title,
  onConfirm,
  onCancel,
  t,
}: {
  title: string
  onConfirm: () => void
  onCancel: () => void
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-sp-4"
      style={{ background: 'var(--backdrop-50)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('trips.deleteModal.ariaLabel')}
    >
      <div
        className="w-full max-w-[360px] rounded-xl p-sp-6 flex flex-col gap-sp-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      >
        <div className="flex items-start gap-sp-3">
          <AlertTriangle size={20} strokeWidth={2} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-f-lg font-semibold text-fg">{t('trips.deleteModal.title')}</p>
            <p className="text-f-md text-muted mt-1">{t('trips.deleteModal.desc', { title })}</p>
          </div>
        </div>
        <div className="flex gap-sp-3 mt-sp-2">
          <button
            onClick={onCancel}
            className="flex-1 min-h-touch rounded-lg text-f-md font-semibold text-muted hover:text-fg transition-colors"
            style={{ border: '1px solid var(--bdr)' }}
          >
            {t('trips.deleteModal.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 min-h-touch rounded-lg text-f-md font-semibold bg-danger text-bg hover:opacity-90 transition-opacity"
          >
            {t('trips.deleteModal.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

function TripCard({
  trip,
  onDelete,
  onShare,
  t,
}: {
  trip: ProfileTrip
  onDelete: (id: string) => void
  onShare: (trip: ProfileTrip) => void
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <article
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
    >
      {/* Thumbnail — PR_10 */}
      <div
        className="aspect-video flex items-center justify-center"
        style={{ background: 'var(--bg-3)' }}
        aria-label={t('trips.card.thumbnailAlt', { title: trip.title })}
      >
        {trip.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trip.thumbnail_url}
            alt={t('trips.card.thumbnailAlt', { title: trip.title })}
            className="w-full h-full object-cover"
          />
        ) : (
          <Route size={28} strokeWidth={2} className="text-muted-2" />
        )}
      </div>

      <div className="p-sp-4 flex flex-col gap-sp-3 flex-1">
        {/* Title + draft badge — PR_11 */}
        <div className="flex items-start gap-sp-2">
          <h2 className="text-f-base font-semibold text-fg leading-snug line-clamp-2 flex-1">
            {trip.title}
          </h2>
          {!trip.is_published && (
            <span
              className="shrink-0 text-f-xxs font-bold uppercase tracking-widest px-sp-2 py-0.5 rounded-full text-warning"
              style={{ background: 'color-mix(in srgb, var(--warning) 12%, transparent)' }}
            >
              {t('trips.card.draft')}
            </span>
          )}
        </div>

        {/* Stats — PR_12 (published only) */}
        {trip.is_published && (
          <div className="flex items-center gap-sp-3 text-f-sm text-muted">
            <span className="flex items-center gap-1">
              <Heart size={12} strokeWidth={2} className="text-danger" />
              {trip.like_count} {t('trips.card.likes')}
            </span>
            <span className="flex items-center gap-1">
              <Bookmark size={12} strokeWidth={2} className="text-lav" />
              {trip.save_count} {t('trips.card.saves')}
            </span>
          </div>
        )}

        {/* Actions — PR_13 + PR_14 */}
        <div className="flex gap-sp-2 mt-auto pt-sp-1">
          <Link
            href={`/map?plan=${trip.id}`}
            className="flex-1 min-h-touch flex items-center justify-center gap-1.5 rounded-lg text-f-sm font-semibold text-lav transition-colors hover:bg-lav-dim"
            style={{ border: '1px solid var(--lav-border)' }}
            aria-label={t('trips.card.editAria', { title: trip.title })}
          >
            <Edit2 size={14} strokeWidth={2} />
            {t('trips.card.edit')}
          </Link>
          {/* UF-14 (G10.3) — share, mirroring IT_01's share behavior */}
          <button
            onClick={() => onShare(trip)}
            className="min-h-touch min-w-touch flex items-center justify-center rounded-lg text-muted hover:text-fg transition-colors"
            style={{ border: '1px solid var(--bdr)' }}
            aria-label={t('trips.card.shareAria', { title: trip.title })}
          >
            <Share2 size={15} strokeWidth={2} />
          </button>
          <button
            onClick={() => onDelete(trip.id)}
            className="min-h-touch min-w-touch flex items-center justify-center rounded-lg text-muted hover:text-danger transition-colors"
            style={{ border: '1px solid var(--bdr)' }}
            aria-label={t('trips.card.deleteAria', { title: trip.title })}
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  )
}

export default function TripsPage() {
  const t = useTranslations('profile')
  const { showToast } = useToast()
  const { data: trips, isLoading, error, mutate } = useProfileTrips()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/profile/trips?id=${deleteId}`, { method: 'DELETE' })
    mutate()
    setDeleteId(null)
  }

  // UF-14 (G10.3) — share a trip card, mirroring IT_01's native-share-then-clipboard fallback
  const handleShare = async (trip: ProfileTrip) => {
    const url = new URL(`/plan/${trip.id}`, window.location.origin)
    url.searchParams.set('ref', 'share')
    const shareUrl = url.toString()

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: trip.title, url: shareUrl })
        return
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return
      }
    }
    await navigator.clipboard.writeText(shareUrl).catch(() => {})
    showToast(t('trips.card.shareCopiedToast'))
  }

  const tripToDelete = trips?.find((t) => t.id === deleteId)

  return (
    <>
      {/* Loading — 4 states [2] */}
      {isLoading && (
        <div
          className="grid gap-sp-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
          aria-busy="true"
          aria-label={t('trips.loading')}
        >
          {Array.from({ length: 3 }).map((_, i) => <TripCardSkeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="flex flex-col items-center gap-sp-4 py-sp-16 text-center"
          role="alert"
        >
          <AlertTriangle size={36} strokeWidth={2} className="text-danger" />
          <p className="text-f-lg font-semibold text-fg">{t('trips.error.title')}</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-sp-2 min-h-touch px-sp-5 rounded-lg text-f-md font-semibold text-lav"
            style={{ border: '1px solid var(--lav-border)' }}
          >
            <RefreshCw size={14} strokeWidth={2} />
            {t('trips.error.cta')}
          </button>
        </div>
      )}

      {/* Empty — PR_16 auto-gen nudge */}
      {!isLoading && !error && trips?.length === 0 && (
        <div className="flex flex-col items-center text-center py-sp-16 px-sp-4 gap-sp-6">
          <Route size={40} strokeWidth={2} className="text-muted-2" />
          <div>
            <p className="text-f-xl font-semibold text-fg mb-1">{t('trips.empty.title')}</p>
            <p className="text-f-md text-muted max-w-[280px]">{t('trips.empty.desc')}</p>
          </div>
          <Link
            href="/map"
            className="min-h-touch px-sp-6 flex items-center gap-sp-2 rounded-full text-f-md font-semibold text-fg"
            style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
          >
            <Map size={15} strokeWidth={2} />
            {t('trips.empty.cta')}
          </Link>

          {/* Auto-gen nudge — PR_16 */}
          <div
            className="w-full max-w-[400px] flex items-center justify-between gap-sp-4 p-sp-4 rounded-xl mt-sp-2"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--lav-border)' }}
          >
            <div className="flex items-center gap-sp-3">
              <Zap size={18} strokeWidth={2} className="text-lav shrink-0" />
              <p className="text-f-md text-fg text-left">{t('trips.nudge.title')}</p>
            </div>
            <Link
              href="/saved"
              className="shrink-0 text-f-sm font-bold text-lav hover:text-fg transition-colors whitespace-nowrap"
            >
              {t('trips.nudge.cta')}
            </Link>
          </div>
        </div>
      )}

      {/* Success — trip grid */}
      {!isLoading && !error && trips && trips.length > 0 && (
        <div
          className="grid gap-sp-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
        >
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onDelete={setDeleteId}
              onShare={handleShare}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Delete modal — PR_14 */}
      {deleteId && tripToDelete && (
        <DeleteModal
          title={tripToDelete.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          t={t}
        />
      )}
    </>
  )
}
