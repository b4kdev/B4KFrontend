'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import useSWR from 'swr'
import { MapPin } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { fetcher } from '@/lib/fetcher'
import { getDisplayName } from '@/lib/display-name'
import type { ProfileSavedPoi } from '@/app/api/profile/saved/route'

interface SavedResponse {
  items: ProfileSavedPoi[]
}

export default function ProfileSavedPage() {
  const t = useTranslations('profile')
  const { user } = useAuth()

  const { data, isLoading, error, mutate } = useSWR<SavedResponse>(
    user ? '/api/profile/saved' : null,
    fetcher
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-sp-3 p-sp-4" aria-busy="true" aria-label={t('saved.loading')}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-bg-3 rounded-none animate-pulse" />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center gap-sp-4 p-sp-8 text-center" role="alert">
        <MapPin size={32} strokeWidth={2} className="text-danger" aria-hidden="true" />
        <p className="text-muted text-f-base">{t('saved.error')}</p>
        <button
          onClick={() => mutate()}
          className="text-lav text-f-sm min-h-touch px-sp-4"
          style={{ border: '1px solid var(--lav-border)' }}
        >
          {t('saved.retry')}
        </button>
      </div>
    )
  }

  // Empty state
  if (!data?.items?.length) {
    return (
      <div className="flex flex-col items-center gap-sp-4 p-sp-10 text-center">
        <MapPin size={32} strokeWidth={2} className="text-muted" aria-hidden="true" />
        <p className="text-muted text-f-base">{t('saved.empty')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-sp-2 p-sp-4">
      {data.items.map((poi) => {
        const name = getDisplayName({ name_preferred: poi.name_preferred, name_en: poi.name_en, name_ko: poi.name_ko, id: poi.poi_id })
        return (
          <Link
            key={poi.poi_id}
            href={`/map?poi=${encodeURIComponent(poi.poi_id)}`}
            className="flex items-center gap-sp-3 p-sp-3 bg-bg-2 rounded-none hover:bg-bg-3 transition-colors min-h-touch"
            style={{ border: '1px solid var(--bdr)' }}
            aria-label={t('saved.openOnMapAria', { name })}
          >
            <MapPin size={16} strokeWidth={2} className="text-muted shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-fg text-f-base truncate">{name}</p>
              {poi.display_region && (
                <p className="text-muted text-f-xs truncate">{poi.display_region}</p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
