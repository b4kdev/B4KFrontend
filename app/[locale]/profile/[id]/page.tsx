'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import useSWR from 'swr'
import { Link } from '@/i18n/navigation'
import { User, MapPin, Bookmark, Award, Lock, Route } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { getDisplayName } from '@/lib/display-name'
import type { OtherUserTrip } from '@/app/api/profile/[id]/trips/route'
import type { OtherUserBadge } from '@/app/api/profile/[id]/badges/route'

interface OtherUserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  trips_count: number
  saves_count: number
  badges_count: number
  trips_public: boolean
  saved_public: boolean
  badges_public: boolean
}

interface ListResponse<T> {
  items: T[]
}

interface PoiItem { place_id: string; name_preferred?: string | null; name_en?: string | null; name_ko?: string | null }

type TabId = 'trips' | 'saved' | 'badges'

const RARITY_COLOR: Record<OtherUserBadge['rarity'], string> = {
  common: 'text-muted',
  rare: 'text-info',
  epic: 'text-lav',
  legendary: 'text-warning',
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-sp-2 p-sp-4" aria-busy="true">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 bg-bg-3 rounded-none animate-pulse" />
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center p-sp-10">
      <p className="text-muted text-f-base text-center">{message}</p>
    </div>
  )
}

function PrivateTabMessage({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-sp-3 p-sp-10 text-center">
      <p className="text-muted text-f-base">{label}</p>
    </div>
  )
}

/* M7 — trips link to /plan/:id (IT_01) + Save CTA per row (social.plan_saves) */
function TripsList({ userId, emptyLabel }: { userId: string; emptyLabel: string }) {
  const t = useTranslations('profile')
  const { data, isLoading, mutate } = useSWR<ListResponse<OtherUserTrip>>(
    `/api/profile/${userId}/trips`,
    fetcher
  )
  const [savedOverride, setSavedOverride] = useState<Record<string, boolean>>({})

  if (isLoading) return <ListSkeleton />
  if (!data?.items?.length) return <EmptyState message={emptyLabel} />

  const isSaved = (trip: OtherUserTrip) => savedOverride[trip.id] ?? trip.is_saved

  const toggleSave = async (trip: OtherUserTrip) => {
    const next = !isSaved(trip)
    setSavedOverride((prev) => ({ ...prev, [trip.id]: next }))
    try {
      await fetch('/api/saved/plan', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: trip.id }),
      })
      mutate()
    } catch {
      // Revert optimistic toggle on network failure
      setSavedOverride((prev) => ({ ...prev, [trip.id]: !next }))
    }
  }

  return (
    <div className="flex flex-col gap-sp-2 p-sp-4">
      {data.items.map((trip) => {
        const saved = isSaved(trip)
        return (
          <div
            key={trip.id}
            className="flex items-center gap-sp-3 p-sp-3 bg-bg-2 rounded-none"
            style={{ border: '1px solid var(--bdr)' }}
          >
            <Link
              href={`/plan/${trip.id}`}
              className="flex-1 min-w-0 min-h-touch flex flex-col justify-center gap-0.5 hover:opacity-80 transition-opacity"
              aria-label={t('otherTrips.openAria', { title: trip.title })}
            >
              <span className="text-fg text-f-base font-semibold truncate">{trip.title}</span>
              <span className="flex items-center gap-sp-3 text-f-sm text-muted">
                <span className="flex items-center gap-1">
                  <Route size={12} strokeWidth={2} aria-hidden="true" />
                  {t('otherTrips.stops', { count: trip.stop_count })}
                </span>
                <span>{t('otherTrips.days', { count: trip.day_count })}</span>
                <span className="flex items-center gap-1">
                  <Bookmark size={12} strokeWidth={2} aria-hidden="true" />
                  {trip.save_count}
                </span>
              </span>
            </Link>
            <button
              onClick={() => toggleSave(trip)}
              aria-pressed={saved}
              aria-label={saved
                ? t('otherTrips.unsaveAria', { title: trip.title })
                : t('otherTrips.saveAria', { title: trip.title })}
              className={[
                'shrink-0 min-h-touch px-sp-3 flex items-center gap-1.5 rounded-full text-f-sm font-semibold transition-colors',
                saved ? 'bg-lav-dim text-lav' : 'text-muted hover:text-fg',
              ].join(' ')}
              style={{ border: saved ? '1px solid var(--lav-border)' : '1px solid var(--bdr)' }}
            >
              <Bookmark size={14} strokeWidth={2} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
              {saved ? t('otherTrips.saved') : t('otherTrips.save')}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function SavedList({ userId, emptyLabel }: { userId: string; emptyLabel: string }) {
  const { data, isLoading } = useSWR<ListResponse<PoiItem>>(
    `/api/profile/${userId}/saved`,
    fetcher
  )
  if (isLoading) return <ListSkeleton />
  if (!data?.items?.length) return <EmptyState message={emptyLabel} />
  return (
    <div className="flex flex-col gap-sp-2 p-sp-4">
      {data.items.map((poi) => (
        <div
          key={poi.place_id}
          className="p-sp-3 bg-bg-2 rounded-none text-fg text-f-base"
          style={{ border: '1px solid var(--bdr)' }}
        >
          {getDisplayName({ name_preferred: poi.name_preferred, name_en: poi.name_en, name_ko: poi.name_ko, id: poi.place_id })}
        </div>
      ))}
    </div>
  )
}

/* M8 — full 12-slot badge grid: earned = colored, unearned = greyed + lock */
function BadgesList({ userId, emptyLabel }: { userId: string; emptyLabel: string }) {
  const t = useTranslations('profile')
  const { data, isLoading } = useSWR<ListResponse<OtherUserBadge>>(
    `/api/profile/${userId}/badges`,
    fetcher
  )
  if (isLoading) return <ListSkeleton />
  if (!data?.items?.length) return <EmptyState message={emptyLabel} />
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-sp-3 p-sp-4">
      {data.items.map((b) => (
        <div
          key={b.badge_id}
          className="aspect-square bg-bg-2 rounded-none flex flex-col items-center justify-center gap-sp-2 p-sp-2 text-center"
          style={{ border: '1px solid var(--bdr)', opacity: b.earned ? 1 : 0.45 }}
          aria-label={b.earned ? b.name : t('otherBadges.lockedAria', { name: b.name })}
        >
          {b.earned ? (
            <Award size={22} strokeWidth={2} className={RARITY_COLOR[b.rarity]} aria-hidden="true" />
          ) : (
            <Lock size={22} strokeWidth={2} className="text-muted" aria-hidden="true" />
          )}
          <span className={['text-f-xs font-semibold leading-tight', b.earned ? 'text-fg' : 'text-muted'].join(' ')}>
            {b.name}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function OtherUserProfilePage({ params }: { params: { id: string } }) {
  const t = useTranslations('profile')
  const [activeTab, setActiveTab] = useState<TabId>('trips')

  const { data: profile, isLoading, error } = useSWR<OtherUserProfile>(
    `/api/profile/${params.id}`,
    fetcher
  )

  const tabs: { id: TabId; label: string }[] = [
    { id: 'trips',  label: t('tabs.trips') },
    { id: 'saved',  label: t('tabs.saved') },
    { id: 'badges', label: t('tabs.badges') },
  ]

  if (isLoading) {
    return (
      <div className="flex flex-col gap-sp-4 p-sp-4 max-w-2xl mx-auto" aria-busy="true">
        <div className="flex items-center gap-sp-4">
          <div className="w-16 h-16 rounded-full bg-bg-3 animate-pulse" />
          <div className="flex flex-col gap-sp-2">
            <div className="h-4 w-32 bg-bg-3 rounded-none animate-pulse" />
            <div className="h-3 w-24 bg-bg-3 rounded-none animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center gap-sp-4 p-sp-10 text-center max-w-[720px] mx-auto" role="alert">
        <User size={32} strokeWidth={2} className="text-muted" aria-hidden="true" />
        <p className="text-muted text-f-base">{t('notFound')}</p>
      </div>
    )
  }

  const displayName = profile.display_name ?? t('anonymousUser')

  return (
    <div className="flex flex-col max-w-[720px] mx-auto w-full">
      {/* Header */}
      <div
        className="flex items-center gap-sp-4 p-sp-4"
        style={{ borderBottom: '1px solid var(--bdr)' }}
        aria-label={t('header.ariaLabel')}
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={t('avatarAlt', { name: displayName })}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-bg-3 flex items-center justify-center" aria-hidden="true">
            <User size={24} strokeWidth={2} className="text-muted" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-fg text-f-xl font-semibold truncate">{displayName}</h1>
          {/* Stats row — Trips · Saves · Badges (SPEC-09 header, read-only) */}
          <div className="flex items-center gap-sp-4 mt-sp-2" role="list" aria-label={t('header.statsLabel')}>
            <div
              role="listitem"
              className="flex items-center gap-1.5 text-f-sm"
              aria-label={t('header.tripsCountAria', { count: profile.trips_count })}
            >
              <MapPin size={13} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
              <span className="font-semibold text-fg">{profile.trips_count}</span>
              <span className="text-muted">{t('header.tripsLabel')}</span>
            </div>
            <div
              role="listitem"
              className="flex items-center gap-1.5 text-f-sm"
              aria-label={t('header.savesCountAria', { count: profile.saves_count })}
            >
              <Bookmark size={13} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
              <span className="font-semibold text-fg">{profile.saves_count}</span>
              <span className="text-muted">{t('header.savesLabel')}</span>
            </div>
            <div
              role="listitem"
              className="flex items-center gap-1.5 text-f-sm"
              aria-label={t('header.badgesCountAria', { count: profile.badges_count })}
            >
              <Award size={13} strokeWidth={2} className="text-lav shrink-0" aria-hidden="true" />
              <span className="font-semibold text-fg">{profile.badges_count}</span>
              <span className="text-muted">{t('header.badgesLabel')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex"
        role="tablist"
        aria-label={t('tabsLabel')}
        style={{ borderBottom: '1px solid var(--bdr)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex-1 min-h-touch text-f-sm font-semibold transition-colors',
              activeTab === tab.id ? 'text-lav' : 'text-muted hover:text-fg',
            ].join(' ')}
            style={activeTab === tab.id ? { borderBottom: '2px solid var(--lav)' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div role="tabpanel">
        {activeTab === 'trips' && (
          profile.trips_public === false
            ? <PrivateTabMessage label={t('privateTab')} />
            : <TripsList userId={params.id} emptyLabel={t('trips.empty.title')} />
        )}
        {activeTab === 'saved' && (
          profile.saved_public === false
            ? <PrivateTabMessage label={t('privateTab')} />
            : <SavedList userId={params.id} emptyLabel={t('saved.empty')} />
        )}
        {activeTab === 'badges' && (
          profile.badges_public === false
            ? <PrivateTabMessage label={t('privateTab')} />
            : <BadgesList userId={params.id} emptyLabel={t('badges.empty.title')} />
        )}
      </div>
    </div>
  )
}
