'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Music, Tv, Sparkles, Globe, UtensilsCrossed, TreePine, Moon, Landmark } from 'lucide-react'

const INTERESTS = [
  { id: 'kpop',     icon: Music,           color: 'text-lav' },
  { id: 'kdrama',   icon: Tv,              color: 'text-info' },
  { id: 'kbeauty',  icon: Sparkles,        color: 'text-warning' },
  { id: 'kculture', icon: Globe,           color: 'text-success' },
  { id: 'food',     icon: UtensilsCrossed, color: 'text-danger' },
  { id: 'nature',   icon: TreePine,        color: 'text-success' },
  { id: 'nightlife',icon: Moon,            color: 'text-lav' },
  { id: 'history',  icon: Landmark,        color: 'text-warning' },
] as const

export default function OnboardingPage() {
  const t = useTranslations('onboarding')
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })

  const handleContinue = () => router.push('/map')

  return (
    <main
      className="min-h-[calc(100vh-52px)] flex items-center justify-center px-sp-4 py-sp-10"
      aria-label={t('ariaLabel')}
    >
      <div className="w-full max-w-[520px]">
        <h1 className="font-display font-black text-fg text-[clamp(24px,3vw,36px)] mb-sp-2 text-center">
          {t('title')}
        </h1>
        <p className="text-[14px] text-muted text-center mb-sp-2">{t('subtitle')}</p>
        <p className="text-[13px] text-muted-2 text-center mb-sp-8">{t('desc')}</p>

        <p className="text-[11px] font-semibold tracking-[0.07em] uppercase text-muted mb-sp-4 text-center">
          {t('interests.label')}
        </p>

        <div
          className="grid grid-cols-2 gap-sp-3 mb-sp-8"
          role="group"
          aria-label={t('interests.label')}
        >
          {INTERESTS.map(({ id, icon: Icon, color }) => {
            const active = selected.has(id)
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                aria-pressed={active}
                className={[
                  'flex items-center gap-sp-3 px-sp-4 py-sp-4 rounded-xl text-left transition-colors min-h-touch',
                  active ? 'ring-1 ring-lav' : '',
                ].join(' ')}
                style={{
                  background: active ? 'var(--lav-dim)' : 'var(--bg-2)',
                  border: active ? '1px solid var(--lav-border)' : '1px solid var(--bdr)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--bg-3)' }}
                >
                  <Icon size={18} strokeWidth={2} className={active ? color : 'text-muted'} />
                </div>
                <div className="min-w-0">
                  <p className={['text-[13px] font-semibold truncate', active ? 'text-lav' : 'text-fg'].join(' ')}>
                    {t(`interests.${id}.label`)}
                  </p>
                  <p className="text-[11px] text-muted truncate">{t(`interests.${id}.desc`)}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-sp-3">
          <button
            onClick={handleContinue}
            className="w-full flex items-center justify-center px-sp-5 py-sp-4 rounded-xl text-[14px] font-semibold text-bg min-h-touch transition-opacity hover:opacity-90"
            style={{ background: 'var(--lav)' }}
          >
            {t('cta')}
          </button>
          <button
            onClick={handleContinue}
            className="w-full flex items-center justify-center px-sp-5 py-sp-3 rounded-xl text-[13px] text-muted min-h-touch hover:text-fg transition-colors"
          >
            {t('skip')}
          </button>
        </div>
      </div>
    </main>
  )
}
