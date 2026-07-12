'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useSWRConfig } from 'swr'
import { useRouter, usePathname } from '@/i18n/navigation'
import { signOut } from 'next-auth/react'
import { Car, Train, Check, AlertTriangle, Eye, EyeOff, Upload, Trash2, User } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { useToast } from '@/contexts/ToastContext'

const LOCALES = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'th', 'pt-BR'] as const
const INTERESTS = ['kpop', 'kdrama', 'kbeauty', 'kculture'] as const

const NOTIF_TYPES = [
  'event_drop',
  'deal_expiring',
  'editorial_pick',
  'badge_earned',
  'challenge_new',
  'promotion',
] as const
type NotifType = (typeof NOTIF_TYPES)[number]

const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type Transport = 'car' | 'public'

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  deleting,
  reauthRequired,
  t,
}: {
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
  reauthRequired: boolean
  t: ReturnType<typeof useTranslations>
}) {
  const [typed, setTyped] = useState('')
  // Step 1: re-auth (only when reauthRequired). Step 2: type DELETE.
  const [reauthed, setReauthed] = useState(!reauthRequired)
  const [pw, setPw] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [reauthError, setReauthError] = useState('')
  const confirmed = typed === 'DELETE'

  const handleReauth = async () => {
    if (pw.length === 0 || verifying) return
    setVerifying(true)
    setReauthError('')
    try {
      const res = await fetch('/api/account/recent-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (res.ok) {
        setReauthed(true)
        setPw('')
      } else {
        setReauthError(t('settings.reauth.error'))
      }
    } catch {
      setReauthError(t('settings.reauth.error'))
    } finally {
      setVerifying(false)
    }
  }

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
            <p className="text-f-md text-muted mt-sp-2">
              {reauthed ? t('settings.deleteWarning') : t('settings.reauth.note')}
            </p>
          </div>
        </div>

        {!reauthed && (
          <div className="flex flex-col gap-sp-2">
            <label htmlFor="reauth-password" className="text-f-sm text-muted">
              {t('settings.reauth.password')}
            </label>
            <input
              id="reauth-password"
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setReauthError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleReauth() }}
              autoComplete="current-password"
              autoFocus
              className="w-full rounded-none px-sp-3 min-h-touch text-f-base text-fg bg-bg-3 outline-none focus:ring-1 focus:ring-lav-border"
              style={{ border: reauthError ? '1px solid var(--danger)' : '1px solid var(--bdr)' }}
              aria-label={t('settings.reauth.password')}
              aria-invalid={reauthError.length > 0}
            />
            {reauthError && <p className="text-f-sm text-danger" role="alert">{reauthError}</p>}
            <div className="flex gap-sp-3 mt-sp-2">
              <button
                onClick={onCancel}
                disabled={verifying}
                className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-muted hover:text-fg transition-colors"
                style={{ border: '1px solid var(--bdr)' }}
              >
                {t('settings.reauth.cancel')}
              </button>
              <button
                onClick={handleReauth}
                disabled={pw.length === 0 || verifying}
                className="flex-1 min-h-touch rounded-none text-f-md font-semibold text-fg transition-opacity"
                style={{
                  background: 'var(--lav-dim)',
                  border: '1px solid var(--lav-border)',
                  opacity: pw.length > 0 && !verifying ? 1 : 0.4,
                  cursor: pw.length > 0 && !verifying ? 'pointer' : 'not-allowed',
                }}
              >
                {verifying ? t('settings.reauth.verifying') : t('settings.reauth.continue')}
              </button>
            </div>
          </div>
        )}

        {reauthed && (
        <>
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
        </>
        )}
      </div>
    </div>
  )
}

// Segmented public/private (or on/off) toggle — matches transport radiogroup pattern
function SegToggle({
  value,
  onChange,
  onLabel,
  offLabel,
  ariaLabel,
}: {
  value: boolean
  onChange: (next: boolean) => void
  onLabel: string
  offLabel: string
  ariaLabel: string
}) {
  return (
    <div
      className="flex rounded-none overflow-hidden shrink-0"
      style={{ border: '1px solid var(--bdr)' }}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {[true, false].map((v) => {
        const active = value === v
        return (
          <button
            key={String(v)}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={[
              'px-sp-4 min-h-[36px] text-f-sm font-semibold transition-colors',
              active ? 'bg-lav-dim text-lav' : 'text-muted hover:text-fg',
            ].join(' ')}
          >
            {v ? onLabel : offLabel}
          </button>
        )
      })}
    </div>
  )
}

export default function SettingsPage() {
  const t = useTranslations('profile')
  const router = useRouter()
  const pathname = usePathname()
  const { data: profile } = useProfile()
  const { mutate } = useSWRConfig()
  const { showToast } = useToast()

  const [transport, setTransport] = useState<Transport>(profile?.transport_default ?? 'car')
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reauthRequired, setReauthRequired] = useState(false)

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [avatarBusy, setAvatarBusy] = useState(false)

  // Display name + bio
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [identityInit, setIdentityInit] = useState(false)
  const [identitySaving, setIdentitySaving] = useState(false)
  const [identitySaved, setIdentitySaved] = useState(false)

  // Notification prefs — notif_type → opt_out
  const [notifPrefs, setNotifPrefs] = useState<Record<NotifType, boolean> | null>(null)

  // Privacy — mirror profile once loaded
  const [tripsPublic, setTripsPublic] = useState(true)
  const [savedPublic, setSavedPublic] = useState(true)

  // Log out all devices
  const [signOutAllBusy, setSignOutAllBusy] = useState(false)

  // Hydrate local state from profile once it loads
  useEffect(() => {
    if (!profile) return
    setAvatarUrl(profile.avatar_url ?? null)
    setTripsPublic(profile.trips_public)
    setSavedPublic(profile.saved_public)
    if (!identityInit) {
      setDisplayName(profile.name ?? '')
      setBio(profile.bio ?? '')
      setIdentityInit(true)
    }
  }, [profile, identityInit])

  // Load notification prefs
  useEffect(() => {
    let cancelled = false
    fetch('/api/account/notification-prefs')
      .then((r) => r.json())
      .then((data: { prefs?: { notif_type: NotifType; opt_out: boolean }[] }) => {
        if (cancelled) return
        const map = {} as Record<NotifType, boolean>
        for (const type of NOTIF_TYPES) map[type] = false
        for (const p of data.prefs ?? []) map[p.notif_type] = p.opt_out
        setNotifPrefs(map)
      })
      .catch(() => { if (!cancelled) setNotifPrefs(null) })
    return () => { cancelled = true }
  }, [])

  const handleAvatarPick = () => fileInputRef.current?.click()

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting same file
    if (!file) return
    if (!AVATAR_TYPES.includes(file.type)) {
      showToast(t('settings.avatar.error'), 'error')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      showToast(t('settings.avatar.error'), 'error')
      return
    }
    const preview = URL.createObjectURL(file)
    const prev = avatarUrl
    setAvatarUrl(preview) // optimistic preview
    setAvatarBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/account/avatar', { method: 'POST', body: form })
      if (!res.ok) throw new Error()
      const body = await res.json()
      setAvatarUrl(body.avatar_url ?? preview)
      mutate('/api/profile', (p: typeof profile) => (p ? { ...p, avatar_url: body.avatar_url } : p), false)
      showToast(t('settings.avatar.uploaded'), 'success')
    } catch {
      setAvatarUrl(prev)
      showToast(t('settings.avatar.error'), 'error')
    } finally {
      URL.revokeObjectURL(preview)
      setAvatarBusy(false)
    }
  }

  const handleAvatarRemove = async () => {
    const prev = avatarUrl
    setAvatarUrl(null) // optimistic
    setAvatarBusy(true)
    try {
      const res = await fetch('/api/account/avatar', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      mutate('/api/profile', (p: typeof profile) => (p ? { ...p, avatar_url: null } : p), false)
      showToast(t('settings.avatar.removed'), 'success')
    } catch {
      setAvatarUrl(prev)
      showToast(t('settings.avatar.error'), 'error')
    } finally {
      setAvatarBusy(false)
    }
  }

  const handleIdentitySave = async () => {
    setIdentitySaving(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, bio }),
      })
      if (!res.ok) throw new Error()
      mutate('/api/profile', (p: typeof profile) => (p ? { ...p, name: displayName, bio } : p), false)
      setIdentitySaved(true)
      setTimeout(() => setIdentitySaved(false), 2000)
    } catch {
      showToast(t('settings.identity.error'), 'error')
    } finally {
      setIdentitySaving(false)
    }
  }

  const handleNotifToggle = async (type: NotifType) => {
    if (!notifPrefs) return
    const nextOptOut = !notifPrefs[type]
    setNotifPrefs({ ...notifPrefs, [type]: nextOptOut }) // optimistic
    try {
      const res = await fetch('/api/account/notification-prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notif_type: type, opt_out: nextOptOut }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setNotifPrefs((prev) => (prev ? { ...prev, [type]: !nextOptOut } : prev)) // revert
      showToast(t('settings.notifications.error'), 'error')
    }
  }

  const handlePrivacyToggle = async (field: 'trips_public' | 'saved_public', next: boolean) => {
    if (field === 'trips_public') setTripsPublic(next)
    else setSavedPublic(next)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: next }),
      })
      if (!res.ok) throw new Error()
      mutate('/api/profile', (p: typeof profile) => (p ? { ...p, [field]: next } : p), false)
    } catch {
      if (field === 'trips_public') setTripsPublic(!next)
      else setSavedPublic(!next)
      showToast(t('settings.privacy.error'), 'error')
    }
  }

  const handleSignOutAll = async () => {
    setSignOutAllBusy(true)
    try {
      const res = await fetch('/api/account/signout-all', { method: 'POST' })
      if (!res.ok) throw new Error()
      await signOut({ callbackUrl: '/' })
    } catch {
      setSignOutAllBusy(false)
      showToast(t('settings.signOutAllError'), 'error')
    }
  }

  const openDeleteFlow = async () => {
    // Recent-login check — if not recent, require password re-auth (SPEC-09 §Account deletion)
    try {
      const res = await fetch('/api/account/recent-login')
      const body = await res.json().catch(() => ({ recent: false }))
      setReauthRequired(!body.recent)
    } catch {
      setReauthRequired(true) // fail safe: require re-auth
    }
    setDeleteConfirmOpen(true)
  }

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
            {/* Avatar — H15 */}
            <div className="px-sp-4 py-sp-4 flex items-center gap-sp-4" aria-labelledby="avatar-label">
              <div
                className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-bg-3"
                style={{ border: '1px solid var(--bdr)' }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={t('settings.avatar.alt')} className="w-full h-full object-cover" />
                ) : (
                  <User size={28} strokeWidth={2} className="text-muted" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p id="avatar-label" className={label}>{t('settings.avatar.heading')}</p>
                <p className={sublabel}>{t('settings.avatar.hint')}</p>
              </div>
              <div className="flex items-center gap-sp-2 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarFile}
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <button
                  onClick={handleAvatarPick}
                  disabled={avatarBusy}
                  className="flex items-center gap-1.5 min-h-touch px-sp-3 rounded-none text-f-sm font-semibold text-lav bg-lav-dim hover:bg-lav-mid transition-colors"
                  style={{ border: '1px solid var(--lav-border)', opacity: avatarBusy ? 0.5 : 1 }}
                  aria-label={t('settings.avatar.upload')}
                >
                  <Upload size={14} strokeWidth={2} aria-hidden="true" />
                  {avatarBusy ? t('settings.avatar.uploading') : t('settings.avatar.upload')}
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleAvatarRemove}
                    disabled={avatarBusy}
                    className="flex items-center justify-center min-h-touch min-w-touch rounded-none text-muted hover:text-danger transition-colors"
                    style={{ border: '1px solid var(--bdr)' }}
                    aria-label={t('settings.avatar.remove')}
                  >
                    <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Display name + bio — H15 */}
            <div className="px-sp-4 py-sp-4 flex flex-col gap-sp-4">
              <div className="flex flex-col gap-sp-2">
                <label htmlFor="display-name" className={label}>
                  {t('settings.identity.displayName')}
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setIdentitySaved(false) }}
                  maxLength={40}
                  placeholder={t('settings.identity.displayNamePlaceholder')}
                  autoComplete="name"
                  className="w-full rounded-none px-sp-3 min-h-touch text-f-base text-fg bg-bg-3 outline-none focus:ring-1 focus:ring-lav-border"
                  style={{ border: '1px solid var(--bdr)' }}
                  aria-label={t('settings.identity.displayName')}
                />
              </div>
              <div className="flex flex-col gap-sp-2">
                <label htmlFor="bio" className={label}>
                  {t('settings.identity.bio')}
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => { setBio(e.target.value); setIdentitySaved(false) }}
                  maxLength={150}
                  rows={3}
                  placeholder={t('settings.identity.bioPlaceholder')}
                  className="w-full rounded-none px-sp-3 py-sp-2 text-f-base text-fg bg-bg-3 outline-none focus:ring-1 focus:ring-lav-border resize-none"
                  style={{ border: '1px solid var(--bdr)' }}
                  aria-label={t('settings.identity.bio')}
                />
                <p className={`${sublabel} self-end font-mono`} aria-live="polite">
                  {t('settings.identity.bioCounter', { count: bio.length })}
                </p>
              </div>
              <button
                onClick={handleIdentitySave}
                disabled={identitySaving}
                className={[
                  'self-start min-h-touch px-sp-6 rounded-full text-f-md font-semibold transition-all',
                  identitySaved ? 'bg-success/20 text-success' : 'bg-lav-dim text-lav hover:bg-lav-mid',
                ].join(' ')}
                style={{
                  border: identitySaved
                    ? '1px solid color-mix(in srgb, var(--success) 30%, transparent)'
                    : '1px solid var(--lav-border)',
                  opacity: identitySaving ? 0.5 : 1,
                }}
                aria-label={t('settings.identity.save')}
              >
                {identitySaving ? t('settings.identity.saving') : identitySaved ? (
                  <span className="flex items-center gap-1.5"><Check size={14} strokeWidth={2} aria-hidden="true" /> {t('settings.identity.saved')}</span>
                ) : t('settings.identity.save')}
              </button>
            </div>

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

        {/* Notifications — M9 */}
        <section aria-labelledby="notif-heading">
          <h2 id="notif-heading" className={sectionHeading}>
            {t('settings.notifications.heading')}
          </h2>
          <p className={`${sublabel} mb-sp-3`}>{t('settings.notifications.note')}</p>
          <div
            className="rounded-none overflow-hidden divide-y"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            {NOTIF_TYPES.map((type) => {
              // opt_out === false means the user receives it (toggle is "on")
              const on = notifPrefs ? !notifPrefs[type] : true
              return (
                <div key={type} className={`${row} px-sp-4 gap-sp-4`}>
                  <p className={label}>{t(`settings.notifications.types.${type}`)}</p>
                  <button
                    role="switch"
                    aria-checked={on}
                    aria-label={t(`settings.notifications.types.${type}`)}
                    disabled={!notifPrefs}
                    onClick={() => handleNotifToggle(type)}
                    className="relative shrink-0 w-11 h-6 rounded-full transition-colors min-w-[44px]"
                    style={{ background: on ? 'var(--lav)' : 'var(--bg-3)', border: '1px solid var(--bdr)', opacity: notifPrefs ? 1 : 0.5 }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform"
                      style={{ background: 'var(--bg)', transform: on ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Privacy — M9 */}
        <section aria-labelledby="privacy-heading">
          <h2 id="privacy-heading" className={sectionHeading}>
            {t('settings.privacy.heading')}
          </h2>
          <p className={`${sublabel} mb-sp-3`}>{t('settings.privacy.note')}</p>
          <div
            className="rounded-none overflow-hidden divide-y"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
          >
            <div className={`${row} px-sp-4 gap-sp-4`}>
              <div>
                <p className={label}>{t('settings.privacy.trips')}</p>
                <p className={sublabel}>{t('settings.privacy.tripsNote')}</p>
              </div>
              <SegToggle
                value={tripsPublic}
                onChange={(next) => handlePrivacyToggle('trips_public', next)}
                onLabel={t('settings.privacy.public')}
                offLabel={t('settings.privacy.private')}
                ariaLabel={t('settings.privacy.trips')}
              />
            </div>
            <div className={`${row} px-sp-4 gap-sp-4`}>
              <div>
                <p className={label}>{t('settings.privacy.saved')}</p>
                <p className={sublabel}>{t('settings.privacy.savedNote')}</p>
              </div>
              <SegToggle
                value={savedPublic}
                onChange={(next) => handlePrivacyToggle('saved_public', next)}
                onLabel={t('settings.privacy.public')}
                offLabel={t('settings.privacy.private')}
                ariaLabel={t('settings.privacy.saved')}
              />
            </div>
          </div>
        </section>

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

            {/* Log out all devices — M9 */}
            <button
              onClick={handleSignOutAll}
              disabled={signOutAllBusy}
              className="w-full min-h-touch rounded-none text-left px-sp-4 hover:opacity-80 transition-opacity"
              style={{ border: '1px solid var(--bdr)', background: 'var(--bg-2)', opacity: signOutAllBusy ? 0.5 : 1 }}
            >
              <span className="block text-f-sm font-semibold text-fg">{t('settings.signOutAll')}</span>
              <span className="block text-f-xs text-muted mt-0.5">{t('settings.signOutAllNote')}</span>
            </button>

            {/* Delete account */}
            <button
              onClick={openDeleteFlow}
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
          reauthRequired={reauthRequired}
          t={t}
        />
      )}
    </>
  )
}
