'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import useSWR from 'swr'
import { User } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { getDisplayName } from '@/lib/display-name'

interface OtherUserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  trips_public: boolean
  saved_public: boolean
  badges_public: boolean
}

interface ListResponse<T> {
  items: T[]
}

interface TripItem { id: string; title?: string | null }
interface PoiItem { place_id: string; name_preferred?: string | null; name_en?: string | null; name_ko?: string | null }
interface BadgeItem { badge_id: string; slug?: string | null }

type TabId = 'trips' | 'saved' | 'badges'

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

function TripsList({ userId, emptyLabel }: { userId: string; emptyLabel: string }) {
  const { data, isLoading } = useSWR<ListResponse<TripItem>>(
    `/api/profile/${userId}/trips`,
    fetcher
  )
  if (isLoading) return <ListSkeleton />
  if (!data?.items?.length) return <EmptyState message={emptyLabel} />
  return (
    <div className="flex flex-col gap-sp-2 p-sp-4">
      {data.items.map((trip) => (
        <div
          key={trip.id}
          className="p-sp-3 bg-bg-2 rounded-none text-fg text-f-base"
          style={{ border: '1px solid var(--bdr)' }}
        >
          {trip.title ?? '—'}
        </div>
      ))}
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

function BadgesList({ userId, emptyLabel }: { userId: string; emptyLabel: string }) {
  const { data, isLoading } = useSWR<ListResponse<BadgeItem>>(
    `/api/profile/${userId}/badges`,
    fetcher
  )
  if (isLoading) return <ListSkeleton />
  if (!data?.items?.length) return <EmptyState message={emptyLabel} />
  return (
    <div className="grid grid-cols-3 gap-sp-3 p-sp-4">
      {data.items.map((b) => (
        <div
          key={b.badge_id}
          className="aspect-square bg-bg-2 rounded-none flex items-center justify-center text-muted text-f-xs"
          style={{ border: '1px solid var(--bdr)' }}
        >
          {b.slug ?? b.badge_id}
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
      <div className="flex flex-col items-center gap-sp-4 p-sp-10 text-center max-w-2xl mx-auto" role="alert">
        <User size={32} strokeWidth={2} className="text-muted" aria-hidden="true" />
        <p className="text-muted text-f-base">{t('notFound')}</p>
      </div>
    )
  }

  const displayName = profile.display_name ?? t('anonymousUser')

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full">
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
        <div>
          <h1 className="text-fg text-f-xl font-semibold">{displayName}</h1>
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
