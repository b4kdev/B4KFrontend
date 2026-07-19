'use client'

import { useTranslations, useFormatter, useNow } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  Bell, AlertCircle, Star, Award, Trophy, Tag,
  CalendarDays, RefreshCw, AlertTriangle, Check,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification, NotificationType } from '@/app/api/notifications/route'

const TYPE_ICON: Partial<Record<NotificationType, React.ElementType>> = {
  event_drop:     CalendarDays,
  deal_expiring:  AlertCircle,
  editorial_pick: Star,
  badge_earned:   Award,
  challenge_new:  Trophy,
  promotion:      Tag,
}

function isValidInternalLink(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.startsWith('/')
}

function groupByDate(notifications: Notification[]) {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yest  = new Date(today.getTime() - 86400000)
  const groups: { key: string; items: Notification[] }[] = []
  const map = new Map<string, Notification[]>()

  for (const n of notifications) {
    const d = new Date(n.created_at)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const key = day >= today ? 'today' : day >= yest ? 'yesterday' : 'earlier'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(n)
  }

  for (const key of ['today', 'yesterday', 'earlier']) {
    if (map.has(key)) groups.push({ key, items: map.get(key)! })
  }
  return groups
}

function RowSkeleton() {
  return (
    <div className="flex items-start gap-sp-3 p-sp-4 animate-pulse" style={{ borderBottom: 'var(--bdr)' }}>
      <div className="w-9 h-9 rounded-full bg-muted-3 shrink-0 mt-[2px]" />
      <div className="flex-1 space-y-sp-2">
        <div className="h-4 w-2/3 rounded-none bg-muted-3" />
        <div className="h-3 w-full rounded-none bg-muted-3" />
        <div className="h-3 w-1/4 rounded-none bg-muted-3" />
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const t = useTranslations('notifications')
  const format = useFormatter()
  const now = useNow({ updateInterval: 60_000 })
  const { data, isLoading, isError, mutate } = useNotifications()

  function handleMarkRead(id: string) {
    fetch(`/api/notifications/${id}`, { method: 'PATCH' }).catch(() => {})
    mutate(
      prev => prev
        ? {
            ...prev,
            notifications: prev.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
            unread_count:  Math.max(0, prev.unread_count - 1),
          }
        : prev,
      false,
    )
  }

  function handleMarkAllRead() {
    fetch('/api/notifications/mark-all-read', { method: 'POST' }).catch(() => {})
    mutate(
      prev => prev
        ? { ...prev, notifications: prev.notifications.map(n => ({ ...n, is_read: true })), unread_count: 0 }
        : prev,
      false,
    )
  }

  return (
    <main
      className="max-w-[720px] mx-auto px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-20"
      aria-label={t('ariaLabel')}
    >
      <div className="flex items-center gap-1.5 text-f-xxs font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg transition-colors">B4K</Link>
        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>

      <div className="flex items-center justify-between mb-sp-5">
        <h1 className="font-display text-fg text-f-display-tile">
          {t('title')}
        </h1>
        {data && data.unread_count > 0 && (
          <div className="flex items-center gap-sp-3">
            <span className="text-f-sm font-semibold text-lav">
              {t('unread', { count: data.unread_count })}
            </span>
            <button
              onClick={handleMarkAllRead}
              className="text-f-sm text-muted hover:text-fg transition-colors min-h-touch px-sp-2"
            >
              {t('markAllRead')}
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div
          aria-busy="true"
          aria-label={t('loading')}
          className="rounded-none overflow-hidden"
          style={{ border: '1px solid var(--bdr)' }}
        >
          {Array.from({ length: 4 }, (_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {isError && !isLoading && (
        <div
          className="flex flex-col items-center justify-center text-center py-16 rounded-none"
          style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
          role="alert"
        >
          <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
          <p className="text-f-lg font-semibold text-fg mb-sp-2">{t('error.title')}</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-sp-2 text-f-md font-semibold text-lav hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
          >
            <RefreshCw size={14} strokeWidth={2} />{t('error.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && data && (
        data.notifications.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-none"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <Bell size={40} strokeWidth={2} className="text-fg opacity-[0.15] mb-sp-4" />
            <p className="text-f-xl font-semibold text-fg mb-sp-2">{t('empty.title')}</p>
            <p className="text-f-md text-muted max-w-[300px]">{t('empty.desc')}</p>
          </div>
        ) : (
          <div className="rounded-none overflow-hidden" style={{ border: '1px solid var(--bdr)' }}>
            {groupByDate(data.notifications).map(group => (
              <div key={group.key}>
                <p
                  className="px-sp-4 py-[6px] text-f-xs font-semibold tracking-[0.06em] uppercase text-muted"
                  style={{ background: 'var(--bg-3)', borderBottom: 'var(--bdr)' }}
                >
                  {t(`groups.${group.key}`)}
                </p>
                {group.items.map((n, idx) => {
                  const Icon = TYPE_ICON[n.type as NotificationType] ?? Bell
                  const isLast = idx === group.items.length - 1
                  const itemClass = [
                    'flex items-start gap-sp-3 p-sp-4 hover:bg-muted-3 transition-colors min-h-touch w-full text-left',
                    !n.is_read ? 'bg-lav-dim' : '',
                  ].join(' ')
                  const itemStyle = !isLast ? { borderBottom: 'var(--bdr)' } : undefined
                  const inner = (
                    <>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-[2px]"
                        style={{ background: n.is_read ? 'var(--bg-3)' : 'var(--lav-mid)' }}
                      >
                        <Icon size={16} strokeWidth={2} className={n.is_read ? 'text-muted' : 'text-lav'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-f-md font-semibold leading-snug text-fg">
                          {n.title}
                        </p>
                        <p className="text-f-sm text-muted mt-[2px] line-clamp-2">{n.body}</p>
                        <p className="text-f-xs text-muted-2 mt-[2px]">
                          {format.relativeTime(new Date(n.created_at), now)}
                        </p>
                      </div>
                      {n.is_read && (
                        <Check size={14} strokeWidth={2} className="text-muted shrink-0 mt-[4px]" aria-hidden />
                      )}
                    </>
                  )
                  return isValidInternalLink(n.deep_link_url) ? (
                    <Link
                      key={n.id}
                      href={n.deep_link_url}
                      onClick={() => { if (!n.is_read) handleMarkRead(n.id) }}
                      className={itemClass}
                      style={itemStyle}
                      aria-label={n.title}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={n.id}
                      className={itemClass}
                      style={itemStyle}
                      aria-label={n.title}
                      role="listitem"
                    >
                      {inner}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )
      )}
    </main>
  )
}
