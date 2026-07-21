'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { User, MapPin, Bookmark, Award, RefreshCw, AlertTriangle } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthGate } from '@/contexts/AuthGateContext'
import type { ProfileData } from '@/app/api/profile/route'

const RARITY_STYLES: Record<string, { ring: string; icon: string }> = {
  common:    { ring: 'ring-1 ring-white/10',         icon: 'text-muted' },
  rare:      { ring: 'ring-1 ring-info/40',           icon: 'text-info' },
  epic:      { ring: 'ring-1 ring-lav-border',        icon: 'text-lav' },
  legendary: { ring: 'ring-1 ring-warning/50',        icon: 'text-warning' },
}

function HeaderSkeleton({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex items-start gap-sp-4 animate-pulse" aria-busy="true" aria-label={t('header.loading')}>
      <div className="w-[72px] h-[72px] rounded-full bg-muted-3 shrink-0" />
      <div className="flex-1 space-y-sp-2 pt-1">
        <div className="h-5 w-32 rounded bg-muted-3" />
        <div className="flex gap-sp-4 mt-sp-2">
          <div className="h-4 w-16 rounded bg-muted-3" />
          <div className="h-4 w-16 rounded bg-muted-3" />
          <div className="h-4 w-16 rounded bg-muted-3" />
        </div>
        <div className="flex gap-sp-2 mt-sp-3">
          <div className="w-8 h-8 rounded-full bg-muted-3" />
          <div className="w-8 h-8 rounded-full bg-muted-3" />
        </div>
      </div>
    </div>
  )
}

function HeaderError({ onRetry, t }: { onRetry: () => void; t: ReturnType<typeof useTranslations> }) {
  return (
    <div
      className="flex items-center gap-sp-3 p-sp-4 rounded-none text-danger"
      style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
      role="alert"
    >
      <AlertTriangle size={20} strokeWidth={2} className="shrink-0" />
      <span className="text-f-md flex-1">{t('header.errorTitle')}</span>
      <button
        onClick={onRetry}
        className="flex items-center gap-1 text-f-sm font-semibold text-lav hover:text-fg transition-colors min-h-touch px-sp-2"
        aria-label={t('header.errorRetry')}
      >
        <RefreshCw size={14} strokeWidth={2} />
        {t('header.errorRetry')}
      </button>
    </div>
  )
}

function HeaderContent({ profile, t }: { profile: ProfileData; t: ReturnType<typeof useTranslations> }) {
  const initial = profile.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="flex items-start gap-sp-4">
      {/* Avatar — PR_01 */}
      <div className="relative shrink-0">
        <div
          className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full flex items-center justify-center overflow-hidden"
          style={{ background: 'var(--lav-dim)', border: '2px solid var(--lav-border)' }}
          aria-label={t('header.avatarAlt', { name: profile.name })}
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={t('header.avatarAlt', { name: profile.name })}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-display text-lav text-2xl">{initial}</span>
          )}
        </div>
      </div>

      {/* Name + stats */}
      <div className="flex-1 min-w-0 pt-1">
        <h1 className="font-display text-fg text-f-display-tile leading-tight truncate">
          {profile.name}
        </h1>

        {/* Stats row — PR_05 + PR_06 · Trips · Saves · Badges (SPEC-09 header) */}
        <div className="flex items-center gap-sp-4 mt-sp-2" role="list" aria-label={t('header.statsLabel')}>
          <div
            role="listitem"
            className="flex items-center gap-1.5 text-f-md"
            aria-label={t('header.tripsCountAria', { count: profile.trips_count })}
          >
            <MapPin size={14} strokeWidth={2} className="text-lav shrink-0" />
            <span className="font-semibold text-fg">{profile.trips_count}</span>
            <span className="text-muted">{t('header.tripsLabel')}</span>
          </div>
          <div
            role="listitem"
            className="flex items-center gap-1.5 text-f-md"
            aria-label={t('header.savesCountAria', { count: profile.saves_count })}
          >
            <Bookmark size={14} strokeWidth={2} className="text-lav shrink-0" />
            <span className="font-semibold text-fg">{profile.saves_count}</span>
            <span className="text-muted">{t('header.savesLabel')}</span>
          </div>
          <div
            role="listitem"
            className="flex items-center gap-1.5 text-f-md"
            aria-label={t('header.badgesCountAria', { count: profile.badges_count })}
          >
            <Award size={14} strokeWidth={2} className="text-lav shrink-0" />
            <span className="font-semibold text-fg">{profile.badges_count}</span>
            <span className="text-muted">{t('header.badgesLabel')}</span>
          </div>
        </div>

        {/* Pinned badges — PR_08 */}
        {profile.pinned_badges.length > 0 && (
          <div
            className="flex items-center gap-sp-2 mt-sp-3"
            aria-label={t('header.pinnedBadgesLabel')}
          >
            {profile.pinned_badges.map((badge) => {
              const style = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common
              return (
                <div
                  key={badge.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center bg-bg-3 ${style.ring}`}
                  title={badge.name}
                  aria-label={badge.name}
                >
                  <User size={14} strokeWidth={2} className={style.icon} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('profile')
  const pathname = usePathname()
  const { data: profile, isLoading, error, mutate } = useProfile()
  const { user, loading: authLoading } = useAuth()
  const { open: openAuthGate } = useAuthGate()

  // SPEC-09: guest hitting /profile → auth gate (spec-vs-code gap, was missing entirely)
  useEffect(() => {
    if (!authLoading && !user) {
      openAuthGate('profile_nav')
    }
  }, [authLoading, user, openAuthGate])

  const TABS = [
    { href: '/profile',          label: t('tabs.trips') },
    { href: '/profile/saved',    label: t('tabs.saved') },
    { href: '/profile/badges',   label: t('tabs.badges') },
    { href: '/profile/settings', label: t('tabs.settings') },
  ]

  const segment = pathname.replace(/^\/[a-z-]+/, '')
  const tabActive = (href: string) => {
    if (href === '/profile') return segment === '/profile' || segment === ''
    return segment === href || segment.startsWith(`${href}/`)
  }

  return (
    <div
      className="max-w-[1200px] mx-auto px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-20"
      style={{ marginLeft: 'auto', marginRight: 'auto' }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg transition-colors">B4K</Link>
        <span>›</span>
        <span className="text-fg">{t('header.breadcrumb')}</span>
      </div>

      {/* Profile header — PR_01–08 */}
      <div className="mb-sp-6" aria-label={t('header.ariaLabel')}>
        {isLoading ? (
          <HeaderSkeleton t={t} />
        ) : error ? (
          <HeaderError onRetry={() => mutate()} t={t} />
        ) : profile ? (
          <HeaderContent profile={profile} t={t} />
        ) : null}
      </div>

      {/* Tab nav */}
      <nav
        className="flex gap-sp-1 mb-sp-6"
        style={{ borderBottom: 'var(--bdr)' }}
        aria-label={t('tabs.ariaLabel')}
      >
        {TABS.map(({ href, label }) => {
          const active = tabActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={[
                'px-sp-4 py-sp-3 text-f-md font-semibold tracking-[0.02em] transition-colors',
                'min-h-[44px] flex items-center rounded-none -mb-px',
                active
                  ? 'text-lav border-b-2 border-lav'
                  : 'text-muted hover:text-fg',
              ].join(' ')}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
