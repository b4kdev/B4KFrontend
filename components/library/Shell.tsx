'use client'

import { useId, useState, type ReactNode } from 'react'
import { ArrowLeft, Bell, Bookmark, ChevronDown, ChevronRight, CircleHelp, Compass, FileText, Globe, House, MapPin, Menu, Search, Settings, User, X, Zap } from 'lucide-react'
import { Link as IntlLink } from '@/i18n/navigation'
import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'
import { CountBadge } from './Badge'
import { Logo } from './Brand'
import { buttonVariants } from './Button'
import { Scrim } from './Content'
import { IconButton } from './IconButton'
import { MenuItem } from './Menu'
import { NAV_ITEM_TARGET, NavItem } from './Nav'
import { DropdownMenu, MenuGroup } from './Overlay'
import { Tooltip } from './Tooltip'
import { useFocusTrap } from './hooks'
import { FOCUS_RING_INSET } from './styles'

// App shell organisms (UI-70, UI-88, UI-92, UI-94, UI-98, UI-101; Figma Organisms): Navigation
// rail, Navigation bar, Header, Top app bar, Drawer, Account menu, Universal search.
// One color with no borders (UI-88). Texts come in through `labels` (from the messages).

export type Destination = 'home' | 'map' | 'explore' | 'saved'

export type ShellLabels = {
  main: string
  home: string
  map: string
  explore: string
  saved: string
  quickPlan: string
  notifications: string
  /** e.g. "Notifications, 3 unread". */
  notificationsUnread?: string
  account: string
  signIn: string
  search: string
  language: string
  help: string
  menu: string
  close: string
  back: string
  settings: string
  legal: string
  viewProfile: string
  signOut: string
  /** Drawer signed-out line, e.g. "Save places and plan trips". */
  signInHint: string
  /** Drawer Quick plan line, e.g. "B4K builds a plan for you". */
  quickPlanHint: string
  /** Home link name on the logo. */
  homeLink: string
}

export type ShellUser = { name: string; avatarSrc?: string | null; unread?: number } | null

/** Rail cell: 56 wide, centered in the 64 rail (no space token for 56). */
const RAIL_CELL = 'w-[56px]'

const DESTS: { id: Destination; href: string; Icon: typeof House }[] = [
  { id: 'home', href: '/v2', Icon: House },
  { id: 'map', href: '/v2/map', Icon: MapPin },
  { id: 'explore', href: '/v2/explore', Icon: Compass },
  { id: 'saved', href: '/v2/saved', Icon: Bookmark },
]

export type NavigationRailProps = {
  active?: Destination | null
  labels: ShellLabels
  user: ShellUser
  onQuickPlan: () => void
  /** Figma Show logo (UI-101 shell without a top nav). */
  showLogo?: boolean
  /** Account menu content (UI-101) for the avatar / user button; left out = profile link. */
  accountMenu?: ReactNode
  notificationsHref?: string
  profileHref?: string
  className?: string
}

/** Navigation rail (CMP-041): desktop from 1024, 64 wide, icons with tooltips. */
export function NavigationRail({ active = null, labels, user, onQuickPlan, showLogo, accountMenu, notificationsHref = '/v2/notifications', profileHref = '/v2/profile', className }: NavigationRailProps) {
  return (
    <nav aria-label={labels.main} className={cn('flex h-full w-[var(--layout-nav-rail)] shrink-0 flex-col items-center bg-ui-bg pb-[var(--space-3)]', showLogo && 'pt-[var(--space-2)]', className)}>
      {showLogo ? (
        <IntlLink href="/v2" aria-label={labels.homeLink} className={cn('flex size-[var(--layout-nav-rail)] items-center justify-center', FOCUS_RING_INSET)}>
          <Logo type="mark" className="h-9" />
        </IntlLink>
      ) : null}
      <ul className="flex w-full flex-col items-center gap-[var(--space-1)] pt-[var(--space-2)]">
        {DESTS.map(({ id, href, Icon }) => (
          <li key={id} className={RAIL_CELL}>
            <Tooltip text={labels[id]} wrapperClassName="flex w-full">
              <IntlLink href={href} aria-current={active === id ? 'page' : undefined} className={NAV_ITEM_TARGET}>
                <NavItem icon={<Icon />} label={labels[id]} active={active === id} />
              </IntlLink>
            </Tooltip>
          </li>
        ))}
        <li className={RAIL_CELL}>
          <Tooltip text={labels.quickPlan} wrapperClassName="flex w-full">
            <button type="button" onClick={onQuickPlan} className={NAV_ITEM_TARGET}>
              <NavItem icon={<Zap />} label={labels.quickPlan} />
            </button>
          </Tooltip>
        </li>
      </ul>
      <div className="mt-auto flex w-full flex-col items-center gap-[var(--space-1)]">
        {user ? (
          <Tooltip text={labels.notifications} wrapperClassName={cn('flex', RAIL_CELL)}>
            <IntlLink href={notificationsHref} aria-label={user.unread ? labels.notificationsUnread : labels.notifications} className={NAV_ITEM_TARGET}>
              <NavItem icon={<Bell />} label="" badge={user.unread ? <CountBadge /> : undefined} />
            </IntlLink>
          </Tooltip>
        ) : null}
        {accountMenu ?? (
          <IntlLink href={user ? profileHref : '/v2/login'} aria-label={user ? labels.account : labels.signIn} className={cn('flex h-[var(--control-height-xl)] items-center justify-center hover:bg-ui-state-hover', RAIL_CELL, FOCUS_RING_INSET)}>
            {user ? <Avatar size="sm" src={user.avatarSrc} name={user.name} decorative /> : <User aria-hidden className="size-[var(--icon-size-md)] text-ui-fg-muted" />}
          </IntlLink>
        )}
      </div>
    </nav>
  )
}

export type NavigationBarProps = { active?: Destination | null; labels: ShellLabels; onQuickPlan: () => void; className?: string }

/** Navigation bar (CMP-040): below 1024, 56 high plus the safe area; Quick plan in the center. */
export function NavigationBar({ active = null, labels, onQuickPlan, className }: NavigationBarProps) {
  const item = ({ id, href, Icon }: (typeof DESTS)[number]) => (
    <li key={id} className="flex-1">
      <IntlLink href={href} aria-label={labels[id]} aria-current={active === id ? 'page' : undefined} className={NAV_ITEM_TARGET}>
        <NavItem icon={<Icon />} label="" active={active === id} />
      </IntlLink>
    </li>
  )
  return (
    <nav aria-label={labels.main} className={cn('bg-ui-bg pb-[env(safe-area-inset-bottom)]', className)}>
      <ul className="flex h-[var(--fab-size)] items-center px-[var(--space-2)] py-[var(--space-1)]">
        {DESTS.slice(0, 2).map(item)}
        <li className="flex flex-1 justify-center">
          <IconButton variant="primary" label={labels.quickPlan} icon={<Zap />} onClick={onQuickPlan} />
        </li>
        {DESTS.slice(2).map(item)}
      </ul>
    </nav>
  )
}

export type HeaderProps = {
  labels: ShellLabels
  signedIn: boolean
  /** The search field: usually a Combobox (opens suggestions). */
  search: ReactNode
  onLanguage: () => void
  /** Figma Language menu: a Dropdown menu under the globe; given, it replaces the button that calls onLanguage. */
  languageMenu?: ReactNode
  helpHref?: string
  className?: string
}

/** Header (CMP-037): desktop original layout (kept until UI-101 is decided), 64 high. */
export function Header({ labels, signedIn, search, onLanguage, languageMenu, helpHref = '/v2/help', className }: HeaderProps) {
  return (
    <header className={cn('flex h-[var(--layout-header-height)] items-center gap-[var(--space-6)] bg-ui-bg pr-[var(--space-6)]', className)}>
      <IntlLink href="/v2" aria-label={labels.homeLink} className={cn('flex h-full w-[var(--layout-nav-rail)] shrink-0 items-center justify-center', FOCUS_RING_INSET)}>
        <Logo type="mark" className="h-9" />
      </IntlLink>
      <div role="search" className="w-[480px] min-w-0">{search}</div>
      <div className="ml-auto flex items-center gap-[var(--space-1)]">
        {languageMenu ?? <Tooltip text={labels.language}><IconButton label={labels.language} icon={<Globe />} onClick={onLanguage} /></Tooltip>}
        <Tooltip text={labels.help}>
          <IntlLink href={helpHref} aria-label={labels.help} className="relative inline-flex size-[var(--control-height-md)] items-center justify-center rounded-full text-ui-fg hover:bg-ui-state-hover focus-visible:shadow-focus-ring focus-visible:outline-none">
            <CircleHelp aria-hidden className="size-[var(--icon-size-md)]" />
          </IntlLink>
        </Tooltip>
        {signedIn ? null : (
          <IntlLink href="/v2/login" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'hover:bg-ui-state-hover active:bg-ui-state-pressed')}>
            {labels.signIn}
          </IntlLink>
        )}
      </div>
    </header>
  )
}

export type TopAppBarProps = {
  /** Figma Type. */
  type: 'home' | 'page' | 'map' | 'search'
  labels: ShellLabels
  onMenu?: () => void
  onBack?: () => void
  /** Page: one-line title. */
  title?: string
  /** Page: one optional action (an Icon button). */
  action?: ReactNode
  /** Home and Map: the search pill (a link or button that opens search). Search: the filled field. */
  search?: ReactNode
  className?: string
}

/**
 * Top app bar (CMP-038): below 1024, 56 high plus the safe area, no border. Home and Map float:
 * no strip, a round Menu button and the Search pill over the content.
 */
export function TopAppBar({ type, labels, onMenu, onBack, title, action, search, className }: TopAppBarProps) {
  const round = 'rounded-full bg-ui-bg'
  const floating = type === 'home' || type === 'map'
  return (
    <div className={cn('pt-[env(safe-area-inset-top)]', floating ? 'bg-transparent' : 'bg-ui-bg', className)}>
      <div
        className={cn(
          'flex h-[var(--fab-size)] items-center',
          floating
            ? 'gap-[var(--space-2)] px-[var(--space-3)]'
            : type === 'page'
              ? 'gap-[var(--space-1)] pl-[var(--space-1)] pr-[var(--space-2)]'
              : 'gap-[var(--space-2)] pl-[var(--space-1)] pr-[var(--space-3)]',
        )}
      >
        {floating ? (
          <>
            <IconButton label={labels.menu} icon={<Menu />} onClick={onMenu} className={round} />
            <div className="min-w-0 flex-1">{search}</div>
          </>
        ) : type === 'search' ? (
          <>
            <IconButton label={labels.back} icon={<ArrowLeft />} onClick={onBack} />
            <div className="min-w-0 flex-1">{search}</div>
          </>
        ) : (
          <>
            <IconButton label={labels.back} icon={<ArrowLeft />} onClick={onBack} />
            <h1 className="min-w-0 flex-1 truncate type-title-card">{title}</h1>
            {action}
          </>
        )}
      </div>
    </div>
  )
}

export type DrawerProps = {
  open: boolean
  onClose: () => void
  labels: ShellLabels
  user: ShellUser
  onQuickPlan: () => void
  /** Figma Show language row (on in the original layout, off in the UI-101 shell). */
  language?: { current: string; onOpen: () => void }
  links?: { notifications?: string; settings?: string; help?: string; legal?: string; profile?: string; signIn?: string }
  /** Figma Legal open: the documents under Legal; given, Legal opens them in place instead of linking. */
  legalLinks?: { label: string; href: string }[]
  /** The Notifications row's trailing count text ("3 new"); left out, the number. */
  unreadLabel?: (count: number) => string
}

/** Trailing chevron-right 16 (List item) on the account and Legal rows. */
const CHEVRON = <ChevronRight aria-hidden className="size-[var(--icon-size-sm)] shrink-0 text-ui-fg-muted" />

/** Drawer (CMP-042): phone menu, 300 wide from the left over a scrim; account first (UI-94). */
export function Drawer({ open, onClose, labels, user, onQuickPlan, language, links = {}, legalLinks, unreadLabel }: DrawerProps) {
  const ref = useFocusTrap<HTMLDivElement>(open, onClose)
  const id = useId()
  const legalId = useId()
  const [legalOpen, setLegalOpen] = useState(false)
  if (!open) return null
  const L = { notifications: '/v2/notifications', settings: '/v2/settings', help: '/v2/help', legal: '/v2/legal', profile: '/v2/profile', signIn: '/v2/login', ...links }
  const row = cn('flex min-h-[var(--target-touch-min)] w-full items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] text-left type-body-base text-ui-fg hover:bg-ui-state-hover', FOCUS_RING_INSET)
  return (
    <>
      <Scrim onClick={onClose} className="z-50" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} className="fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col bg-ui-bg-raised pt-[env(safe-area-inset-top)] text-ui-fg motion-safe:animate-b4k-drawer-in">
        <div className="flex h-[var(--control-height-xl)] items-center justify-between pl-[var(--space-4)] pr-[var(--space-1)]">
          <span id={id}><Logo label="B4K" /></span>
          <IconButton label={labels.close} icon={<X />} onClick={onClose} />
        </div>
        <div className="pt-[var(--space-2)]">
          <IntlLink href={user ? L.profile : L.signIn} onClick={onClose} className={row}>
            {user ? <Avatar size="md" src={user.avatarSrc} name={user.name} decorative /> : <User aria-hidden className="size-[var(--icon-size-md)] shrink-0" />}
            <span className="flex min-w-0 flex-1 flex-col">
              <span>{user ? user.name : labels.signIn}</span>
              <span className="type-body-caption text-ui-fg-muted">{user ? labels.viewProfile : labels.signInHint}</span>
            </span>
            {CHEVRON}
          </IntlLink>
        </div>
        {/* Figma: 16 between the account row and the rest, no line. */}
        <div aria-hidden className="h-[var(--space-4)]" />
        <button type="button" className={row} onClick={() => { onClose(); onQuickPlan() }}>
          <Zap aria-hidden className="size-[var(--icon-size-md)]" />
          <span className="flex flex-col"><span>{labels.quickPlan}</span><span className="type-body-caption text-ui-fg-muted">{labels.quickPlanHint}</span></span>
        </button>
        {user ? (
          <IntlLink href={L.notifications} onClick={onClose} className={row}>
            <Bell aria-hidden className="size-[var(--icon-size-md)]" />
            <span className="flex-1">{labels.notifications}</span>
            {user.unread ? <span className="text-ui-fg-muted">{unreadLabel ? unreadLabel(user.unread) : user.unread}</span> : null}
          </IntlLink>
        ) : null}
        {language ? (
          <button type="button" className={row} onClick={language.onOpen}>
            <Globe aria-hidden className="size-[var(--icon-size-md)]" />
            <span className="flex-1">{labels.language}</span>
            <span className="text-ui-fg-muted">{language.current}</span>
          </button>
        ) : null}
        <IntlLink href={L.settings} onClick={onClose} className={row}><Settings aria-hidden className="size-[var(--icon-size-md)]" />{labels.settings}</IntlLink>
        <IntlLink href={L.help} onClick={onClose} className={row}><CircleHelp aria-hidden className="size-[var(--icon-size-md)]" />{labels.help}</IntlLink>
        {legalLinks ? (
          <>
            <button type="button" aria-expanded={legalOpen} aria-controls={legalId} onClick={() => setLegalOpen((o) => !o)} className={row}>
              <FileText aria-hidden className="size-[var(--icon-size-md)]" />
              <span className="flex-1">{labels.legal}</span>
              {legalOpen ? <ChevronDown aria-hidden className="size-[var(--icon-size-sm)] shrink-0 text-ui-fg-muted" /> : CHEVRON}
            </button>
            {legalOpen ? (
              <ul id={legalId}>
                {legalLinks.map((l) => (
                  <li key={l.href}><IntlLink href={l.href} onClick={onClose} className={cn(row, 'pl-[calc(var(--space-4)+var(--space-10))]')}>{l.label}</IntlLink></li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <IntlLink href={L.legal} onClick={onClose} className={row}><FileText aria-hidden className="size-[var(--icon-size-md)]" /><span className="flex-1">{labels.legal}</span>{CHEVRON}</IntlLink>
        )}
      </div>
    </>
  )
}

export type AccountMenuProps = { labels: ShellLabels; user: ShellUser; onSignOut: () => void; links?: { profile?: string; settings?: string; help?: string; signIn?: string }; /** Help item: off on desktop, where the Header has the Help icon. */ showHelp?: boolean }

/** Account menu: menu button on the rail avatar; signed in (profile, Settings, Sign out) or signed out (Sign in, Settings). */
export function AccountMenu({ labels, user, onSignOut, links = {}, showHelp = false }: AccountMenuProps) {
  const L = { profile: '/v2/profile', settings: '/v2/settings', help: '/v2/help', signIn: '/v2/login', ...links }
  const go = (href: string) => () => window.location.assign(href)
  return (
    <DropdownMenu
      label={labels.account}
      trigger={
        <button type="button" aria-label={labels.account} className={cn('flex h-[var(--control-height-xl)] items-center justify-center hover:bg-ui-state-hover', RAIL_CELL, FOCUS_RING_INSET)}>
          {user ? <Avatar size="sm" src={user.avatarSrc} name={user.name} decorative /> : <User aria-hidden className="size-[var(--icon-size-md)] text-ui-fg-muted" />}
        </button>
      }
      className="bottom-0 left-full top-auto ml-[var(--space-2)] mt-0 w-[280px]"
    >
      {user ? (
        <MenuGroup>
          {/* Profile row = List item: py 12, Avatar md, trailing chevron. */}
          <MenuItem onClick={go(L.profile)} className="h-auto min-h-[var(--target-touch-min)] py-[var(--space-3)]">
            <span className="flex items-center gap-[var(--space-3)]">
              <Avatar size="md" src={user.avatarSrc} name={user.name} decorative />
              <span className="flex min-w-0 flex-1 flex-col"><span className="truncate">{user.name}</span><span className="type-body-caption text-ui-fg-muted">{labels.viewProfile}</span></span>
              {CHEVRON}
            </span>
          </MenuItem>
        </MenuGroup>
      ) : (
        <MenuGroup><MenuItem icon={<User />} onClick={go(L.signIn)}>{labels.signIn}</MenuItem></MenuGroup>
      )}
      <MenuGroup>
        <MenuItem icon={<Settings />} onClick={go(L.settings)}>{labels.settings}</MenuItem>
        {showHelp ? <MenuItem icon={<CircleHelp />} onClick={go(L.help)}>{labels.help}</MenuItem> : null}
      </MenuGroup>
      {user ? <MenuGroup><MenuItem onClick={onSignOut}>{labels.signOut}</MenuItem></MenuGroup> : null}
    </DropdownMenu>
  )
}

export type UniversalSearchProps = { children: ReactNode; className?: string }

/** Universal search (UI-101, Proposed): the one desktop search field, 560 wide, centered, 12 from the top, floating. */
export function UniversalSearch({ children, className }: UniversalSearchProps) {
  return (
    <div role="search" className={cn('pointer-events-none fixed inset-x-0 top-[var(--space-3)] z-30 flex justify-center', className)}>
      <div className="pointer-events-auto w-[560px] rounded-full bg-ui-bg-elevated">{children}</div>
    </div>
  )
}

/** A search pill that opens the full search (Top app bar Home and Map). */
export function SearchPill({ label, href = '/v2/search', className }: { label: string; href?: string; className?: string }) {
  return (
    <IntlLink href={href} className={cn('flex h-[var(--control-height-md)] items-center gap-[var(--space-2)] rounded-full border border-ui-border-strong bg-ui-bg-raised px-[var(--space-4)] type-body-base text-ui-fg-placeholder focus-visible:shadow-focus-ring focus-visible:outline-none', className)}>
      <Search aria-hidden className="size-[var(--icon-size-sm)] shrink-0" />
      <span className="truncate">{label}</span>
    </IntlLink>
  )
}
