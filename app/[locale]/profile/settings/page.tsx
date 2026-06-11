'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { Car, Train, Check } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'

const LOCALES = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'th', 'pt-BR'] as const
const INTERESTS = ['kpop', 'kdrama', 'kbeauty', 'kculture'] as const

type Transport = 'car' | 'public'

export default function SettingsPage() {
  const t = useTranslations('profile')
  const router = useRouter()
  const pathname = usePathname()
  const { data: profile } = useProfile()

  const [transport, setTransport] = useState<Transport>(profile?.transport_default ?? 'car')
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleLangChange = (locale: string) => {
    router.replace(pathname, { locale })
  }

  const toggleInterest = (key: string) => {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
    )
    setSaved(false)
  }

  const handleTransport = (val: Transport) => {
    setTransport(val)
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transport_default: transport, interests }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sectionHeading = 'text-[11px] font-bold uppercase tracking-[0.1em] text-muted mb-sp-3'
  const row = 'flex items-center justify-between min-h-[52px] py-sp-2'
  const label = 'text-[14px] font-medium text-fg'
  const sublabel = 'text-[12px] text-muted mt-0.5'

  return (
    <div className="max-w-[560px] flex flex-col gap-sp-8">
      {/* Account section — PR_50 */}
      <section aria-labelledby="account-heading">
        <h2 id="account-heading" className={sectionHeading}>
          {t('settings.account.heading')}
        </h2>
        <div
          className="rounded-xl overflow-hidden divide-y"
          style={{ background: 'var(--bg-2)', border: 'var(--bdr)' }}
        >
          <div className={`${row} px-sp-4`}>
            <div>
              <p className={label}>{t('settings.account.email')}</p>
              <p className={sublabel}>{t('settings.account.emailNote')}</p>
            </div>
            <span className="text-[13px] text-muted font-mono ml-sp-4 truncate max-w-[180px]">
              {profile?.email ?? '—'}
            </span>
          </div>
        </div>
      </section>

      {/* Preferences — PR_51–53 */}
      <section aria-labelledby="prefs-heading">
        <h2 id="prefs-heading" className={sectionHeading}>
          {t('settings.preferences.heading')}
        </h2>
        <div
          className="rounded-xl overflow-hidden divide-y"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
        >
          {/* Language — PR_51 */}
          <div className={`${row} px-sp-4 flex-wrap gap-sp-3`} aria-labelledby="lang-label">
            <p id="lang-label" className={label}>{t('settings.preferences.language')}</p>
            <select
              className="text-[13px] font-medium text-fg rounded-lg px-sp-3 min-h-[36px] appearance-none cursor-pointer"
              style={{ background: 'var(--bg-3)', border: '1px solid var(--bdr)' }}
              defaultValue={profile?.preferred_lang ?? 'en'}
              onChange={(e) => handleLangChange(e.target.value)}
              aria-label={t('settings.preferences.language')}
            >
              {LOCALES.map((loc) => (
                <option key={loc} value={loc}>
                  {t(`settings.languages.${loc}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Transport — PR_52 */}
          <div className={`${row} px-sp-4`} aria-labelledby="transport-label">
            <p id="transport-label" className={label}>{t('settings.preferences.transport')}</p>
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--bdr)' }}
              role="radiogroup"
              aria-label={t('settings.preferences.transport')}
            >
              {(['car', 'public'] as Transport[]).map((val) => {
                const active = transport === val
                return (
                  <button
                    key={val}
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleTransport(val)}
                    className={[
                      'flex items-center gap-1.5 px-sp-4 min-h-[36px] text-[12px] font-semibold transition-colors',
                      active ? 'bg-lav-dim text-lav' : 'text-muted hover:text-fg',
                    ].join(' ')}
                  >
                    {val === 'car'
                      ? <><Car size={13} strokeWidth={2} /> {t('settings.preferences.transportCar')}</>
                      : <><Train size={13} strokeWidth={2} /> {t('settings.preferences.transportPublic')}</>
                    }
                  </button>
                )
              })}
            </div>
          </div>

          {/* Interests — PR_53 */}
          <div className="px-sp-4 py-sp-4">
            <div className="flex items-start justify-between mb-sp-3">
              <div>
                <p className={label}>{t('settings.preferences.interests')}</p>
                <p className={sublabel}>{t('settings.preferences.interestsNote')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-sp-2" role="group" aria-label={t('settings.preferences.interests')}>
              {INTERESTS.map((key) => {
                const active = interests.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => toggleInterest(key)}
                    aria-pressed={active}
                    className={[
                      'min-h-touch px-sp-4 rounded-full text-[12px] font-semibold transition-colors',
                      active
                        ? 'bg-lav-dim text-lav'
                        : 'text-muted hover:text-fg',
                    ].join(' ')}
                    style={{ border: active ? '1px solid var(--lav-border)' : '1px solid var(--bdr)' }}
                  >
                    {t(`settings.interests.${key}`)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={[
          'self-start min-h-touch px-sp-8 rounded-full text-[13px] font-semibold transition-all',
          saved
            ? 'bg-success/20 text-success'
            : 'bg-lav-dim text-lav hover:bg-lav-mid',
        ].join(' ')}
        style={{ border: saved ? '1px solid color-mix(in srgb, var(--success) 30%, transparent)' : '1px solid var(--lav-border)' }}
        aria-label={saving ? t('settings.preferences.saving') : saved ? t('settings.preferences.saved') : t('settings.preferences.save')}
      >
        {saving ? t('settings.preferences.saving') : saved ? (
          <span className="flex items-center gap-1.5"><Check size={14} strokeWidth={2} /> {t('settings.preferences.saved')}</span>
        ) : t('settings.preferences.save')}
      </button>
    </div>
  )
}
