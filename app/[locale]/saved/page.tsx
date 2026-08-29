'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useFormatter, useNow } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { Link } from '@/i18n/navigation'
import {
  Bookmark, MapPin, Heart, Map, RefreshCw, AlertTriangle,
  Edit2, Share2, Trash2, FileText,
} from 'lucide-react'
import { useSaved } from '@/hooks/useSaved'
import { useAuthGate } from '@/contexts/AuthGateContext'
import SavedPlacesPanel from '@/components/saved/SavedPlacesPanel'

type Tab = 'places' | 'myPlans' | 'savedPlans'

// Matches the real myPlans card shape (icon + title/badge + metadata row +
// 3-button action row) — a bare 2-line skeleton undersizes it by roughly a third,
// registering as layout shift when data resolves.
function MyPlanRowSkeleton() {
  return (
    <div className="flex items-start gap-sp-4 p-sp-4 rounded-none animate-pulse" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
      <div className="w-16 h-16 rounded-none bg-muted-3 shrink-0" />
      <div className="flex-1 space-y-sp-2">
        <div className="h-4 w-1/2 rounded bg-muted-3" />
        <div className="h-3 w-2/3 rounded bg-muted-3" />
        <div className="h-[28px] w-1/3 rounded bg-muted-3 mt-sp-1" />
      </div>
    </div>
  )
}

// Matches the real savedPlans card shape (icon + title + author + metadata row,
// no action row).
function SavedPlanRowSkeleton() {
  return (
    <div className="flex items-start gap-sp-4 p-sp-4 rounded-none animate-pulse" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
      <div className="w-16 h-16 rounded-none bg-muted-3 shrink-0" />
      <div className="flex-1 space-y-sp-2">
        <div className="h-4 w-1/2 rounded bg-muted-3" />
        <div className="h-3 w-1/3 rounded bg-muted-3" />
        <div className="h-3 w-2/3 rounded bg-muted-3" />
      </div>
    </div>
  )
}


export default function SavedPage() {
  const t      = useTranslations('saved')
  const format = useFormatter()
  const now    = useNow({ updateInterval: 60_000 })
  const { user, loading } = useAuth()
  const { open: openAuthGate } = useAuthGate()

  const [tab,            setTab]            = useState<Tab>('places')
  const [unsavedPlanIds, setUnsavedPlanIds] = useState<Set<string>>(new Set())
  const [deletePlanId,   setDeletePlanId]   = useState<string | null>(null)

  const { data, isLoading, isError, mutate } = useSaved()

  // GAP H8 — proactive auth gate when unauthenticated
  useEffect(() => {
    if (!loading && !user) {
      openAuthGate('saved_tab')
    }
  }, [loading, user, openAuthGate])

  const tabClass = (active: boolean) => [
    'px-sp-4 py-sp-3 text-f-md font-semibold tracking-[0.02em] transition-colors min-h-[44px] flex items-center -mb-px',
    active ? 'text-fg border-b-2 border-fg' : 'text-muted hover:text-fg',
  ].join(' ')

  function handleUnsave(planId: string) {
    setUnsavedPlanIds(prev => { const next = new Set(prev); next.add(planId); return next })
    fetch('/api/saved/plan', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plan_id: planId }),
    })
      .then(() => mutate())
      .catch(() => {})
  }

  const visibleSavedPlans = (data?.plans ?? []).filter(p => !unsavedPlanIds.has(p.id))

  return (
    <div
      className="max-w-[1200px] mx-auto px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-20"
      aria-label={t('ariaLabel')}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg transition-colors">B4K</Link>
        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>

      <h1 className="font-display text-fg text-f-display-tile mb-sp-5">
        {t('title')}
      </h1>

      {/* Tabs */}
      <nav
        className="flex gap-sp-1 mb-sp-4"
        style={{ borderBottom: '1px solid var(--bdr)' }}
        aria-label={t('tabs.ariaLabel')}
      >
        <button
          onClick={() => setTab('places')}
          className={tabClass(tab === 'places')}
          aria-current={tab === 'places' ? 'page' : undefined}
        >
          {t('tabs.places')}
        </button>
        <button
          onClick={() => setTab('myPlans')}
          className={tabClass(tab === 'myPlans')}
          aria-current={tab === 'myPlans' ? 'page' : undefined}
        >
          {t('tabs.myPlans')}
        </button>
        <button
          onClick={() => setTab('savedPlans')}
          className={tabClass(tab === 'savedPlans')}
          aria-current={tab === 'savedPlans' ? 'page' : undefined}
        >
          {t('tabs.savedPlans')}
        </button>
      </nav>

      {/* ── Places tab — folders + FL2 + CRUD, self-contained ── */}
      {tab === 'places' && <SavedPlacesPanel />}

      {/* ── Loading (My Plans / Saved Plans) ── */}
      {isLoading && tab !== 'places' && (
        <div aria-busy="true" aria-label={t('loading')} className="flex flex-col gap-sp-3">
          {tab === 'myPlans'
            ? Array.from({ length: 3 }, (_, i) => <MyPlanRowSkeleton key={i} />)
            : Array.from({ length: 3 }, (_, i) => <SavedPlanRowSkeleton key={i} />)}
        </div>
      )}

      {/* ── Error (My Plans / Saved Plans) ── */}
      {isError && !isLoading && tab !== 'places' && (
        <div
          className="flex flex-col items-center justify-center text-center py-16 rounded-none"
          style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
          role="alert"
        >
          <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
          <p className="text-f-lg font-semibold text-fg mb-sp-2">{t('error.title')}</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-sp-2 text-f-md font-semibold text-fg hover:opacity-80 transition-opacity mt-sp-2 min-h-touch px-sp-4"
          >
            <RefreshCw size={14} strokeWidth={2} />{t('error.retry')}
          </button>
        </div>
      )}

      {/* ── My Plans tab (flow 39) ── */}
      {!isLoading && !isError && data && tab === 'myPlans' && (
        data.myPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-none" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
            <FileText size={40} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-4" />
            <p className="text-f-xl font-semibold text-fg mb-sp-2">{t('empty.myPlans.title')}</p>
            <p className="text-f-md text-muted max-w-[320px] mb-sp-5">{t('empty.myPlans.desc')}</p>
            <Link href="/map" className="flex items-center gap-sp-2 px-sp-5 py-sp-3 rounded-none text-f-md font-semibold text-bg bg-fg min-h-touch">
              <Map size={15} strokeWidth={2} />{t('empty.myPlans.cta')}
            </Link>
          </div>
        ) : (
          <>
            {deletePlanId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-sp-4" role="dialog" aria-modal="true" aria-label={t('confirmDelete.title')}>
                <div className="absolute inset-0 bg-backdrop-50" onClick={() => setDeletePlanId(null)} aria-hidden="true" />
                <div className="relative bg-bg-2 rounded-none p-sp-6 max-w-sm w-full" style={{ border: '1px solid var(--bdr)' }}>
                  <h3 className="text-fg font-bold text-f-lg mb-sp-2">{t('confirmDelete.title')}</h3>
                  <p className="text-muted text-f-base mb-sp-5">{t('confirmDelete.desc')}</p>
                  <div className="flex gap-sp-3">
                    <button onClick={() => setDeletePlanId(null)} className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-muted hover:text-fg transition-colors" style={{ border: '1px solid var(--bdr)' }}>
                      {t('confirmDelete.cancel')}
                    </button>
                    <button
                      onClick={() => {
                        const id = deletePlanId
                        setDeletePlanId(null)
                        fetch(`/api/plans/${id}`, { method: 'DELETE' })
                          .then(() => mutate())
                          .catch(() => {})
                      }}
                      className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-bg"
                      style={{ background: 'var(--danger)' }}
                    >
                      {t('confirmDelete.confirm')}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-sp-3">
              {data.myPlans.map(plan => (
                <div
                  key={plan.id}
                  className="flex items-start gap-sp-4 p-sp-4 rounded-none"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
                >
                  <Link
                    href={`/plan/${plan.id}`}
                    className="w-16 h-16 rounded-none flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--bg-3)' }}
                    aria-label={t('myPlan.ariaLabel', { title: plan.title })}
                  >
                    <MapPin size={22} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sp-2 mb-[4px]">
                      <Link href={`/plan/${plan.id}`} className="text-f-base font-semibold text-fg leading-snug line-clamp-1 hover:opacity-80 transition-opacity">
                        {plan.title}
                      </Link>
                      {plan.is_draft && (
                        <span className="shrink-0 px-[6px] py-[2px] rounded-full text-f-xxs font-semibold text-warning leading-none" style={{ background: 'color-mix(in srgb, var(--warning) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)' }}>
                          {t('myPlan.draft')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-sp-3 text-f-xs text-muted mb-sp-3">
                      <span>{t('plan.stops', { count: plan.stop_count })}</span>
                      <span>·</span>
                      <span>{t('plan.days', { count: plan.duration_days })}</span>
                      <span>·</span>
                      <span className="flex items-center gap-[3px]"><Heart size={11} strokeWidth={2} /> {plan.likes_count}</span>
                      <span>·</span>
                      <span>{t('myPlan.lastEdited', { date: format.relativeTime(new Date(plan.updated_at), now) })}</span>
                    </div>
                    <div className="flex items-center gap-sp-2">
                      <Link
                        href={`/map?plan=${plan.id}`}
                        aria-label={t('myPlan.editAriaLabel', { title: plan.title })}
                        className="flex items-center gap-[4px] text-f-xs font-semibold text-fg hover:opacity-70 transition-opacity min-h-[28px] px-sp-2 rounded-none"
                        style={{ border: '1px solid var(--bdr)' }}
                      >
                        <Edit2 size={11} strokeWidth={2} aria-hidden="true" />
                        {t('myPlan.edit')}
                      </Link>
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/plan/${plan.id}`
                          await navigator.clipboard.writeText(url).catch(() => {})
                        }}
                        aria-label={t('myPlan.shareAriaLabel', { title: plan.title })}
                        className="flex items-center gap-[4px] text-f-xs font-semibold text-muted hover:text-fg transition-colors min-h-[28px] px-sp-2"
                      >
                        <Share2 size={11} strokeWidth={2} aria-hidden="true" />
                        {t('myPlan.share')}
                      </button>
                      <button
                        onClick={() => setDeletePlanId(plan.id)}
                        aria-label={t('myPlan.deleteAriaLabel', { title: plan.title })}
                        className="flex items-center gap-[4px] text-f-xs font-semibold text-muted hover:text-danger transition-colors min-h-[28px] px-sp-2 ml-auto"
                      >
                        <Trash2 size={11} strokeWidth={2} aria-hidden="true" />
                        {t('myPlan.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* ── Saved Plans tab (flow 40) ── */}
      {!isLoading && !isError && data && tab === 'savedPlans' && (
        visibleSavedPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-none" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
            <Bookmark size={40} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-4" />
            <p className="text-f-xl font-semibold text-fg mb-sp-2">{t('empty.savedPlans.title')}</p>
            <p className="text-f-md text-muted max-w-[320px] mb-sp-5">{t('empty.savedPlans.desc')}</p>
            <Link href="/map" className="flex items-center gap-sp-2 px-sp-5 py-sp-3 rounded-none text-f-md font-semibold text-bg bg-fg min-h-touch">
              <Map size={15} strokeWidth={2} />{t('empty.savedPlans.cta')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-sp-3">
            {visibleSavedPlans.map(plan => (
              <div
                key={plan.id}
                className="flex items-start gap-sp-4 p-sp-4 rounded-none"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
              >
                <Link
                  href={`/plan/${plan.id}`}
                  className="w-16 h-16 rounded-none flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--bg-3)' }}
                  aria-label={t('plan.ariaLabel', { title: plan.title })}
                >
                  <MapPin size={22} strokeWidth={2} className="text-fg opacity-[0.15]" aria-hidden="true" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/plan/${plan.id}`} className="block text-f-base font-semibold text-fg leading-snug mb-[4px] line-clamp-2 hover:opacity-80 transition-opacity">
                    {plan.title}
                  </Link>
                  <p className="text-f-sm text-muted mb-sp-2">{plan.author_name}</p>
                  <div className="flex items-center gap-sp-3 text-f-xs text-muted">
                    <span>{t('plan.stops', { count: plan.stop_count })}</span>
                    <span>·</span>
                    <span>{t('plan.days', { count: plan.duration_days })}</span>
                    <span>·</span>
                    <span className="flex items-center gap-[3px]"><Heart size={11} strokeWidth={2} /> {plan.likes_count}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleUnsave(plan.id)}
                  aria-label={t('unsave.ariaLabel', { title: plan.title })}
                  className="text-fg hover:text-muted transition-colors min-w-touch min-h-touch flex items-center justify-center shrink-0"
                  title={t('unsave.label')}
                >
                  <Bookmark size={16} strokeWidth={2} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
