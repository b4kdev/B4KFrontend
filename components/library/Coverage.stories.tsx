import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { LegalLine, PlaceTypeIcon, Scrim } from './Content'
import { Accordion, Carousel, TreeView } from './ContentOrganisms'
import { LegalDocument } from './AccountOrganisms'
import { Label } from './Field'
import { AccordionItem, TreeItem } from './Lists'
import { AiPanel, LeftPanel } from './MapOrganisms'
import { ExploreCollections, ExplorePackages, QuickPlan } from './Sections'
import { AccountMenu, Header, SearchPill, UniversalSearch } from './Shell'
import { Slider } from './Slider'
import { BottomSheet } from './Surfaces'
import { IMG, SHELL_LABELS } from './story-data'

// Parts that had no story yet: one story per Figma part, sample content only.
const meta = { title: 'Library/More parts', tags: ['autodocs'] } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const placeCard = (title: string) => (
  <Card key={title} type="place" href="#" title={title} imageSrc={IMG} meta="Jongno-gu · Market" save={{ saved: false, onSave: () => {}, label: `Save ${title}` }} like={{ liked: false, onLike: () => {}, label: `Like ${title}` }} />
)

export const Atoms: Story = {
  render: function Render() {
    const [km, setKm] = useState(5)
    const [range, setRange] = useState<[number, number]>([10, 18])
    return (
      <div className="grid max-w-[420px] gap-[var(--space-6)]">
        <div className="flex gap-[var(--space-4)]">
          <Label htmlFor="n1">Plan name</Label>
          <Label htmlFor="n2" required>Email</Label>
          <Label htmlFor="n3" disabled>Disabled</Label>
        </div>
        <Slider label="Distance" valueText={`Up to ${km} km`} min={1} max={20} value={km} onValueChange={setKm} />
        <Slider type="range" label="Hours" valueText={`${range[0]}:00 to ${range[1]}:00`} min={0} max={24} value={range} onValueChange={setRange} thumbLabels={['From', 'To']} />
        <span className="flex items-center gap-[var(--space-2)] text-ui-fg-muted"><PlaceTypeIcon className="size-[var(--icon-size-md)]" /> Place type icon (Type=Place)</span>
        <LegalLine lead="© 2026 B4K" links={[{ href: '#', label: 'Terms' }, { href: '#', label: 'Privacy Policy', strong: true }]} />
        <div className="relative h-[120px] overflow-hidden rounded-2xl bg-ui-bg-raised"><Scrim className="absolute inset-0" /></div>
      </div>
    )
  },
}

export const ShellParts: Story = {
  render: () => (
    <div className="grid gap-[var(--space-6)]">
      <Header labels={SHELL_LABELS} signedIn={false} search={<SearchPill label="Search places and plans" />} onLanguage={() => {}} />
      <div className="relative h-[80px]"><UniversalSearch className="absolute"><SearchPill label="Search places and plans" /></UniversalSearch></div>
      <div className="relative flex h-[320px] items-end bg-ui-bg-raised p-[var(--space-1)]">
        <AccountMenu labels={SHELL_LABELS} user={{ name: 'Sun Kim' }} onSignOut={() => {}} />
      </div>
    </div>
  ),
}

export const Sheets: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false)
    const [quick, setQuick] = useState(false)
    return (
      <div className="flex gap-[var(--space-3)]">
        <Button onClick={() => setOpen(true)}>Open bottom sheet</Button>
        <Button variant="secondary" onClick={() => setQuick(true)}>Open Quick plan</Button>
        <BottomSheet open={open} onClose={() => setOpen(false)} label="Leg mode" actions={<Button onClick={() => setOpen(false)}>Done</Button>}>
          <p className="type-body-base">Walk, public transport or car.</p>
        </BottomSheet>
        <QuickPlan
          open={quick}
          onClose={() => setQuick(false)}
          step={1}
          stepTitle="Where and when?"
          stepSubtitle="Pick a city, your dates and who you're traveling with."
          progressLabel="Step 1 of 3"
          title="Quick plan"
          closeLabel="Close"
          next={{ label: 'Next', onClick: () => setQuick(false) }}
        >
          <p className="type-body-base">Seoul · 3 days · Friends</p>
        </QuickPlan>
      </div>
    )
  },
}

export const ContentOrganisms: Story = {
  render: function Render() {
    const [filter, setFilter] = useState('all')
    return (
      <div className="grid max-w-[1000px] gap-[var(--space-8)]">
        <Carousel type="rail" label="Trending now" seeAll={{ href: '#', label: 'See all' }} previousLabel="Previous" nextLabel="Next" slideLabel={(n, m) => `Slide ${n} of ${m}`}>
          {['Gwangjang Market', 'Bukchon Hanok Village', 'HYBE Insight'].map(placeCard)}
        </Carousel>
        <ExploreCollections title="Collections" filters={[{ id: 'all', label: 'All' }, { id: 'route', label: 'Route' }]} active={filter} onFilter={setFilter} cards={['Seongsu cafés', 'Drama spots'].map(placeCard)} />
        <ExplorePackages title="Tours and tickets" cards={[<Card key="p" type="package" href="https://www.example.com" external={{ newTabLabel: '(opens in a new tab)' }} title="DMZ half-day tour" imageSrc={IMG} partner="Klook" cta="View on Klook" sponsored="Sponsored" />]} />
        <Accordion>
          <AccordionItem title="How do I make a plan?">Tap New plan, then add places from the map.</AccordionItem>
          <AccordionItem title="Is B4K free?">Yes.</AccordionItem>
        </Accordion>
        <TreeView label="Explore">
          <TreeItem label="K-Pop" kind="expanded" count={31}>
            <TreeItem label="Concert halls" kind="leaf" level={2} selected count={8} />
          </TreeItem>
          <TreeItem label="K-Drama" kind="collapsed" count={24} />
        </TreeView>
      </div>
    )
  },
}

export const MapPanels: Story = {
  render: function Render() {
    const [value, setValue] = useState('')
    return (
      <div className="flex gap-[var(--space-6)]">
        <div className="relative h-[600px] w-[420px]">
          <LeftPanel type="map" label="Places">{['Gwangjang Market', 'Bukchon Hanok Village'].map(placeCard)}</LeftPanel>
        </div>
        <div className="relative h-[600px] w-[400px]">
          <AiPanel
            viewport="desktop"
            title="AI assistant"
            greeting="Where would you like to go?"
            suggestions={['A K-drama day in Seoul', 'Food markets']}
            onSuggestion={setValue}
            messages={[{ role: 'user', text: 'A K-drama day in Seoul' }, { role: 'assistant', text: 'Here are five filming spots close together.' }]}
            input={{ value, onValueChange: setValue, onSend: () => setValue(''), placeholder: 'Ask about places', sendLabel: 'Send' }}
            labels={{ minimize: 'Minimize', close: 'Close', back: 'Back', typing: 'Typing' }}
            onMinimize={() => {}}
            onClose={() => {}}
          />
        </div>
      </div>
    )
  },
}

export const Legal: Story = {
  render: () => (
    <LegalDocument
      viewport="desktop"
      breadcrumbs={[{ label: 'Home', href: '#' }, { label: 'Terms of Service' }]}
      title="Terms of Service"
      updated="Last updated October 21, 2026"
      sections={[
        { id: 'use', title: 'Using B4K', body: <p>Sample text.</p> },
        { id: 'accounts', title: 'Accounts', body: <p>Sample text.</p> },
      ]}
      currentSection="use"
      labels={{ breadcrumb: 'Breadcrumb', contents: 'Contents', onThisPage: 'On this page' }}
    />
  ),
}
