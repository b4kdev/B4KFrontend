'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from '@/i18n/navigation'
import useSWR from 'swr'
import { Route, X, ArrowRight } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import { getDraftPlan } from '@/lib/draft-plan'
import type { PlanDraft } from '@/app/api/plans/draft/route'

function relativeTime(iso: string, t: ReturnType<typeof useTranslations>): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return t('timeAgo.minutes', { n: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t('timeAgo.hours', { n: hrs })
  return t('timeAgo.days', { n: Math.floor(hrs / 24) })
}

// BLK-30: fixed-height placeholder so this section reserves space while auth /
// draft state resolves, instead of jumping from zero height straight to the
// full bar (the worst-case CLS pattern — this section is 'use client'-only,
// so nothing about draft state is knowable during SSR).
function ContinuePlanSkeleton() {
  return (
    <div
      className="mx-sp-4 lg:mx-sp-8 mt-sp-10 p-sp-4 flex items-center gap-sp-4 animate-pulse"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      aria-hidden="true"
    >
      <div className="w-10 h-10 rounded-full bg-muted-3 shrink-0" />
      <div className="flex-1 flex flex-col gap-[6px]">
        <div className="h-[14px] w-1/3 bg-muted-3" />
        <div className="h-[12px] w-1/4 bg-muted-3" />
      </div>
    </div>
  )
}

export default function ContinuePlan() {
  const t = useTranslations('home.continuePlan')
  const { user, loading } = useAuth()
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  // undefined = guest localStorage not checked yet, null = checked/no draft, number = checked/has draft
  const [guestStopCount, setGuestStopCount] = useState<number | null | undefined>(undefined)

  // Logged-in: fetch draft from server via SWR
  const { data: serverDraft } = useSWR<PlanDraft | null>(
    user ? '/api/plans/draft' : null,
    fetcher
  )

  // Guest: read localStorage draft once auth status is known
  useEffect(() => {
    if (loading || user) return
    const draft = getDraftPlan()
    setGuestStopCount(draft && draft.stops.length > 0 ? draft.stops.length : null)
  }, [user, loading])

  if (dismissed) return null

  const stillResolving = loading || (!user && guestStopCount === undefined) || (!!user && serverDraft === undefined)
  if (stillResolving) return <ContinuePlanSkeleton />

  // Logged-in path
  if (user && serverDraft) {
    return (
      <div
        className="mx-sp-4 lg:mx-sp-8 mt-sp-10 p-sp-4 flex items-center gap-sp-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--lav-border)' }}
        role="region"
        aria-label={t('ariaLabel')}
      >
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--lav-dim)' }}
          aria-hidden="true"
        >
          <Route size={18} strokeWidth={2} className="text-lav" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-f-sm font-semibold text-fg truncate">{serverDraft.title}</p>
          <p className="text-f-xs text-muted mt-[2px]">
            {t('stopCount', { n: serverDraft.stop_count })} · {relativeTime(serverDraft.updated_at, t)}
          </p>
        </div>
        <button
          onClick={() => router.push(`/map?plan=${serverDraft.id}`)}
          className="flex items-center gap-1 text-f-sm font-semibold text-lav hover:opacity-80 transition-opacity duration-[80ms] shrink-0 min-h-touch px-sp-3"
        >
          {t('cta')}
          <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label={t('dismiss')}
          className="text-muted hover:text-fg transition-colors duration-[80ms] shrink-0 min-w-touch min-h-touch flex items-center justify-center"
        >
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    )
  }

  // Guest path — localStorage draft
  if (!user && typeof guestStopCount === 'number') {
    return (
      <div
        className="mx-sp-4 lg:mx-sp-8 mt-sp-10 p-sp-4 flex items-center gap-sp-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--lav-border)' }}
        role="region"
        aria-label={t('ariaLabel')}
      >
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--lav-dim)' }}
          aria-hidden="true"
        >
          <Route size={18} strokeWidth={2} className="text-lav" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-f-sm font-semibold text-fg">{t('guestTitle')}</p>
          <p className="text-f-xs text-muted mt-[2px]">
            {t('stopCount', { n: guestStopCount })}
          </p>
        </div>
        <button
          onClick={() => router.push('/map')}
          className="flex items-center gap-1 text-f-sm font-semibold text-lav hover:opacity-80 transition-opacity duration-[80ms] shrink-0 min-h-touch px-sp-3"
        >
          {t('cta')}
          <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label={t('dismiss')}
          className="text-muted hover:text-fg transition-colors duration-[80ms] shrink-0 min-w-touch min-h-touch flex items-center justify-center"
        >
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    )
  }

  return null
}
