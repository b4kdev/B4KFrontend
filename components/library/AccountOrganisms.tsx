'use client'

import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock, Compass, Mail, Route, Search, X } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { Logo, ProviderLogo } from './Brand'
import { Button } from './Button'
import { Checkbox } from './Choice'
import { Chip } from './Chip'
import { StatCounter } from './Content'
import { IconButton } from './IconButton'
import { Image } from './Image'
import { Breadcrumbs, Tabs } from './NavGroups'
import { Select } from './Select'
import { Separator } from './Separator'
import { TextInput } from './TextInput'
import { FOCUS_RING_INSET } from './styles'

// Account, consent and search organisms (Figma Organisms).

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
  className?: string
}

/** Cookie banner: Decline and Accept with equal weight; no close X; nothing on until a choice. */
export function CookieBanner({ type = 'banner', label, message, learnMore, acceptLabel, declineLabel, onAccept, onDecline, status, title, className }: CookieBannerProps) {
  const buttons = (
    <div className="flex gap-[var(--gap-sm)] max-md:[&>*]:flex-1">
      <Button variant="secondary" size="md" onClick={onDecline}>{declineLabel}</Button>
      <Button size="md" onClick={onAccept}>{acceptLabel}</Button>
    </div>
  )
  if (type === 'preferences') {
    return (
      <section aria-label={label} className="flex flex-col gap-[var(--space-3)] border border-ui-border bg-ui-bg-raised p-[var(--space-5)] text-ui-fg">
        <div className="flex items-center gap-[var(--space-3)]">
          <h2 className="flex-1 type-title-card">{title}</h2>
          {status ? <Badge leadingIcon={<Check aria-hidden />}>{status}</Badge> : null}
        </div>
        <p className="type-body-base text-ui-fg-muted">{message}</p>
        {buttons}
      </section>
    )
  }
  return (
    <section role="region" aria-label={label} tabIndex={-1} className={cn('fixed inset-x-0 bottom-0 z-40 border-t border-ui-border bg-ui-bg-raised px-[var(--space-4)] py-[var(--space-4)] pb-[calc(var(--space-4)+env(safe-area-inset-bottom))] text-ui-fg outline-none', className)}>
      <div className="mx-auto flex max-w-[960px] items-center gap-[var(--space-4)] max-md:flex-col max-md:items-stretch max-md:gap-[var(--space-3)]">
        <p className="flex-1 type-body-base">
          {message}{' '}
          <IntlLink href={learnMore.href} className="underline underline-offset-2 hover:text-ui-link-hover">{learnMore.label}</IntlLink>
        </p>
        {buttons}
      </div>
    </section>
  )
}

export type SignInView = 'providers' | 'sign-in' | 'sign-up' | 'forgot' | 'check-email' | 'new-password' | 'link-expired'

export type SignInCardProps = {
  view: SignInView
  onViewChange: (v: SignInView) => void
  /** Figma Title: changes with the reason, e.g. "Sign in to save places". */
  title: string
  /** Figma Subtitle under the title (body/base, fg-muted); left out, none. */
  subtitle?: string
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
  /** New password: the error under Confirm password (Passwords don't match). */
  confirmError?: string
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
    /** Sign in / Sign up: the bottom Ghost back to the providers ("Other sign-in options"). */
    back: string
    /** Forgot / Check email: the bottom Ghost back to sign in ("Back to sign in"); left out, Forgot goes back with `back`. */
    backToSignIn?: string
    guest: string
    or: string
    tabs: string
    /** Figma per-view Title and Subtitle; left out, Sign in and Sign up use `title` and no subtitle. */
    signInTitle?: string
    signInBody?: string
    signUpTitle?: string
    signUpBody?: string
    forgotTitle?: string
    forgotBody?: string
    /** The Email field label; left out, `email`. */
    emailField?: string
    /** Figma placeholders: Password on Sign in, Password on Sign up and New password, Confirm password. */
    passwordPlaceholder?: string
    newPasswordPlaceholder?: string
    confirmPlaceholder?: string
  }
}

/** Sign-in card: providers, sign in / sign up, forgot, check email, new password. */
export function SignInCard({ view, onViewChange, title, subtitle, onClose, onGuest, draftNotice, onGoogle, onSubmit, busy, error, email = '', confirmError, labels }: SignInCardProps) {
  const id = useId()
  const [values, setValues] = useState<Record<string, string>>({ email })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(view, values)
  }
  // Figma bottom Back (Ghost md, arrow-left 16): Sign in/Sign up → providers; Forgot/Check email → sign in.
  const back: { label: string; to: SignInView } | null =
    view === 'sign-in' || view === 'sign-up'
      ? { label: labels.back, to: 'providers' }
      : (view === 'forgot' || view === 'check-email' || view === 'link-expired') && labels.backToSignIn
        ? { label: labels.backToSignIn, to: 'sign-in' }
        : view === 'forgot'
          ? { label: labels.back, to: 'providers' }
          : null
  const guest = onGuest && view !== 'new-password' && view !== 'link-expired'
  // Figma Title and Subtitle per view; New password takes `title` with its body as the subtitle.
  const heading =
    view === 'check-email' ? labels.checkEmailTitle
      : view === 'sign-in' ? labels.signInTitle ?? title
        : view === 'sign-up' ? labels.signUpTitle ?? title
          : view === 'forgot' ? labels.forgotTitle ?? title
            : title
  const sub =
    view === 'providers' || view === 'link-expired' ? subtitle
      : view === 'sign-in' ? labels.signInBody
        : view === 'sign-up' ? labels.signUpBody
          : view === 'forgot' ? labels.forgotBody
            : view === 'new-password' ? labels.newPasswordBody
              : view === 'check-email' ? labels.checkEmailBody(email)
                : undefined
  const emailField = labels.emailField ?? labels.email
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-[var(--space-4)] rounded-2xl border border-ui-border bg-ui-bg-elevated p-[var(--space-6)] text-ui-fg">
      {/* Figma Top row: Logo wordmark 24 + Close Ghost 40 (no Close on New password). */}
      <div className="flex items-center justify-between gap-[var(--space-2)]">
        <Logo />
        {onClose && view !== 'new-password' && view !== 'link-expired' ? <IconButton label={labels.close} icon={<X />} onClick={onClose} /> : null}
      </div>
      {view === 'check-email' ? <Mail aria-hidden className="size-[var(--icon-size-2xl)]" /> : null}
      <div className="flex flex-col gap-[var(--space-2)]">
        <h2 id={id} className="type-display-h4">{heading}</h2>
        {sub ? <p className="type-body-base text-ui-fg-muted">{sub}</p> : null}
      </div>
      {draftNotice && view === 'providers' ? (
        <p className="flex items-start gap-[var(--space-2)] bg-ui-bg-sunken p-[var(--space-3)] type-body-caption text-ui-fg-muted">
          <Route aria-hidden className="size-[var(--icon-size-sm)] shrink-0" />
          {draftNotice}
        </p>
      ) : null}
      {error ? <p role="alert" className="type-body-caption text-ui-danger">{error}</p> : null}
      {view === 'providers' ? (
        <div className="flex flex-col gap-[var(--space-2)]">
          <Button leadingIcon={<ProviderLogo />} onClick={onGoogle} className="w-full">{labels.google}</Button>
          <Button variant="secondary" leadingIcon={<Mail />} onClick={() => onViewChange('sign-in')} className="w-full">{labels.email}</Button>
        </div>
      ) : view === 'sign-in' || view === 'sign-up' ? (
        <form noValidate onSubmit={submit} aria-labelledby={id} className="flex flex-col gap-[var(--space-4)]">
          <Tabs label={labels.tabs} width="equal" baseline={false} value={view} onValueChange={(v) => onViewChange(v as SignInView)} tabs={[{ id: 'sign-in', label: labels.signIn }, { id: 'sign-up', label: labels.signUp }]} />
          <TextInput label={emailField} showLabel type="email" autoComplete="email" required value={values.email ?? ''} onChange={set('email')} />
          <TextInput label={labels.password} showLabel type="password" autoComplete={view === 'sign-in' ? 'current-password' : 'new-password'} required placeholder={view === 'sign-in' ? labels.passwordPlaceholder : labels.newPasswordPlaceholder} value={values.password ?? ''} onChange={set('password')} help={view === 'sign-up' ? labels.passwordHint : undefined} />
          {view === 'sign-in' ? <button type="button" onClick={() => onViewChange('forgot')} className="self-start type-body-link text-ui-link underline underline-offset-2 hover:text-ui-link-hover">{labels.forgot}</button> : null}
          <Button type="submit" loading={busy} className="w-full">{view === 'sign-in' ? labels.signIn : labels.signUp}</Button>
        </form>
      ) : view === 'forgot' ? (
        <form noValidate onSubmit={submit} className="flex flex-col gap-[var(--space-4)]">
          <TextInput label={emailField} showLabel type="email" autoComplete="email" required value={values.email ?? ''} onChange={set('email')} />
          <Button type="submit" loading={busy} className="w-full">{labels.sendLink}</Button>
        </form>
      ) : view === 'link-expired' ? (
        // Figma New password card with its fields hidden: the title and subtitle say why, one button asks again.
        <Button onClick={() => onSubmit('link-expired', values)} loading={busy} className="w-full">{labels.sendLink}</Button>
      ) : view === 'check-email' ? (
        <Button variant="secondary" onClick={() => onSubmit('forgot', values)} loading={busy} className="w-full">{labels.resend}</Button>
      ) : (
        <form noValidate onSubmit={submit} className="flex flex-col gap-[var(--space-4)]">
          <TextInput label={labels.newPassword} showLabel type="password" autoComplete="new-password" required placeholder={labels.newPasswordPlaceholder} value={values.password ?? ''} onChange={set('password')} />
          <TextInput label={labels.confirmPassword} showLabel type="password" autoComplete="new-password" required placeholder={labels.confirmPlaceholder} value={values.confirm ?? ''} onChange={set('confirm')} error={confirmError} />
          <Button type="submit" loading={busy} className="w-full">{labels.savePassword}</Button>
        </form>
      )}
      {/* Figma Back and Guest: Ghost md 40, hugging at the start; Guest in every view but New password. */}
      {back || guest ? (
        <div className="flex flex-col items-start gap-[var(--space-2)]">
          {back ? <Button variant="ghost" size="md" leadingIcon={<ArrowLeft />} onClick={() => onViewChange(back.to)}>{back.label}</Button> : null}
          {guest ? <Button variant="ghost" size="md" onClick={onGuest}>{labels.guest}</Button> : null}
        </div>
      ) : null}
    </div>
  )
}

export type ConsentItem = { id: string; label: string; required: boolean; viewHref?: string }

export type ConsentStepProps = {
  title: string
  /** Figma Subtitle under the title (body/base, fg-muted); left out, none. */
  subtitle?: string
  /** Figma Footnote under the buttons (caption, fg-muted), e.g. "Under 14? …"; left out, none. */
  footnote?: ReactNode
  items: ConsentItem[]
  checked: Record<string, boolean>
  onCheckedChange: (next: Record<string, boolean>) => void
  onView: (item: ConsentItem) => void
  onContinue: () => void
  onCancel: () => void
  labels: { agreeAll: string; required: string; optional: string; view: string; continue: string; cancel: string; back: string; legend: string }
}

/** Consent step: agree to all, required and optional items; Continue waits for every required one. */
export function ConsentStep({ title, subtitle, footnote, items, checked, onCheckedChange, onView, onContinue, onCancel, labels }: ConsentStepProps) {
  const all = items.every((i) => checked[i.id])
  const some = items.some((i) => checked[i.id])
  const ready = items.filter((i) => i.required).every((i) => checked[i.id])
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-[var(--space-4)] rounded-2xl border border-ui-border bg-ui-bg-elevated p-[var(--space-6)] text-ui-fg">
      <IconButton label={labels.back} icon={<ArrowLeft />} onClick={onCancel} className="self-start" />
      <div className="flex flex-col gap-[var(--space-2)]">
        <h1 className="type-display-h3">{title}</h1>
        {subtitle ? <p className="type-body-base text-ui-fg-muted">{subtitle}</p> : null}
      </div>
      <form noValidate onSubmit={(e) => { e.preventDefault(); if (ready) onContinue() }} className="flex flex-col gap-[var(--space-4)]">
        <Checkbox label={labels.agreeAll} checked={all} indeterminate={some && !all} onChange={() => onCheckedChange(Object.fromEntries(items.map((i) => [i.id, !all])))} />
        <Separator />
        {/* Figma: the legend is not shown; items 12 apart. */}
        <fieldset className="flex flex-col gap-[var(--space-3)]">
          <legend className="sr-only">{labels.legend}</legend>
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-[var(--space-2)]">
              <Checkbox
                className="flex-1"
                aria-required={i.required || undefined}
                checked={!!checked[i.id]}
                onChange={(e) => onCheckedChange({ ...checked, [i.id]: e.target.checked })}
                label={<span className="inline-flex flex-wrap items-center gap-[var(--space-2)]">{i.label}<span className="type-body-caption text-ui-fg-muted">{i.required ? labels.required : labels.optional}</span></span>}
              />
              {i.viewHref ? (
                <button type="button" onClick={() => onView(i)} className="inline-flex shrink-0 items-center gap-[var(--space-1-5)] type-label-button text-ui-link hover:text-ui-link-hover">
                  {labels.view}
                  <ArrowRight aria-hidden className="size-[var(--icon-size-sm)]" />
                </button>
              ) : null}
            </div>
          ))}
        </fieldset>
        <Button type="submit" disabled={!ready} className="w-full">{labels.continue}</Button>
        <Button variant="ghost" size="md" onClick={onCancel} className="w-full">{labels.cancel}</Button>
      </form>
      {footnote ? <p className="type-body-caption text-ui-fg-muted">{footnote}</p> : null}
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
  /** close: accessible name of the mobile header Close. */
  labels: { title: string; clearAll: string; showResults?: string; close?: string }
  onShowResults?: () => void
  /** Mobile: Figma Header › Close (Ghost icon button 40); left out, none. */
  onClose?: () => void
}

/** Search filters: chip groups; desktop applies as tapped, mobile has Show N results. */
export function SearchFilters({ viewport, groups, value, onValueChange, sort, labels, onShowResults, onClose }: SearchFiltersProps) {
  const mobile = viewport === 'mobile'
  const toggle = (g: FilterGroup, id: string) => {
    const cur = value[g.id] ?? []
    const next = g.multi ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id]
    onValueChange({ ...value, [g.id]: next })
  }
  const legend = 'mb-[var(--space-2)] type-eyebrow-category text-ui-fg-muted'
  // Mobile sits in a Bottom sheet, which draws the surface, top radius and Grabber.
  return (
    <div className={cn('flex flex-col gap-[var(--space-6)] text-ui-fg', mobile ? 'px-[var(--space-4)] pb-[var(--space-6)]' : 'p-[var(--space-6)]')}>
      <div className="flex items-center justify-between gap-[var(--space-2)]">
        <h2 className="type-display-h3">{labels.title}</h2>
        {!mobile ? (
          <button type="button" onClick={() => onValueChange({})} className="type-body-link text-ui-link underline underline-offset-2 hover:text-ui-link-hover">{labels.clearAll}</button>
        ) : onClose && labels.close ? (
          <IconButton label={labels.close} icon={<X />} onClick={onClose} />
        ) : null}
      </div>
      {groups.map((g) => (
        <fieldset key={g.id} className="flex flex-col gap-[var(--space-2)]">
          <legend className={legend}>{g.label}</legend>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {g.options.map((o) => <Chip key={o.id} selected={(value[g.id] ?? []).includes(o.id)} count={o.count} onClick={() => toggle(g, o.id)}>{o.label}</Chip>)}
          </div>
        </fieldset>
      ))}
      {/* Figma Sort by: a chip group like the filters, one selected. */}
      {sort ? (
        <fieldset className="flex flex-col gap-[var(--space-2)]">
          <legend className={legend}>{sort.label}</legend>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {sort.options.map((o) => <Chip key={o.id} selected={sort.value === o.id} onClick={() => sort.onValueChange(o.id)}>{o.label}</Chip>)}
          </div>
        </fieldset>
      ) : null}
      {mobile ? (
        <div className="flex gap-[var(--space-2)] [&>*]:flex-1">
          <Button variant="secondary" onClick={() => onValueChange({})}>{labels.clearAll}</Button>
          {onShowResults ? <Button onClick={onShowResults}>{labels.showResults}</Button> : null}
        </div>
      ) : null}
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
  /** Figma Visitor (mobile): the Share icon button sits in the top row instead of below it. */
  actionInRow?: boolean
  tabs?: ReactNode
}

/** Profile header: avatar, name (the page h1), stats, pinned badges, action. */
export function ProfileHeader({ viewport, name, avatarSrc, stats, badges, action, actionInRow, tabs }: ProfileHeaderProps) {
  const desktop = viewport === 'desktop'
  const inRow = desktop || actionInRow
  return (
    <header className={cn('flex flex-col gap-[var(--space-5)] pt-[var(--space-6)] text-ui-fg', desktop ? 'px-[var(--space-6)]' : 'px-[var(--space-4)]')}>
      <div className={cn('flex items-center', desktop ? 'gap-[var(--space-5)]' : 'gap-[var(--space-4)]')}>
        <Avatar size={desktop ? 'xl' : 'lg'} src={avatarSrc} name={name} decorative />
        <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-2)]">
          <h1 className={desktop ? 'type-display-h2' : 'type-display-h3'}>{name}</h1>
          <div className="flex flex-wrap items-baseline gap-x-[var(--space-4)] gap-y-[var(--space-1)]">
            {stats.map((s, i) => <StatCounter key={s.label} number={s.number} label={s.label} separator={i > 0} />)}
          </div>
        </div>
        {inRow ? action : null}
      </div>
      {!inRow ? action : null}
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
  /** A block under the title and updated line, before the sections (Cookie Policy: the preferences card). */
  intro?: ReactNode
  labels: { breadcrumb: string; contents: string; onThisPage: string }
}

/** Legal document: title, updated, numbered sections; contents list (desktop) or a Select (phones). */
export function LegalDocument({ viewport, breadcrumbs, title, updated, contact, sections, currentSection, intro, labels }: LegalDocumentProps) {
  const contentsId = useId()
  // Figma: 16 between every element of the document column; breadcrumbs and title sit in that column.
  const doc = (
    <div className="flex min-w-0 max-w-[720px] flex-1 flex-col gap-[var(--space-4)]">
      <Breadcrumbs label={labels.breadcrumb} items={breadcrumbs} />
      <header className="flex flex-col gap-[var(--space-4)]">
        <h1 className="type-display-h1">{title}</h1>
        <p className="flex flex-wrap items-baseline gap-[var(--space-1-5)] type-body-caption text-ui-fg-muted">
          <span>{updated}</span>
          {contact ? <><span aria-hidden>·</span><span>{contact}</span></> : null}
        </p>
      </header>
      {intro}
      {viewport === 'mobile' ? (
        <Select label={labels.onThisPage} showLabel size="md" value={currentSection ?? sections[0]?.id ?? ''} onChange={(e) => document.getElementById(e.target.value)?.scrollIntoView({ behavior: 'smooth' })}>
          {sections.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.title}</option>)}
        </Select>
      ) : null}
      {sections.map((s, i) => (
        <section key={s.id} aria-labelledby={s.id} className="flex flex-col gap-[var(--space-4)]">
          <Separator />
          <h2 id={s.id} className="scroll-mt-[var(--space-6)] type-display-h3">{i + 1}. {s.title}</h2>
          <div className="type-body-long text-ui-fg-muted [&_a]:underline [&_a]:underline-offset-2 [&_li]:mt-[var(--space-1)] [&_ol]:list-decimal [&_ol]:pl-[var(--space-5)] [&_p+p]:mt-[var(--space-3)] [&_ul]:list-disc [&_ul]:pl-[var(--space-5)]">{s.body}</div>
        </section>
      ))}
    </div>
  )
  if (viewport === 'mobile') return <article className="text-ui-fg">{doc}</article>
  return (
    <article className="flex gap-[var(--space-12)] text-ui-fg">
      {/* Figma Contents: "ON THIS PAGE" eyebrow, items 12 apart; current in body/label fg (the first until one is read). */}
      <nav aria-labelledby={contentsId} className="sticky top-[var(--space-6)] flex w-[240px] shrink-0 flex-col gap-[var(--space-3)] self-start">
        <p id={contentsId} className="type-eyebrow-category text-ui-fg-muted">{labels.contents}</p>
        <ol className="flex flex-col gap-[var(--space-3)]">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} aria-current={currentSection === s.id ? 'location' : undefined} className={cn('hover:text-ui-fg', (currentSection ?? sections[0]?.id) === s.id ? 'type-body-label text-ui-fg' : 'type-body-base text-ui-fg-muted')}>{i + 1}. {s.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      {doc}
    </article>
  )
}

export type SearchSuggestionsProps = {
  viewport: 'desktop' | 'mobile'
  /** Figma State. */
  state: 'typing' | 'empty'
  query: string
  places?: { id: string; name: string; meta: string; imageSrc?: string | null; href: string }[]
  /** imageSrc: Figma Plan thumbnail 48 (null shows the placeholder); left out, the route icon. */
  plans?: { id: string; name: string; meta: string; imageSrc?: string | null; href: string }[]
  /** meta: Figma Explore caption line, when the data has one. */
  explore?: { id: string; name: string; meta?: string; href: string }[]
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

/** Search suggestions: Typing = search for, places, plans, explore; Empty = recent, trending, browse. */
export function SearchSuggestions({ viewport, state, query, places = [], plans = [], explore = [], recent = [], trending = [], categories = [], onSearch, onRemoveRecent, onClearRecent, labels }: SearchSuggestionsProps) {
  const row = cn('flex min-h-[var(--target-touch-min)] w-full items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] text-left hover:bg-ui-state-hover', FOCUS_RING_INSET)
  const heading = 'type-eyebrow-category text-ui-fg-muted'
  const group = 'flex flex-col gap-[var(--space-1)]'
  const icon = 'size-[var(--icon-size-md)] shrink-0 text-ui-fg-muted'
  const thumb = 'w-[var(--space-12)] shrink-0'
  const twoLine = (name: string, meta?: string) => (
    <span className="flex min-w-0 flex-col"><span className="truncate type-body-base">{bold(name, query)}</span>{meta ? <span className="truncate type-body-caption text-ui-fg-muted">{meta}</span> : null}</span>
  )
  // Figma: the same card on desktop and phones (bg-raised, 1px border, radius 2xl, p12, gap 12).
  return (
    <div className={cn('flex flex-col gap-[var(--space-3)] rounded-2xl border border-ui-border bg-ui-bg-raised p-[var(--space-3)] text-ui-fg', viewport === 'desktop' ? 'w-[560px]' : 'w-full')}>
      {state === 'typing' ? (
        <>
          <button type="button" className={row} onClick={() => onSearch(query)}>
            <Search aria-hidden className={icon} />
            <span className="type-body-base">{labels.searchFor(query)}</span>
          </button>
          {places.length ? (
            <div className={group}>
              <p className={heading}>{labels.places}</p>
              {places.slice(0, 3).map((p) => (
                <IntlLink key={p.id} href={p.href} className={row}>
                  <Image ratio="1:1" src={p.imageSrc} alt="" sizes="48px" className={thumb} />
                  {twoLine(p.name, p.meta)}
                </IntlLink>
              ))}
            </div>
          ) : null}
          {plans.length ? (
            <div className={group}>
              <p className={heading}>{labels.plans}</p>
              {plans.map((p) => (
                <IntlLink key={p.id} href={p.href} className={row}>
                  {p.imageSrc !== undefined ? <Image ratio="1:1" src={p.imageSrc} alt="" sizes="48px" className={thumb} /> : <Route aria-hidden className={icon} />}
                  {twoLine(p.name, p.meta)}
                </IntlLink>
              ))}
            </div>
          ) : null}
          {explore.length ? (
            <div className={group}>
              <p className={heading}>{labels.explore}</p>
              {explore.map((p) => (
                <IntlLink key={p.id} href={p.href} className={row}>
                  <Compass aria-hidden className={icon} />
                  {twoLine(p.name, p.meta)}
                </IntlLink>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <>
          {recent.length ? (
            <div className={group}>
              <div className="flex items-center justify-between gap-[var(--space-2)]">
                <p className={heading}>{labels.recent}</p>
                {onClearRecent ? <button type="button" onClick={onClearRecent} className="type-body-caption text-ui-fg-muted underline-offset-2 hover:text-ui-fg hover:underline">{labels.clearAll}</button> : null}
              </div>
              {recent.map((r) => (
                <div key={r.id} className="flex items-center hover:bg-ui-state-hover">
                  <button type="button" className={cn(row, 'hover:bg-transparent')} onClick={() => onSearch(r.text)}>
                    <Clock aria-hidden className={icon} />
                    <span className="type-body-base">{r.text}</span>
                  </button>
                  {onRemoveRecent ? <IconButton label={labels.remove(r.text)} icon={<X />} onClick={() => onRemoveRecent(r.id)} className="mr-[var(--space-2)]" /> : null}
                </div>
              ))}
            </div>
          ) : null}
          {trending.length ? (
            <div className={group}>
              <p className={heading}>{labels.trending}</p>
              <div className="flex flex-wrap gap-[var(--space-2)] py-[var(--space-1)]">
                {trending.map((t) => <Chip key={t.id} onClick={() => onSearch(t.text)}>{t.text}</Chip>)}
              </div>
            </div>
          ) : null}
          {categories.length ? (
            <div className={group}>
              <p className={heading}>{labels.browse}</p>
              {/* Figma Browse: category chips, like Trending now. */}
              <div className="flex flex-wrap gap-[var(--space-2)] py-[var(--space-1)]">
                {categories.map((c) => (
                  <IntlLink key={c.id} href={c.href} className="inline-flex h-[var(--control-height-sm)] items-center rounded-full border border-ui-border-strong px-[var(--chip-padding-x)] type-body-chip text-ui-fg hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none">
                    {c.name}
                  </IntlLink>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
