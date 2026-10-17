import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Bookmark, CloudRain, CloudSun, Pencil, Share2, Sun, Trophy } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { AchievementBadge } from './ContentMolecules'
import { Footer, Hero, NowSeoulCard } from './ContentOrganisms'
import { ConsentStep, CookieBanner, ProfileHeader, SearchFilters, SearchSuggestions, SignInCard, type SignInView } from './AccountOrganisms'
import { ItineraryPanel, PlaceDetail, PlanCart, SavedHub } from './MapOrganisms'
import { Tabs } from './NavGroups'
import { InterestsCard, PlanningCue } from './Sections'
import { Drawer, NavigationBar, NavigationRail, SearchPill, TopAppBar } from './Shell'
import { Dialog, Modal } from './Surfaces'
import { IMG, SHELL_LABELS } from './story-data'

const meta = { title: 'Organisms/Gallery', tags: ['autodocs'] } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Shell: Story = {
  render: function Render() {
    const [drawer, setDrawer] = useState(false)
    return (
      <div className="grid gap-[var(--space-6)]">
        <div className="flex h-[420px] border border-ui-border">
          <NavigationRail active="home" labels={SHELL_LABELS} user={{ name: 'Sun Kim', unread: 3 }} onQuickPlan={() => {}} showLogo />
          <div className="flex-1 bg-ui-bg-sunken" />
        </div>
        <div className="w-[375px] border border-ui-border">
          <TopAppBar type="home" labels={SHELL_LABELS} onMenu={() => setDrawer(true)} search={<SearchPill label="Search places and plans" />} />
          <div className="h-[120px] bg-ui-bg-sunken" />
          <TopAppBar type="page" labels={SHELL_LABELS} onBack={() => {}} title="Settings" />
          <NavigationBar active="map" labels={SHELL_LABELS} onQuickPlan={() => {}} />
        </div>
        <Drawer open={drawer} onClose={() => setDrawer(false)} labels={SHELL_LABELS} user={null} onQuickPlan={() => {}} language={{ current: 'English', onOpen: () => {} }} />
      </div>
    )
  },
}

export const Cards: Story = {
  render: () => (
    <div className="grid max-w-[900px] grid-cols-3 gap-[var(--space-4)]">
      <Card type="place" href="#" title="Gwangjang Market" imageSrc={IMG} meta="Jongno-gu · Market" description="Bindaetteok and mayak gimbap since 1905" trending="Trending" save={{ saved: false, onSave: () => {}, label: 'Save Gwangjang Market' }} like={{ liked: false, onLike: () => {}, label: 'Like Gwangjang Market' }} />
      <Card type="plan" href="#" title="Seoul in 3 days for K-drama fans" imageSrc={IMG} author="Mina K." saves="1.2k" stops="5 stops · 1 day" />
      <Card type="package" href="https://www.example.com" external={{ newTabLabel: '(opens in a new tab)' }} title="DMZ half-day tour" imageSrc={IMG} partner="Klook" cta="View on Klook" sponsored="Sponsored" />
      <Card type="collection" href="#" title="Seoul food" images={[IMG, null, IMG, null]} meta="12 places" />
      <div className="col-span-2"><Card type="featured" href="#" title="Bukchon Hanok Village" imageSrc={IMG} eyebrow="Featured" meta="Jongno-gu · Neighborhood" /></div>
      <div className="col-span-3 max-w-[360px]"><Card type="compact" href="#" title="Tosokchon Samgyetang" imageSrc={IMG} meta="Jongno-gu · Restaurant" save={{ saved: true, onSave: () => {}, label: 'Saved' }} /></div>
    </div>
  ),
}

export const HeroFooterWeather: Story = {
  render: () => (
    <div className="grid gap-[var(--space-6)]">
      <Hero imageSrc={IMG} eyebrow="Now in Seoul" title="Seoul nights" subtitle="Gwangjang, Euljiro and the river after dark" action={<Button>Explore</Button>} />
      <div className="max-w-[343px]">
        <NowSeoulCard label="Seoul now" eyebrow="Now in Seoul" time="14:32" date="Sun 12 Oct" temperature="18°" condition="Partly cloudy" weatherIcon={<CloudSun />} forecast={[{ day: 'Mon', icon: <Sun />, range: '21° / 13°', label: 'Monday, sunny' }, { day: 'Tue', icon: <CloudRain />, range: '17° / 12°', label: 'Tuesday, rain' }, { day: 'Wed', icon: <CloudSun />, range: '19° / 12°', label: 'Wednesday, partly cloudy' }]} tip="Palaces are free in hanbok." />
      </div>
      <Footer navLabel="Legal" copyright="© 2026 B4K" links={[{ label: 'Help', href: '/help' }, { label: 'Privacy', href: '/legal/privacy' }, { label: 'Terms', href: '/legal/terms' }, { label: 'Cookies', href: '/legal/cookies' }]} />
    </div>
  ),
}

export const AccountAndConsent: Story = {
  render: function Render() {
    const [view, setView] = useState<SignInView>('providers')
    const [checked, setChecked] = useState<Record<string, boolean>>({})
    return (
      <div className="flex flex-wrap items-start gap-[var(--space-8)]">
        <SignInCard
          view={view} onViewChange={setView} title="Sign in to save places" onClose={() => {}} onGuest={() => {}} draftNotice="Your plan in progress stays here." onGoogle={() => {}} onSubmit={() => {}}
          labels={{ close: 'Close', google: 'Continue with Google', email: 'Continue with email', signIn: 'Sign in', signUp: 'Sign up', password: 'Password', newPassword: 'New password', confirmPassword: 'Confirm password', passwordHint: 'At least 8 characters', forgot: 'Forgot password?', sendLink: 'Send link', checkEmailTitle: 'Check your email', checkEmailBody: (e) => `We sent a link to ${e}.`, resend: 'Resend', savePassword: 'Save password', newPasswordBody: 'Use at least 8 characters.', back: 'Back', guest: 'Continue as guest', or: 'or', tabs: 'Account' }}
        />
        <ConsentStep
          title="Before you start"
          items={[{ id: 'age', label: "I'm 14 or older", required: true }, { id: 'terms', label: 'Terms of Service', required: true, viewHref: '/legal/terms' }, { id: 'privacy', label: 'Privacy Policy', required: true, viewHref: '/legal/privacy' }, { id: 'mkt', label: 'Marketing emails', required: false }]}
          checked={checked} onCheckedChange={setChecked} onView={() => {}} onContinue={() => {}} onCancel={() => {}}
          labels={{ agreeAll: 'Agree to all', required: 'Required', optional: 'Optional', view: 'View', continue: 'Continue', cancel: 'Cancel sign-up', back: 'Back', legend: 'Agreements' }}
        />
        <div className="w-[480px]">
          <CookieBanner type="preferences" title="Cookies" label="Cookie preferences" status="Declined" message="We use analytics cookies only after you accept." learnMore={{ href: '/legal/cookies', label: 'Learn more' }} acceptLabel="Accept" declineLabel="Decline" onAccept={() => {}} onDecline={() => {}} />
        </div>
      </div>
    )
  },
}

export const SearchAndProfile: Story = {
  render: function Render() {
    const [f, setF] = useState<Record<string, string[]>>({ show: ['all'] })
    return (
      <div className="flex flex-wrap items-start gap-[var(--space-8)]">
        <SearchSuggestions viewport="desktop" state="typing" query="Gwang" onSearch={() => {}} places={[{ id: 'p', name: 'Gwangjang Market', meta: 'Jongno-gu · Market', imageSrc: IMG, href: '#' }]} plans={[{ id: 'pl', name: 'Gwanghwamun walk', meta: '1 day · 4 stops', href: '#' }]} explore={[{ id: 'e', name: 'Gwangjang food', href: '#' }]} labels={{ searchFor: (q) => `Search for “${q}”`, places: 'Places', plans: 'Plans', explore: 'Explore', recent: 'Recent', clearAll: 'Clear all', trending: 'Trending now', browse: 'Browse categories', remove: (t) => `Remove ${t}` }} />
        <SearchSuggestions viewport="desktop" state="empty" query="" onSearch={() => {}} onRemoveRecent={() => {}} onClearRecent={() => {}} recent={[{ id: 'r', text: 'Hongdae' }]} trending={[{ id: 't', text: 'K-Pop' }]} categories={[{ id: 'c', name: 'K-Food', href: '#' }]} labels={{ searchFor: (q) => q, places: 'Places', plans: 'Plans', explore: 'Explore', recent: 'Recent', clearAll: 'Clear all', trending: 'Trending now', browse: 'Browse categories', remove: (t) => `Remove ${t}` }} />
        <div className="w-[420px] border border-ui-border">
          <SearchFilters viewport="desktop" value={f} onValueChange={setF} groups={[{ id: 'show', label: 'Show', options: [{ id: 'all', label: 'All' }, { id: 'places', label: 'Places' }, { id: 'plans', label: 'Plans' }] }, { id: 'theme', label: 'Theme', multi: true, options: [{ id: 'kpop', label: 'K-Pop' }, { id: 'kfood', label: 'K-Food' }] }]} labels={{ title: 'Filters', clearAll: 'Clear all' }} />
        </div>
        <div className="w-[720px]">
          <ProfileHeader viewport="desktop" name="Sun Kim" stats={[{ number: 12, label: 'Trips' }, { number: 340, label: 'Saves' }, { number: 4, label: 'Badges' }]} action={<Button variant="secondary" size="md" leadingIcon={<Pencil />}>Edit profile</Button>} badges={<><AchievementBadge name="First Save" detail="Common" icon={<Bookmark />} /><AchievementBadge name="Legend" detail="Legendary" icon={<Trophy />} rarity="legendary" /></>} tabs={<Tabs label="Profile" value="plans" onValueChange={() => {}} tabs={[{ id: 'plans', label: 'Plans' }, { id: 'badges', label: 'Badges' }]} />} />
        </div>
      </div>
    )
  },
}

export const MapPanels: Story = {
  render: function Render() {
    const [day, setDay] = useState<'all' | 1 | 2>('all')
    return (
      <div className="flex flex-wrap items-start gap-[var(--space-6)]">
        <div className="h-[640px] w-[420px] border border-ui-border">
          <PlanCart
            state="open" onToggle={() => {}} days={2} activeDay={day} onDayChange={(d) => setDay(d as 'all' | 1 | 2)} onAddDay={() => {}} summary="Plan · 3 stops · about 5 h" dayTotal="Day 1 · about 3 h"
            stops={[{ id: 'a', name: 'Gyeongbokgung', day: 1, duration: '2h', durationLabel: 'Time at Gyeongbokgung, 2 hours', leg: '15 min' }, { id: 'b', name: 'Tosokchon', day: 1, duration: '1h', durationLabel: 'Time at Tosokchon, 1 hour' }, { id: 'c', name: 'Bukchon', day: 2, duration: '2h', durationLabel: 'Time at Bukchon, 2 hours' }]}
            onDuration={() => {}} onRemove={() => {}} onSave={() => {}} onDiscard={() => {}}
            labels={{ region: 'Plan', emptyTitle: 'No stops yet', emptyBody: 'Tap + on any place or map pin to add it.', all: 'All', day: (n) => `Day ${n}`, addDay: 'Add day', save: 'Save plan', discard: 'Discard draft', remove: (n) => `Remove ${n}`, reorder: (n) => `Reorder ${n}`, open: 'Open plan', close: 'Close plan', about: 'About' }}
          />
        </div>
        <div className="w-[420px] border border-ui-border">
          <PlaceDetail viewport="desktop" name="Gyeongbokgung" meta="Palace · Jongno-gu · Open now" imageSrc={IMG} description="The main royal palace of the Joseon dynasty." details={[{ icon: 'hours', title: '09:00 to 18:00' }, { icon: 'address', title: '161 Sajik-ro, Jongno-gu' }]} saved={false} liked onAdd={() => {}} onSave={() => {}} onLike={() => {}} onShare={() => {}} labels={{ add: 'Add to plan', save: 'Save', like: 'Like', share: 'Share' }} />
        </div>
        <div className="h-[640px] w-[420px] border border-ui-border">
          <ItineraryPanel title="K-drama day" owner="Mina K." privateLabel="Private" stats={['5 stops', '1 day', '6 h', '8 km']} days={1} activeDay="all" onDayChange={() => {}} stops={[{ id: '1', name: 'Gyeongbokgung', day: 1, meta: '2h · 09:00', imageSrc: IMG, leg: { mode: 'walk', label: 'Walk', time: '12 min' } }, { id: '2', name: 'Tosokchon', day: 1, meta: '1h · 11:12' }]} footer={<><Button size="md" className="flex-1">Edit plan</Button><Button variant="secondary" size="md" leadingIcon={<Share2 />}>Share</Button></>} labels={{ all: 'All', day: (n) => `Day ${n}`, days: 'Days', related: 'More plans like this' }} />
        </div>
        <div className="w-[420px] border border-ui-border">
          <SavedHub view="places" folders={[{ id: 'f', name: 'K-drama spots', count: '8 places' }, { id: 'g', name: 'Cafés to try', count: '5 places' }]} onOpenFolder={() => {}} onBack={() => {}} onAdd={() => {}} emptyAction={null} labels={{ back: 'Back', add: (n) => `Add ${n} to plan`, emptyTitle: 'No saved places', emptyBody: '' }} />
        </div>
      </div>
    )
  },
}

export const SectionsAndSurfaces: Story = {
  render: function Render() {
    const [sel, setSel] = useState<string[]>(['kpop'])
    const [modal, setModal] = useState(false)
    const [dialog, setDialog] = useState(false)
    return (
      <div className="grid max-w-[960px] gap-[var(--space-6)]">
        <PlanningCue state="start" label="Start planning" tiles={{ newPlan: { href: '/map', title: 'New plan', text: 'Build it yourself on the map, stop by stop' }, quickPlan: { onOpen: () => {}, title: 'Quick plan', text: 'Answer a few questions, B4K builds the plan' }, fromSaved: { href: '/saved', title: 'Plan from Saved', text: 'Pick places you saved, then make the plan' } }} />
        <InterestsCard title="Tell us what you love" text="We'll show more of it." tags={[{ id: 'kpop', label: 'K-Pop' }, { id: 'kdrama', label: 'K-Drama' }, { id: 'kfood', label: 'K-Food' }]} selected={sel} onToggle={(id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))} onSave={() => {}} onDismiss={() => {}} labels={{ save: 'Save interests', dismiss: 'Dismiss' }} />
        <div className="flex gap-[var(--space-3)]">
          <Button variant="secondary" onClick={() => setModal(true)}>Open modal</Button>
          <Button variant="secondary" onClick={() => setDialog(true)}>Open dialog</Button>
        </div>
        <Modal open={modal} onClose={() => setModal(false)} title="Save plan" closeLabel="Close" primaryAction={<Button onClick={() => setModal(false)}>Save</Button>} secondaryAction={<Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>}>Give your plan a name.</Modal>
        <Dialog open={dialog} onCancel={() => setDialog(false)} title="Delete K-drama spots?" body="The folder and its 8 saved places leave Saved." confirm={<Button variant="danger" onClick={() => setDialog(false)}>Delete</Button>} cancel={<Button variant="ghost" data-autofocus onClick={() => setDialog(false)}>Cancel</Button>} />
      </div>
    )
  },
}
