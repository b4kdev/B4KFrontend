'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from '@/i18n/navigation'
import { GAMIFICATION } from '@/lib/features'
import { useCd } from './cd'
import { useV2Shell } from './V2Shell'

// Badge names from the Copy Deck by slug, so they show in the reader's
// language; a badge the deck does not have keeps the name the server sends (English).
export const BADGE_NAME_CD: Record<string, string> = {
  'first-save': 'CD1615', 'map-maker': 'CD1616', 'k-pop-pilgrim': 'CD1617', 'social-butterfly': 'CD1618',
  'drama-chaser': 'CD1619', 'beauty-hunter': 'CD1620', 'culture-keeper': 'CD1621', 'jeju-explorer': 'CD1622',
  'seoul-insider': 'CD1623', 'taste-seeker': 'CD1624', 'leaderboard-top': 'CD1625', 'legendary-guide': 'CD1626',
}

export function useBadgeName() {
  const t = useCd()
  return (b: { slug: string; name: string }) => (BADGE_NAME_CD[b.slug] ? t(BADGE_NAME_CD[b.slug]) : b.name)
}

/**
 * After a save, a like or a publish: asks the server which badges the account just earned and
 * shows "New badge unlocked: {name}" with View badge for the first one. Only while gamification
 * is on; a failed check stays silent (the nightly run awards it anyway).
 */
export function useBadgeUnlock() {
  const t = useCd()
  const { user } = useAuth()
  const { toast } = useV2Shell()
  const router = useRouter()
  const badgeName = useBadgeName()
  return () => {
    if (!GAMIFICATION || !user) return
    fetch('/api/badges/evaluate', { method: 'POST' })
      .then((r) => (r.ok ? (r.json() as Promise<{ newly_awarded: string[] }>) : null))
      .then((d) => {
        const slug = d?.newly_awarded?.[0]
        if (!slug) return
        toast({ type: 'success', message: t('CD0090', { name: badgeName({ slug, name: slug }) }), action: { label: t('CD0091'), onClick: () => router.push(`/badges?badge=${encodeURIComponent(slug)}`) } })
      })
      .catch(() => {})
  }
}
