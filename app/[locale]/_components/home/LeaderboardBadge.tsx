'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import useSWR from 'swr'
import { Trophy, Star, Award, ArrowRight, User } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'
import type { HomeLeaderboardEntry } from '@/app/api/home/leaderboard/route'
import type { HomeBadgeShowcase } from '@/app/api/home/badge-showcase/route'

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-f-xl" aria-hidden="true">🥇</span>
  if (rank === 2) return <span className="text-f-xl" aria-hidden="true">🥈</span>
  return <span className="text-f-xl" aria-hidden="true">🥉</span>
}

const RARITY_LABEL: Record<string, string> = { common: '', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' }

export default function LeaderboardBadge() {
  const t = useTranslations('home.leaderboardBadge')
  const { data: lb, isLoading: lbLoading } = useSWR<HomeLeaderboardEntry[]>('/api/home/leaderboard', fetcher)
  const { data: badge } = useSWR<HomeBadgeShowcase | null>('/api/home/badge-showcase', fetcher)

  // Section hides only when both sub-cards have nothing to show. A loaded-but-empty
  // `lb` (`[]`) still renders the leaderboard card — with EMP_04 copy, not a bare header.
  if (!lbLoading && !lb && !badge) return null

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('ariaLabel')}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-sp-4">

        {/* SEC-12 Leaderboard Snapshot — skeleton reserves the same shape while loading */}
        {lbLoading && (
          <div className="animate-pulse" aria-hidden="true" style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
            <div className="flex items-center justify-between px-sp-4 pt-sp-4 pb-sp-3" style={{ borderBottom: '1px solid var(--bdr)' }}>
              <div className="h-[16px] w-1/3 bg-muted-3" />
              <div className="h-[13px] w-[60px] bg-muted-3" />
            </div>
            <div className="p-sp-3 flex flex-col gap-[2px]">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-sp-3 p-sp-2">
                  <div className="w-7 h-7 rounded-full bg-muted-3 shrink-0" />
                  <div className="flex-1 h-[13px] bg-muted-3" />
                  <div className="w-8 h-[13px] bg-muted-3 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {lb && (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
            <div className="flex items-center justify-between px-sp-4 pt-sp-4 pb-sp-3" style={{ borderBottom: '1px solid var(--bdr)' }}>
              <div className="flex items-center gap-sp-2">
                <Trophy size={16} strokeWidth={2} className="text-lav" aria-hidden="true" />
                <h2 className="text-f-base font-semibold text-fg">{t('leaderboard.title')}</h2>
              </div>
              <Link href="/leaderboard" className="flex items-center gap-1 text-f-xs text-lav hover:opacity-80 transition-opacity">
                {t('leaderboard.viewAll')}
                <ArrowRight size={11} strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
            <div className="p-sp-3 flex flex-col gap-[2px]">
              {lb.length === 0 ? (
                <p className="text-f-sm text-muted text-center py-sp-4">{t('leaderboard.empty')}</p>
              ) : lb.map(entry => (
                <div key={entry.user_id} className="flex items-center gap-sp-3 p-sp-2">
                  <RankIcon rank={entry.rank} />
                  <div
                    className="relative w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'var(--bg-3)' }}
                    aria-hidden="true"
                  >
                    {entry.avatar_url
                      ? <Image src={entry.avatar_url} alt="" fill sizes="28px" className="rounded-full object-cover" />
                      : <User size={14} strokeWidth={2} className="text-muted" />
                    }
                  </div>
                  <span className="flex-1 text-f-sm text-fg truncate">{entry.display_name}</span>
                  <span className="text-f-xs text-muted tabular-nums shrink-0">{entry.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEC-13 Badge Showcase */}
        {badge && (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}>
            <div className="flex items-center justify-between px-sp-4 pt-sp-4 pb-sp-3" style={{ borderBottom: '1px solid var(--bdr)' }}>
              <div className="flex items-center gap-sp-2">
                <Award size={16} strokeWidth={2} className="text-lav" aria-hidden="true" />
                <h2 className="text-f-base font-semibold text-fg">{t('badge.title')}</h2>
              </div>
              <Link href="/badges" className="flex items-center gap-1 text-f-xs text-lav hover:opacity-80 transition-opacity">
                {t('badge.viewAll')}
                <ArrowRight size={11} strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
            <div className="p-sp-4 flex items-center gap-sp-4">
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--lav-dim)', border: '1px solid var(--lav-border)' }}
                aria-hidden="true"
              >
                {badge.image_url
                  ? <Image src={badge.image_url} alt="" fill sizes="64px" className="rounded-full object-contain" />
                  : <Star size={28} strokeWidth={2} className="text-lav" />
                }
              </div>
              <div>
                {RARITY_LABEL[badge.rarity] && (
                  <p className="text-f-xxs font-bold tracking-[0.1em] uppercase text-lav mb-[3px]">
                    {RARITY_LABEL[badge.rarity]}
                  </p>
                )}
                <p className="text-f-base font-semibold text-fg">{badge.badge_name}</p>
                <p className="text-f-xs text-muted mt-[3px]">{t('badge.earnedBy', { name: badge.earner_name })}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
