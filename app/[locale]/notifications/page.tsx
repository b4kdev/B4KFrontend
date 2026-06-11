'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import {
  Bell, Gift, AlertCircle, Star, Award,
  CalendarDays, RefreshCw, AlertTriangle, Check,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification, NotificationType } from '@/app/api/notifications/route'

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  event_drop:     CalendarDays,
  new_package:    Gift,
  deal_expiring:  AlertCircle,
  editorial_pick: Star,
  badge_earned:   Award,
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
        <div className="h-4 w-2/3 rounded bg-muted-3" />
        <div className="h-3 w-full rounded bg-muted-3" />
        <div className="h-3 w-1/4 rounded bg-muted-3" />
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const t = useTranslations('notifications')
  const { data, isLoading, isError, mutate } = useNotifications()

  return (
    <main
      className="max-w-[720px] mx-auto px-sp-4 md:px-sp-8 pt-sp-6 pb-sp-20"
      aria-label={t('ariaLabel')}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted mb-sp-5">
        <Link href="/" className="text-muted-2 hover:text-fg transition-colors">B4K</Link>
        <span>›</span>
        <span className="text-fg">{t('breadcrumb')}</span>
      </div>

      <div className="flex items-center justify-between mb-sp-5">
        <h1 className="font-display font-black text-fg text-[clamp(22px,2.5vw,32px)]">
          {t('title')}
        </h1>
        {data && data.unread_count > 0 && (
          <span className="text-[12px] font-semibold text-lav">
            {t('unread', { count: data.unread_count })}
          </span>
        )}
      </div>

      {isLoading && (
        <div
          aria-busy="true"
          aria-label={t('loading')}
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--bdr)' }}
        >
          {Array.from({ length: 4 }, (_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {isError && !isLoading && (
        <div
          className="flex flex-col items-center justify-center text-center py-16 rounded-lg"
          style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}
          role="alert"
        >
          <AlertTriangle size={36} strokeWidth={2} className="text-danger mb-sp-3" />
          <p className="text-[15px] font-semibold text-fg mb-sp-2">{t('error.title')}</p>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-sp-2 text-[13px] font-semibold text-lav hover:text-fg transition-colors mt-sp-2 min-h-touch px-sp-4"
          >
            <RefreshCw size={14} strokeWidth={2} />{t('error.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && data && (
        data.notifications.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-lg"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <Bell size={40} strokeWidth={2} className="text-muted-2 mb-sp-4" />
            <p className="text-[16px] font-semibold text-fg mb-sp-2">{t('empty.title')}</p>
            <p className="text-[13px] text-muted max-w-[300px]">{t('empty.desc')}</p>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--bdr)' }}>
            {groupByDate(data.notifications).map(group => (
              <div key={group.key}>
                <p
                  className="px-sp-4 py-[6px] text-[11px] font-semibold tracking-[0.06em] uppercase text-muted"
                  style={{ background: 'var(--bg-3)', borderBottom: 'var(--bdr)' }}
                >
                  {t(`groups.${group.key}`)}
                </p>
                {group.items.map((n, idx) => {
                  const Icon = TYPE_ICON[n.type as NotificationType] ?? Bell
                  const isLast = idx === group.items.length - 1
                  return (
                    <Link
                      key={n.id}
                      href={n.deep_link_url}
                      className={[
                        'flex items-start gap-sp-3 p-sp-4 hover:bg-muted-3 transition-colors min-h-touch',
                        !n.is_read ? 'bg-lav-dim' : '',
                      ].join(' ')}
                      style={!isLast ? { borderBottom: 'var(--bdr)' } : {}}
                      aria-label={n.title}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-[2px]"
                        style={{ background: n.is_read ? 'var(--bg-3)' : 'var(--lav-mid)' }}
                      >
                        <Icon size={16} strokeWidth={2} className={n.is_read ? 'text-muted' : 'text-lav'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={['text-[13px] font-semibold leading-snug', n.is_read ? 'text-fg' : 'text-fg'].join(' ')}>
                          {n.title}
                        </p>
                        <p className="text-[12px] text-muted mt-[2px] line-clamp-2">{n.body}</p>
                      </div>
                      {n.is_read && (
                        <Check size={14} strokeWidth={2} className="text-muted shrink-0 mt-[4px]" aria-hidden />
                      )}
                    </Link>
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
