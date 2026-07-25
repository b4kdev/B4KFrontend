'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthGate } from '@/contexts/AuthGateContext'
import { PenLine, Wand2 } from 'lucide-react'

// 'ai' tile hidden per DEC-51 (2026-07-25) — /plan/ai now redirects to a plain
// /map with no AI overlay, so the tile was a dead end. Re-add when FL3 ships.
const OPTIONS = [
  { key: 'manual', href: '/plan/manual', Icon: PenLine },
  { key: 'auto',   href: '/plan/auto',   Icon: Wand2   },
] as const

export default function PlanTrip() {
  const t = useTranslations('home.planTrip')
  const { user } = useAuth()
  const { open: openAuthGate } = useAuthGate()
  const router = useRouter()

  // AG-1 (locked): only FL2 (auto-generate, needs saved POIs → requires login) gates.
  // FL1 (manual) and FL3 (AI chat) stay guest-free — navigate straight through.
  function handleOption(key: string, href: string) {
    if (key === 'auto' && !user) { openAuthGate('save_plan'); return }
    router.push(href)
  }

  return (
    <section className="pt-sp-10 px-sp-4 lg:px-sp-8" aria-label={t('ariaLabel')}>
      <h2 className="text-f-xl font-semibold text-fg mb-sp-1">{t('title')}</h2>
      <p className="text-f-sm text-muted mb-sp-4">{t('subtitle')}</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-sp-3">
        {OPTIONS.map(({ key, href, Icon }) => (
          <button
            key={key}
            onClick={() => handleOption(key, href)}
            className="flex items-center gap-sp-4 p-sp-4 text-left hover:opacity-90 active:opacity-75 transition-opacity"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--lav-dim)' }}
              aria-hidden="true"
            >
              <Icon size={20} strokeWidth={2} className="text-lav" />
            </span>
            <div>
              <p className="text-f-base font-semibold text-fg">{t(`${key}.label`)}</p>
              <p className="text-f-xs text-muted mt-[2px]">{t(`${key}.sub`)}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
