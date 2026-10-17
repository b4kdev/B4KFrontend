'use client'

import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Clock, Compass, Mail, MapPin, Route, Search, TrendingUp, X } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { ProviderLogo } from './Brand'
import { Button } from './Button'
import { Checkbox } from './Choice'
import { Chip } from './Chip'
import { StatCounter } from './Content'
import { Fieldset } from './FormGroups'
import { IconButton } from './IconButton'
import { Image } from './Image'
import { Breadcrumbs, Tabs } from './NavGroups'
import { Select } from './Select'
import { Separator } from './Separator'
import { TextInput } from './TextInput'
import { FOCUS_RING_INSET } from './styles'

// Account, consent and search organisms (UI-82, UI-99, PD-37 to PD-43; Figma Organisms).

export type CookieBannerProps = {
  /** Figma Type. Banner: bottom bar on first visit. Preferences: card on the Cookie Policy page. */
  type?: 'banner' | 'preferences'
  label: string
  message: ReactNode
  learnMore: { href: string; label: string }
  acceptLabel: string
  declineLabel: string
  onAccept: () => void
  onDecline: () => void
  /** Preferences: Figma Show status, e.g. "Accepted". */
  status?: string
  title?: string
}

/** Cookie banner (UI-82, ADD-57): Decline and Accept with equal weight; no close X; nothing on until a choice. */
export function CookieBanner({ type = 'banner', label, message, learnMore, acceptLabel, declineLabel, onAccept, onDecline, status, title }: CookieBannerProps) {
  const buttons = (
    <div className="flex gap-[var(--gap-sm)] max-md:[&>*]:flex-1">
      <Button variant="secondary" size="md" onClick={onDecline}>{declineLabel}</Button>
      <Button variant="secondary" size="md" onClick={onAccept}>{acceptLabel}</Button>
    </div>
  )
  if (type === 'preferences') {
    return (
      <section aria-label={label} className="flex flex-col gap-[var(--space-3)] border border-ui-border bg-ui-bg-raised p-[var(--space-4)] text-ui-fg">
        <div className="flex items-center gap-[var(--space-2)]">
          <h2 className="flex-1 type-title-card">{title}</h2>
          {status ? <Badge>{status}</Badge> : null}
        </div>
        <p className="type-body-base text-ui-fg-muted">{message}</p>
        {buttons}
      </section>
    )
  }
  return (
    <section role="region" aria-label={label} tabIndex={-1} className="fixed inset-x-0 bottom-0 z-40 border-t border-ui-border bg-ui-bg-raised px-[var(--space-4)] py-[var(--space-4)] pb-[calc(var(--space-4)+env(safe-area-inset-bottom))] text-ui-fg outline-none">
      <div className="mx-auto flex max-w-[960px] items-center gap-[var(--space-4)] max-md:flex-col max-md:items-stretch">
        <p className="flex-1 type-body-base">
          {message}{' '}
          <IntlLink href={learnMore.href} className="underline underline-offset-2 hover:text-ui-link-hover">{learnMore.label}</IntlLink>
        </p>
        {buttons}
      </div>
    </section>
  )
}

export type SignInView = 'providers' | 'sign-in' | 'sign-up' | 'forgot' | 'check-email' | 'new-password'

export type SignInCardProps = {
  view: SignInView
  onViewChange: (v: SignInView) => void
  /** Figma Title: changes with the reason, e.g. "Sign in to save places". */
  title: string
  /** Figma Show close (gate only). */
  onClose?: () => void
  /** Figma Show guest option. */
  onGuest?: () => void
  /** Figma Show draft notice. */
  draftNotice?: string
  onGoogle: () => void
  onSubmit: (view: SignInView, values: Record<string, string>) => void
  busy?: boolean
  error?: string
  /** Check email: the address. */
  email?: string
  labels: {
    close: string
    google: string
    email: string
    signIn: string
    signUp: string
    password: string
    newPassword: string
    confirmPassword: string
    passwordHint: string
    forgot: string
    sendLink: string
    checkEmailTitle: string
    checkEmailBody: (email: string) => string
    resend: string
    savePassword: string
    newPasswordBody: string
    back: string
    guest: string
    or: string
    tabs: string
  }
}

/** Sign-in card (UI-82, ADD-63): providers, sign in / sign up, forgot, check email, new password. */
export function SignInCard({ view, onViewChange, title, onClose, onGuest, draftNotice, onGoogle, onSubmit, busy, error, email = '', labels }: SignInCardProps) {
  const id = useId()
  const [values, setValues] = useState<Record<string, string>>({ email })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(view, values)
  }
  const back = view !== 'providers' && view !== 'check-email' ? <IconButton label={labels.back} icon={<ArrowLeft />} onClick={() => onViewChange('providers')} className="-ml-[var(--space-2)]" /> : null
  return (
    <div className="flex w-full max-w-[400px] flex-col gap-[var(--space-5)] rounded-2xl border border-ui-border bg-ui-bg-elevated p-[var(--space-6)] text-ui-fg">
      <div className="flex items-center gap-[var(--space-2)]">
        {back}
        <h2 id={id} className="flex-1 type-display-h4">{view === 'check-email' ? labels.checkEmailTitle : view === 'new-password' ? labels.newPassword : title}</h2>
        {onClose ? <IconButton label={labels.close} icon={<X />} onClick={onClose} className="-mr-[var(--space-2)]" /> : null}
      </div>
      {draftNotice && view === 'providers' ? <p className="bg-ui-state-selected px-[var(--space-3)] py-[var(--space-2)] type-body-caption">{draftNotice}</p> : null}
      {error ? <p role="alert" className="type-body-caption text-ui-danger">{error}</p> : null}
      {view === 'providers' ? (
        <div className="flex flex-col gap-[var(--space-3)]">
          <Button variant="secondary" leadingIcon={<ProviderLogo />} onClick={onGoogle} className="w-full">{labels.google}</Button>
          <Separator orientation="with-text" text={labels.or} />
          <Button variant="secondary" leadingIcon={<Mail />} onClick={() => onViewChange('sign-in')} className="w-full">{labels.email}</Button>
          {onGuest ? <Button variant="ghost" size="md" onClick={onGuest} className="w-full">{labels.guest}</Button> : null}
        </div>
      ) : view === 'sign-in' || view === 'sign-up' ? (
        <form noValidate onSubmit={submit} aria-labelledby={id} className="flex flex-col gap-[var(--space-4)]">
          <Tabs label={labels.tabs} width="equal" value={view} onValueChange={(v) => onViewChange(v as SignInView)} tabs={[{ id: 'sign-in', label: labels.signIn }, { id: 'sign-up', label: labels.signUp }]} />
          <TextInput label={labels.email} showLabel type="email" autoComplete="email" required value={values.email ?? ''} onChange={set('email')} />
          <TextInput label={labels.password} showLabel type="password" autoComplete={view === 'sign-in' ? 'current-password' : 'new-password'} required value={values.password ?? ''} onChange={set('password')} help={view === 'sign-up' ? labels.passwordHint : undefined} />
          {view === 'sign-in' ? <button type="button" onClick={() => onViewChange('forgot')} className="self-start type-body-caption text-ui-fg-muted underline underline-offset-2 hover:text-ui-fg">{labels.forgot}</button> : null}
          <Button type="submit" loading={busy} className="w-full">{view === 'sign-in' ? labels.signIn : labels.signUp}</Button>
        </form>
      ) : view === 'forgot' ? (
        <form noValidate onSubmit={submit} className="flex flex-col gap-[var(--space-4)]">
          <TextInput label={labels.email} showLabel type="email" autoComplete="email" required value={values.email ?? ''} onChange={set('email')} />
          <Button type="submit" loading={busy} className="w-full">{labels.sendLink}</Button>
        </form>
      ) : view === 'check-email' ? (
        <div className="flex flex-col gap-[var(--space-4)]">
          <p className="type-body-base text-ui-fg-muted">{labels.checkEmailBody(email)}</p>
          <Button variant="secondary" onClick={() => onSubmit('forgot', values)} loading={busy} className="w-full">{labels.resend}</Button>
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="flex flex-col gap-[var(--space-4)]">
          <p className="type-body-base text-ui-fg-muted">{labels.newPasswordBody}</p>
          <TextInput label={labels.newPassword} showLabel type="password" autoComplete="new-password" required value={values.password ?? ''} onChange={set('password')} help={labels.passwordHint} />
          <TextInput label={labels.confirmPassword} showLabel type="password" autoComplete="new-password" required value={values.confirm ?? ''} onChange={set('confirm')} />
          <Button type="submit" loading={busy} className="w-full">{labels.savePassword}</Button>
        </form>
      )}
    </div>
  )
}

export type ConsentItem = { id: string; label: string; required: boolean; viewHref?: string }

export type ConsentStepProps = {
  title: string
  items: ConsentItem[]
  checked: Record<string, boolean>
  onCheckedChange: (next: Record<string, boolean>) => void
  onView: (item: ConsentItem) => void
  onContinue: () => void
  onCancel: () => void
  labels: { agreeAll: string; required: string; optional: string; view: string; continue: string; cancel: string; back: string; legend: string }
}

/** Consent step (UI-82, ADD-74): agree to all, required and optional items; Continue waits for every required one. */
export function ConsentStep({ title, items, checked, onCheckedChange, onView, onContinue, onCancel, labels }: ConsentStepProps) {
  const all = items.every((i) => checked[i.id])
  const some = items.some((i) => checked[i.id])
  const ready = items.filter((i) => i.required).every((i) => checked[i.id])
  return (
    <div className="flex w-full max-w-[400px] flex-col gap-[var(--space-5)] text-ui-fg">
      <div className="flex items-center gap-[var(--space-2)]">
        <IconButton label={labels.back} icon={<ArrowLeft />} onClick={onCancel} className="-ml-[var(--space-2)]" />
        <h1 className="type-display-h3">{title}</h1>
      </div>
      <form noValidate onSubmit={(e) => { e.preventDefault(); if (ready) onContinue() }} className="flex flex-col gap-[var(--space-4)]">
        <div className="border border-ui-border px-[var(--space-3)]">
          <Checkbox label={<span className="type-title-card">{labels.agreeAll}</span>} checked={all} indeterminate={some && !all} onChange={() => onCheckedChange(Object.fromEntries(items.map((i) => [i.id, !all])))} />
        </div>
        <Fieldset legend={labels.legend}>
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-[var(--space-2)]">
              <Checkbox
                className="flex-1"
                aria-required={i.required || undefined}
                checked={!!checked[i.id]}
                onChange={(e) => onCheckedChange({ ...checked, [i.id]: e.target.checked })}
                label={<span className="inline-flex flex-wrap items-center gap-[var(--space-2)]">{i.label}<Badge variant={i.required ? 'normal' : 'outline'}>{i.required ? labels.required : labels.optional}</Badge></span>}
              />
              {i.viewHref ? <button type="button" onClick={() => onView(i)} className="shrink-0 type-body-caption text-ui-fg-muted underline underline-offset-2 hover:text-ui-fg">{labels.view}</button> : null}
            </div>
          ))}
        </Fieldset>
        <Button type="submit" disabled={!ready} className="w-full">{labels.continue}</Button>
        <Button variant="ghost" size="md" onClick={onCancel} className="w-full">{labels.cancel}</Button>
      </form>
    </div>
  )
}

export type FilterGroup = { id: string; label: string; multi?: boolean; options: { id: string; label: string; count?: number }[] }

export type SearchFiltersProps = {
  viewport: 'desktop' | 'mobile'
  groups: FilterGroup[]
  value: Record<string, string[]>
  onValueChange: (v: Record<string, string[]>) => void
  sort?: { label: string; options: { id: string; label: string }[]; value: string; onValueChange: (v: string) => void }
  labels: { title: string; clearAll: string; showResults?: string }
  onShowResults?: () => void
}

/** Search filters (UI-82, PD-42): chip groups; desktop applies as tapped, mobile has Show N results. */
export function SearchFilters({ viewport, groups, value, onValueChange, sort, labels, onShowResults }: SearchFiltersProps) {
  const toggle = (g: FilterGroup, id: string) => {
    const cur = value[g.id] ?? []
    const next = g.multi ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id]
    onValueChange({ ...value, [g.id]: next })
  }
  return (
    <div className="flex flex-col gap-[var(--space-5)] p-[var(--space-4)] text-ui-fg">
      <div className="flex items-center justify-between">
        <h2 className="type-title-card">{labels.title}</h2>
        <button type="button" onClick={() => onValueChange({})} className="type-label-button text-ui-link hover:text-ui-link-hover">{labels.clearAll}</button>
      </div>
      {groups.map((g) => (
        <fieldset key={g.id} className="flex flex-col gap-[var(--space-2)]">
          <legend className="mb-[var(--space-2)] type-body-label text-ui-fg-muted">{g.label}</legend>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {g.options.map((o) => <Chip key={o.id} selected={(value[g.id] ?? []).includes(o.id)} count={o.count} onClick={() => toggle(g, o.id)}>{o.label}</Chip>)}
          </div>
        </fieldset>
      ))}
      {sort ? (
        <Select label={sort.label} showLabel size="md" value={sort.value} onChange={(e) => sort.onValueChange(e.target.value)}>
          {sort.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </Select>
      ) : null}
      {viewport === 'mobile' && onShowResults ? <Button onClick={onShowResults} className="w-full">{labels.showResults}</Button> : null}
    </div>
  )
}

export type ProfileHeaderProps = {
  viewport: 'desktop' | 'mobile'
  name: string
  avatarSrc?: string | null
  stats: { number: ReactNode; label: string }[]
  /** Figma Show badges: pinned Achievement badges. */
  badges?: ReactNode
  /** Owner: Edit profile; Visitor: Share (pass the Button). */
  action: ReactNode
  tabs?: ReactNode
}

/** Profile header (UI-82, ADD-67): avatar, name (the page h1), stats, pinned badges, action. */
export function ProfileHeader({ viewport, name, avatarSrc, stats, badges, action, tabs }: ProfileHeaderProps) {
  return (
    <header className="flex flex-col gap-[var(--space-4)] text-ui-fg">
      <div className="flex items-center gap-[var(--space-4)]">
        <Avatar size={viewport === 'desktop' ? 'xl' : 'lg'} src={avatarSrc} name={name} decorative />
        <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-2)]">
          <h1 className={viewport === 'desktop' ? 'type-display-h2' : 'type-display-h3'}>{name}</h1>
          <div className="flex flex-wrap items-baseline gap-[var(--space-2)]">
            {stats.map((s, i) => <StatCounter key={s.label} number={s.number} label={s.label} separator={i > 0} />)}
          </div>
        </div>
        {viewport === 'desktop' ? action : null}
      </div>
      {viewport === 'mobile' ? action : null}
      {badges ? <div className="flex gap-[var(--space-3)] overflow-x-auto">{badges}</div> : null}
      {tabs}
    </header>
  )
}

export type LegalDocumentProps = {
  viewport: 'desktop' | 'mobile'
  breadcrumbs: { label: string; href?: string }[]
  title: string
  updated: string
  contact?: ReactNode
  sections: { id: string; title: string; body: ReactNode }[]
  currentSection?: string
  labels: { breadcrumb: string; contents: string; onThisPage: string }
}

/** Legal document (UI-82, ADD-73): title, updated, numbered sections; contents list (desktop) or a Select (phones). */
export function LegalDocument({ viewport, breadcrumbs, title, updated, contact, sections, currentSection, labels }: LegalDocumentProps) {
  return (
    <article className="flex flex-col gap-[var(--space-6)] text-ui-fg">
      <Breadcrumbs label={labels.breadcrumb} items={breadcrumbs} />
      <header className="flex flex-col gap-[var(--space-2)]">
        <h1 className="type-display-h1">{title}</h1>
        <p className="type-body-caption text-ui-fg-muted">{updated}</p>
        {contact ? <p className="type-body-caption text-ui-fg-muted">{contact}</p> : null}
      </header>
      {viewport === 'mobile' ? (
        <Select label={labels.onThisPage} showLabel size="md" defaultValue="" onChange={(e) => document.getElementById(e.target.value)?.scrollIntoView({ behavior: 'smooth' })}>
          <option value="" disabled hidden>{labels.onThisPage}</option>
          {sections.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.title}</option>)}
        </Select>
      ) : null}
      <div className="flex gap-[var(--space-12)]">
        {viewport === 'desktop' ? (
          <nav aria-label={labels.contents} className="sticky top-[var(--space-6)] w-[240px] shrink-0 self-start">
            <ol className="flex flex-col gap-[var(--space-2)] type-body-caption">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} aria-current={currentSection === s.id ? 'location' : undefined} className={cn('hover:text-ui-fg', currentSection === s.id ? 'text-ui-fg' : 'text-ui-fg-muted')}>{i + 1}. {s.title}</a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div className="flex max-w-[720px] flex-1 flex-col">
          {sections.map((s, i) => (
            <section key={s.id} aria-labelledby={s.id} className="flex flex-col gap-[var(--space-3)]">
              {i > 0 ? <Separator className="my-[var(--space-6)]" /> : null}
              <h2 id={s.id} className="scroll-mt-[var(--space-6)] type-display-h3">{i + 1}. {s.title}</h2>
              <div className="type-body-long text-ui-fg-muted [&_p+p]:mt-[var(--space-3)]">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </article>
  )
}

export type SearchSuggestionsProps = {
  viewport: 'desktop' | 'mobile'
  /** Figma State. */
  state: 'typing' | 'empty'
  query: string
  places?: { id: string; name: string; meta: string; imageSrc?: string | null; href: string }[]
  plans?: { id: string; name: string; meta: string; href: string }[]
  explore?: { id: string; name: string; href: string }[]
  recent?: { id: string; text: string }[]
  trending?: { id: string; text: string }[]
  categories?: { id: string; name: string; href: string }[]
  onSearch: (q: string) => void
  onRemoveRecent?: (id: string) => void
  onClearRecent?: () => void
  labels: { searchFor: (q: string) => string; places: string; plans: string; explore: string; recent: string; clearAll: string; trending: string; browse: string; remove: (t: string) => string }
}

function bold(text: string, q: string) {
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (!q || i < 0) return text
  return <>{text.slice(0, i)}<strong className="font-[var(--font-weight-bold)]">{text.slice(i, i + q.length)}</strong>{text.slice(i + q.length)}</>
}

/** Search suggestions (PD-43, UI-99): Typing = search for, places, plans, explore; Empty = recent, trending, browse. */
export function SearchSuggestions({ viewport, state, query, places = [], plans = [], explore = [], recent = [], trending = [], categories = [], onSearch, onRemoveRecent, onClearRecent, labels }: SearchSuggestionsProps) {
  const row = cn('flex min-h-[var(--target-touch-min)] w-full items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-2)] text-left hover:bg-ui-state-hover', FOCUS_RING_INSET)
  const heading = 'px-[var(--space-4)] pb-[var(--space-1)] pt-[var(--space-3)] type-body-label text-ui-fg-muted'
  return (
    <div className={cn('flex flex-col py-[var(--space-2)] text-ui-fg', viewport === 'desktop' ? 'w-[560px] rounded-2xl border border-ui-border bg-ui-bg-elevated' : 'w-full bg-ui-bg')}>
      {state === 'typing' ? (
        <>
          <button type="button" className={row} onClick={() => onSearch(query)}>
            <Search aria-hidden className="size-[var(--icon-size-sm)] text-ui-fg-muted" />
            <span className="type-body-base">{labels.searchFor(query)}</span>
          </button>
          {places.length ? <p className={heading}>{labels.places}</p> : null}
          {places.slice(0, 3).map((p) => (
            <IntlLink key={p.id} href={p.href} className={row}>
              <Image ratio="1:1" src={p.imageSrc} alt="" sizes="40px" className="w-[var(--control-height-md)] shrink-0" />
              <span className="flex min-w-0 flex-col"><span className="truncate type-body-base">{bold(p.name, query)}</span><span className="truncate type-body-caption text-ui-fg-muted">{p.meta}</span></span>
            </IntlLink>
          ))}
          {plans.length ? <p className={heading}>{labels.plans}</p> : null}
          {plans.map((p) => (
            <IntlLink key={p.id} href={p.href} className={row}>
              <Route aria-hidden className="size-[var(--icon-size-sm)] text-ui-fg-muted" />
              <span className="flex min-w-0 flex-col"><span className="truncate type-body-base">{bold(p.name, query)}</span><span className="truncate type-body-caption text-ui-fg-muted">{p.meta}</span></span>
            </IntlLink>
          ))}
          {explore.length ? <p className={heading}>{labels.explore}</p> : null}
          {explore.map((p) => (
            <IntlLink key={p.id} href={p.href} className={row}>
              <Compass aria-hidden className="size-[var(--icon-size-sm)] text-ui-fg-muted" />
              <span className="truncate type-body-base">{bold(p.name, query)}</span>
            </IntlLink>
          ))}
        </>
      ) : (
        <>
          {recent.length ? (
            <div className="flex items-center justify-between pr-[var(--space-4)]">
              <p className={heading}>{labels.recent}</p>
              {onClearRecent ? <button type="button" onClick={onClearRecent} className="pt-[var(--space-2)] type-body-caption text-ui-fg-muted underline-offset-2 hover:text-ui-fg hover:underline">{labels.clearAll}</button> : null}
            </div>
          ) : null}
          {recent.map((r) => (
            <div key={r.id} className="flex items-center hover:bg-ui-state-hover">
              <button type="button" className={cn(row, 'hover:bg-transparent')} onClick={() => onSearch(r.text)}>
                <Clock aria-hidden className="size-[var(--icon-size-sm)] text-ui-fg-muted" />
                <span className="type-body-base">{r.text}</span>
              </button>
              {onRemoveRecent ? <IconButton label={labels.remove(r.text)} icon={<X />} onClick={() => onRemoveRecent(r.id)} className="mr-[var(--space-2)]" /> : null}
            </div>
          ))}
          {trending.length ? <p className={heading}>{labels.trending}</p> : null}
          {trending.length ? (
            <div className="flex flex-wrap gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-1)]">
              {trending.map((t) => <Chip key={t.id} leadingIcon={<TrendingUp />} onClick={() => onSearch(t.text)}>{t.text}</Chip>)}
            </div>
          ) : null}
          {categories.length ? <p className={heading}>{labels.browse}</p> : null}
          {categories.map((c) => (
            <IntlLink key={c.id} href={c.href} className={row}>
              <MapPin aria-hidden className="size-[var(--icon-size-sm)] text-ui-fg-muted" />
              <span className="type-body-base">{c.name}</span>
            </IntlLink>
          ))}
        </>
      )}
    </div>
  )
}
