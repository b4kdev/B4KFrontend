'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { signOut } from 'next-auth/react'
import { Car, Train, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'

const LOCALES = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'th', 'pt-BR'] as const
const INTERESTS = ['kpop', 'kdrama', 'kbeauty', 'kculture'] as const

type Transport = 'car' | 'public'

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  deleting,
  t,
}: {
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
  t: ReturnType<typeof useTranslations>
}) {
  const [typed, setTyped] = useState('')
  const confirmed = typed === 'DELETE'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-sp-4"
      style={{ background: 'var(--backdrop-50)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('settings.deleteAccount')}
    >
      <div
        className="w-full max-w-[360px] rounded-none p-sp-6 flex flex-col gap-sp-4"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      >
        <div className="flex items-start gap-sp-3">
          <AlertTriangle size={20} strokeWidth={2} className="text-danger shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-f-lg font-semibold text-fg">{t('settings.deleteAccount')}</p>
            <p className="text-f-md text-muted mt-sp-2">{t('settings.deleteWarning')}</p>
          </div>
        </div>
        <div className="flex flex-col gap-sp-2">
          <label htmlFor="delete-confirm-input" className="text-f-sm text-muted">
            {t('settings.deleteTypePrompt')}
          </label>
          <input
            id="delete-confirm-input"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-none px-sp-3 min-h-touch text-f-base font-mono text-fg bg-bg-3 outline-none focus:ring-1 focus:ring-danger/50"
            style={{ border: '1px solid var(--bdr)' }}
            aria-describedby="delete-confirm-hint"
          />
          <p id="delete-confirm-hint" className="sr-only">{t('settings.deleteTypeHint')}</p>
        </div>
        <div className="flex gap-sp-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-muted hover:text-fg transition-colors"
            style={{ border: '1px solid var(--bdr)' }}
          >
            {t('settings.deleteCancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || deleting}
            className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-fg transition-opacity"
            style={{
              background: 'var(--danger)',
              opacity: confirmed && !deleting ? 1 : 0.4,
              cursor: confirmed && !deleting ? 'pointer' : 'not-allowed',
            }}
          >
            {deleting ? '…' : t('settings.deleteConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const t = useTranslations('profile')
  const router = useRouter()
  const pathname = usePathname()
  const { data: profile } = useProfile()

  const [transport, setTransport] = useState<Transport>(profile?.transport_default ?? 'car')
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Password change state
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwShowCurrent, setPwShowCurrent] = useState(false)
  const [pwShowNew, setPwShowNew] = useState(false)
  const [pwChanging, setPwChanging] = useState(false)
  const [pwStatus, setPwStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pwError, setPwError] = useState('')

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

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (res.ok) {
        await signOut({ callbackUrl: '/' })
      }
    } finally {
      setDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  const pwValid = pwCurrent.length > 0 && pwNew.length >= 8 && pwNew === pwConfirm

  const handlePasswordChange = async () => {
    if (!pwValid) return
    setPwChanging(true)
    setPwStatus('idle')
    setPwError('')
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      })
      if (res.ok) {
        setPwStatus('success')
        setPwCurrent('')
        setPwNew('')
        setPwConfirm('')
        setTimeout(() => setPwStatus('idle'), 3000)
      } else {
        const body = await res.json().catch(() => ({}))
        setPwStatus('error')
        setPwError(body.error ?? t('settings.passwordError'))
      }
    } catch {
      setPwStatus('error')
      setPwError(t('settings.passwordError'))
    } finally {
      setPwChanging(false)
    }
  }

  const sectionHeading = 'text-f-xs font-bold uppercase tracking-[0.1em] text-muted mb-sp-3'
  const row = 'flex items-center justify-between min-h-[52px] py-sp-2'
  const label = 'text-f-base font-medium text-fg'
  const sublabel = 'text-f-sm text-muted mt-0.5'

  return (
    <>
      <div className="max-w-[560px] mx-auto flex flex-col gap-sp-8">
        {/* Account section — PR_50 */}
        <section aria-labelledby="account-heading">
          <h2 id="account-heading" className={sectionHeading}>
            {t('settings.account.heading')}
          </h2>
          <div
            className="rounded-none overflow-hidden divide-y"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <div className={`${row} px-sp-4`}>
              <div>
                <p className={label}>{t('settings.account.email')}</p>
                <p className={sublabel}>{t('settings.account.emailNote')}</p>
              </div>
              <span className="text-f-md text-muted font-mono ml-sp-4 truncate max-w-[180px]">
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
            className="rounded-none overflow-hidden divide-y"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            {/* Language — PR_51 */}
            <div className={`${row} px-sp-4 flex-wrap gap-sp-3`} aria-labelledby="lang-label">
              <p id="lang-label" className={label}>{t('settings.preferences.language')}</p>
              <select
                className="text-f-md font-medium text-fg rounded-none px-sp-3 min-h-[36px] appearance-none cursor-pointer"
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
                className="flex rounded-none overflow-hidden"
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
                        'flex items-center gap-1.5 px-sp-4 min-h-[36px] text-f-sm font-semibold transition-colors',
                        active ? 'bg-lav-dim text-lav' : 'text-muted hover:text-fg',
                      ].join(' ')}
                    >
                      {val === 'car'
                        ? <><Car size={13} strokeWidth={2} aria-hidden="true" /> {t('settings.preferences.transportCar')}</>
                        : <><Train size={13} strokeWidth={2} aria-hidden="true" /> {t('settings.preferences.transportPublic')}</>
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
                        'min-h-touch px-sp-4 rounded-full text-f-sm font-semibold transition-colors',
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
            'self-start min-h-touch px-sp-8 rounded-full text-f-md font-semibold transition-all',
            saved
              ? 'bg-success/20 text-success'
              : 'bg-lav-dim text-lav hover:bg-lav-mid',
          ].join(' ')}
          style={{ border: saved ? '1px solid color-mix(in srgb, var(--success) 30%, transparent)' : '1px solid var(--lav-border)' }}
          aria-label={saving ? t('settings.preferences.saving') : saved ? t('settings.preferences.saved') : t('settings.preferences.save')}
        >
          {saving ? t('settings.preferences.saving') : saved ? (
            <span className="flex items-center gap-1.5"><Check size={14} strokeWidth={2} aria-hidden="true" /> {t('settings.preferences.saved')}</span>
          ) : t('settings.preferences.save')}
        </button>

        {/* Password change — C9 / feature 5.1.3 */}
        <section aria-labelledby="password-heading">
          <h2 id="password-heading" className={sectionHeading}>
            {t('settings.password.heading')}
          </h2>
          <div
            className="rounded-none overflow-hidden"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <div className="flex flex-col gap-sp-4 p-sp-4">
              {/* Current password */}
              <div className="flex flex-col gap-sp-2">
                <label htmlFor="pw-current" className={label}>
                  {t('settings.password.current')}
                </label>
                <div className="relative">
                  <input
                    id="pw-current"
                    type={pwShowCurrent ? 'text' : 'password'}
                    value={pwCurrent}
                    onChange={(e) => { setPwCurrent(e.target.value); setPwStatus('idle') }}
                    autoComplete="current-password"
                    className="w-full rounded-none px-sp-3 pr-12 min-h-touch text-f-base text-fg bg-bg-3 outline-none focus:ring-1 focus:ring-lav-border"
                    style={{ border: '1px solid var(--bdr)' }}
                    aria-label={t('settings.password.current')}
                  />
                  <button
                    type="button"
                    onClick={() => setPwShowCurrent((v) => !v)}
                    className="absolute right-sp-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition-colors"
                    aria-label={pwShowCurrent ? t('settings.password.hide') : t('settings.password.show')}
                    tabIndex={0}
                  >
                    {pwShowCurrent
                      ? <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
                      : <Eye size={16} strokeWidth={2} aria-hidden="true" />
                    }
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="flex flex-col gap-sp-2">
                <label htmlFor="pw-new" className={label}>
                  {t('settings.password.new')}
                </label>
                <div className="relative">
                  <input
                    id="pw-new"
                    type={pwShowNew ? 'text' : 'password'}
                    value={pwNew}
                    onChange={(e) => { setPwNew(e.target.value); setPwStatus('idle') }}
                    autoComplete="new-password"
                    minLength={8}
                    className="w-full rounded-none px-sp-3 pr-12 min-h-touch text-f-base text-fg bg-bg-3 outline-none focus:ring-1 focus:ring-lav-border"
                    style={{ border: '1px solid var(--bdr)' }}
                    aria-label={t('settings.password.new')}
                    aria-describedby="pw-new-hint"
                  />
                  <button
                    type="button"
                    onClick={() => setPwShowNew((v) => !v)}
                    className="absolute right-sp-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition-colors"
                    aria-label={pwShowNew ? t('settings.password.hide') : t('settings.password.show')}
                    tabIndex={0}
                  >
                    {pwShowNew
                      ? <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
                      : <Eye size={16} strokeWidth={2} aria-hidden="true" />
                    }
                  </button>
                </div>
                <p id="pw-new-hint" className={sublabel}>{t('settings.password.hint')}</p>
              </div>

              {/* Confirm new password */}
              <div className="flex flex-col gap-sp-2">
                <label htmlFor="pw-confirm" className={label}>
                  {t('settings.password.confirm')}
                </label>
                <input
                  id="pw-confirm"
                  type="password"
                  value={pwConfirm}
                  onChange={(e) => { setPwConfirm(e.target.value); setPwStatus('idle') }}
                  autoComplete="new-password"
                  className="w-full rounded-none px-sp-3 min-h-touch text-f-base text-fg bg-bg-3 outline-none focus:ring-1 focus:ring-lav-border"
                  style={{
                    border: pwConfirm.length > 0 && pwNew !== pwConfirm
                      ? '1px solid var(--danger)'
                      : '1px solid var(--bdr)',
                  }}
                  aria-label={t('settings.password.confirm')}
                  aria-invalid={pwConfirm.length > 0 && pwNew !== pwConfirm}
                />
                {pwConfirm.length > 0 && pwNew !== pwConfirm && (
                  <p className="text-f-sm text-danger" role="alert">{t('settings.password.mismatch')}</p>
                )}
              </div>

              {/* Status / feedback */}
              {pwStatus === 'success' && (
                <div className="flex items-center gap-sp-2 text-success text-f-sm" role="status">
                  <Check size={14} strokeWidth={2} aria-hidden="true" />
                  {t('settings.password.success')}
                </div>
              )}
              {pwStatus === 'error' && (
                <p className="text-f-sm text-danger" role="alert">{pwError}</p>
              )}

              {/* Submit */}
              <button
                onClick={handlePasswordChange}
                disabled={!pwValid || pwChanging}
                className="self-start min-h-touch px-sp-8 rounded-full text-f-md font-semibold transition-all bg-lav-dim text-lav hover:bg-lav-mid"
                style={{
                  border: '1px solid var(--lav-border)',
                  opacity: pwValid && !pwChanging ? 1 : 0.4,
                  cursor: pwValid && !pwChanging ? 'pointer' : 'not-allowed',
                }}
                aria-label={t('settings.password.submit')}
              >
                {pwChanging ? t('settings.password.submitting') : t('settings.password.submit')}
              </button>
            </div>
          </div>
        </section>

        {/* Account actions — sign out + delete */}
        <section aria-labelledby="actions-heading">
          <h2 id="actions-heading" className={sectionHeading}>
            {t('settings.account.heading')}
          </h2>
          <div className="flex flex-col gap-sp-2">
            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full min-h-touch rounded-none text-f-sm font-semibold text-fg text-left px-sp-4 hover:opacity-80 transition-opacity"
              style={{ border: '1px solid var(--bdr)', background: 'var(--bg-2)' }}
            >
              {t('settings.signOut')}
            </button>

            {/* Delete account */}
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="w-full min-h-touch rounded-none text-f-sm font-semibold text-danger text-left px-sp-4 hover:opacity-80 transition-opacity"
              style={{ border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)', background: 'var(--bg-2)' }}
            >
              {t('settings.deleteAccount')}
            </button>
          </div>
        </section>
      </div>

      {deleteConfirmOpen && (
        <DeleteConfirmModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setDeleteConfirmOpen(false)}
          deleting={deleting}
          t={t}
        />
      )}
    </>
  )
}
