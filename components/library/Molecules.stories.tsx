import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Award, Bookmark, Calendar, Ellipsis, Map, Pencil, Settings, Share2, Sparkles, Trash2, Trophy, Zap } from 'lucide-react'
import { Button } from './Button'
import { Checkbox, Radio, Toggle } from './Choice'
import { ComboboxOption, MenuItem } from './Menu'
import { IconButton } from './IconButton'
import { Link } from './Link'
import { AchievementBadge, AiInput, ItineraryStop, PlanStopRow, SaveLikeOverlay, SectionHeader } from './ContentMolecules'
import { DateRangePicker, type DateRange } from './DateRangePicker'
import { Alert, EmptyState } from './Feedback'
import { FileUpload, Fieldset, Stepper } from './FormGroups'
import { ButtonGroup, Rating, RouteMapPreview, SelectionBar, ZoomControl } from './Groups'
import { AccordionItem, LeaderboardRow, ListItem, NotificationItem, TreeItem } from './Lists'
import { Breadcrumbs, Pagination, ProgressIndicator, SegmentedControl, StepList, Tabs } from './NavGroups'
import { Combobox, DropdownMenu, MenuGroup, Popover } from './Overlay'
import { Image } from './Image'
import { Table } from './Table'
import { TransportMode } from './Plan'

const meta = { title: 'Molecules/Gallery', tags: ['autodocs'] } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const link = ({ href, className, children }: { href: string; className: string; children: React.ReactNode }) => <a href={href} className={className}>{children}</a>

export const FormsAndOverlays: Story = {
  render: function Render() {
    const [days, setDays] = useState(3)
    const [q, setQ] = useState('Gwang')
    return (
      <div className="grid max-w-[420px] gap-[var(--space-6)]">
        <Fieldset legend="Travel style" hint="Pick all that fit.">
          <Checkbox label="Food" defaultChecked />
          <Checkbox label="Shopping" />
        </Fieldset>
        <Fieldset legend="Pace" error="Choose a pace.">
          <Radio name="pace" label="Relaxed" />
          <Radio name="pace" label="Packed" />
        </Fieldset>
        <Stepper label="Days" hint="Up to 8" value={days} min={1} max={8} onValueChange={setDays} decreaseLabel="Fewer days" increaseLabel="More days" format={(n) => `${n} days`} />
        <FileUpload label="Upload photo" hint="JPG or PNG, up to 5 MB" onFile={() => {}} />
        <FileUpload type="drop-zone" label="Drop a photo here or browse" progress={40} progressLabel="Uploading" onFile={() => {}} />
        <div className="flex gap-[var(--space-4)]">
          <DropdownMenu label="Folder actions" trigger={<IconButton label="More" icon={<Ellipsis />} />}>
            <MenuGroup>
              <MenuItem icon={<Pencil />}>Rename</MenuItem>
              <MenuItem icon={<Share2 />}>Share</MenuItem>
            </MenuGroup>
            <MenuGroup>
              <MenuItem icon={<Trash2 />} variant="danger">Delete folder</MenuItem>
            </MenuGroup>
          </DropdownMenu>
          <Popover title="Why can't I add this?" closeLabel="Close" trigger={<Button variant="secondary" size="md">Info</Button>} action={<Link href="/help">Learn more</Link>}>
            A plan holds up to 48 places.
          </Popover>
        </div>
        <Combobox
          label="Search places and plans"
          placeholder="Search places and plans"
          value={q}
          onValueChange={setQ}
          state="results"
          clearLabel="Clear"
          items={[
            { id: 'r1', onSelect: () => {}, node: <ComboboxOption id="r1" type="place" title="Gwangjang Market" match={q} secondary="Jongno-gu · Market" onSelect={() => {}} /> },
            { id: 'r2', onSelect: () => {}, node: <ComboboxOption id="r2" type="place" title="Gwanghwamun" match={q} secondary="Jongno-gu · Landmark" onSelect={() => {}} /> },
          ]}
        />
      </div>
    )
  },
}

export const NavigationAndFeedback: Story = {
  render: function Render() {
    const [tab, setTab] = useState('places')
    const [seg, setSeg] = useState('private')
    const [page, setPage] = useState(3)
    return (
      <div className="grid max-w-[560px] gap-[var(--space-6)]">
        <Tabs label="Saved" value={tab} onValueChange={setTab} tabs={[{ id: 'places', label: 'Places' }, { id: 'plans', label: 'My plans' }, { id: 'day1', label: 'Day 1', day: 1 }]} />
        <SegmentedControl label="Visibility" value={seg} onValueChange={setSeg} options={[{ id: 'private', label: 'Private' }, { id: 'public', label: 'Public' }]} className="w-[240px]" />
        <Breadcrumbs label="Breadcrumb" items={[{ label: 'Home', href: '/' }, { label: 'Explore', href: '/explore' }, { label: 'K-Pop' }]} />
        <Pagination label="Pagination" page={page} pageCount={9} onPageChange={setPage} previousLabel="Previous page" nextLabel="Next page" />
        <Pagination label="Slides" type="dots" page={2} pageCount={4} statusText="Slide 2 of 4" />
        <ProgressIndicator step={2} steps={3} label="Step 2 of 3" />
        <StepList label="Quick plan steps" steps={['Where & when', 'Interests', 'Review']} current={2} />
        <Alert title="You're offline">Changes save when you reconnect.</Alert>
        <Alert type="critical" title="Could not save" action={<Link href="/help">Get help</Link>} onDismiss={() => {}} dismissLabel="Dismiss">Try again in a moment.</Alert>
        <EmptyState container="bordered" title="No saved places yet" action={<Button size="md">Explore places</Button>}>Your saved places show up here.</EmptyState>
        <EmptyState type="no-results" title="No results" action={<Button variant="secondary" size="md">Clear filters</Button>}>Try fewer filters.</EmptyState>
      </div>
    )
  },
}

export const ListsAndRows: Story = {
  render: function Render() {
    const [on, setOn] = useState(true)
    return (
      <div className="grid max-w-[480px] gap-[var(--space-6)]">
        <ul className="border-t border-ui-border">
          <ListItem title="Name and photo" leading={<Settings />} chevron onClick={() => {}} />
          <ListItem title="Badges you earn" secondary="Push and email" trailing={<Toggle label="Badges you earn" hideLabel checked={on} onCheckedChange={setOn} />} />
          <ListItem title="Language" trailing="English" chevron onClick={() => {}} divider={false} />
        </ul>
        <div className="border-t border-ui-border">
          <AccordionItem title="How do I make a plan?">Tap New plan, then add places from the map.</AccordionItem>
          <AccordionItem title="Is B4K free?" defaultExpanded>Yes.</AccordionItem>
        </div>
        <ul role="tree" aria-label="Explore">
          <TreeItem label="K-Pop" kind="expanded" count={31}>
            <TreeItem label="Concert halls" kind="leaf" level={2} selected count={8} />
            <TreeItem label="Agencies" kind="leaf" level={2} count={5} />
          </TreeItem>
          <TreeItem label="K-Drama" kind="collapsed" count={24} />
        </ul>
        <ul>
          <LeaderboardRow rank={1} rankLabel="Rank 1" name="Mina Park" detail="12 plans · 4 badges" score="2,340" trend={{ direction: 'up', label: 'Up' }} href="#" renderLink={link} />
          <LeaderboardRow rank={14} rankLabel="Rank 14" name="Sun Kim" you="You" detail="3 plans · 1 badge" score="410" />
        </ul>
        <ul>
          <NotificationItem icon={<Award />} title="You earned First Save" body="Keep saving to unlock Map Maker." time="2h" unreadLabel="Unread" href="#" renderLink={link} />
          <NotificationItem icon={<Calendar />} title="Event near your saves" time="Yesterday" read unreadLabel="Unread" href="#" renderLink={link} />
        </ul>
        <Table
          caption="Top plans"
          columns={[{ id: 'name', header: 'Plan', cell: (r: { name: string; saves: number }) => r.name }, { id: 'saves', header: 'Saves', numeric: true, sortable: true, cell: (r) => r.saves }]}
          rows={[{ name: 'K-drama day', saves: 120 }, { name: 'Hongdae night', saves: 87 }]}
          rowKey={(r) => r.name}
          sort={{ id: 'saves', direction: 'descending' }}
          onSort={() => {}}
        />
      </div>
    )
  },
}

export const ContentAndPlanning: Story = {
  render: function Render() {
    const [msg, setMsg] = useState('Rainy day near Hongdae')
    const [range, setRange] = useState<DateRange>({ start: null, end: null })
    const [stars, setStars] = useState(4)
    return (
      <div className="grid max-w-[560px] gap-[var(--space-6)]">
        <SectionHeader title="Popular plans" subtitle="Saved most this week" seeAll={{ href: '/explore', label: 'See all' }} arrows={{ onPrevious: () => {}, onNext: () => {}, previousLabel: 'Previous', nextLabel: 'Next', atStart: true }} />
        <div className="relative w-[240px]">
          <Image ratio="4:3" src="/mock-images/cherry.png" alt="Bukchon in spring" />
          <SaveLikeOverlay saved={false} onSave={() => {}} saveLabel="Save Bukchon" like={{ liked: true, onLike: () => {}, label: 'Like Bukchon' }} />
        </div>
        <div className="flex gap-[var(--space-4)]">
          <AchievementBadge name="First Save" detail="Common · Earned Oct 12" icon={<Bookmark />} />
          <AchievementBadge name="Map Maker" detail="Rare · Earned Oct 14" icon={<Map />} rarity="rare" />
          <AchievementBadge name="Trailblazer" detail="Epic" icon={<Zap />} rarity="epic" />
          <AchievementBadge name="Legend" detail="Legendary" icon={<Trophy />} rarity="legendary" />
          <AchievementBadge name="K-Pop Pilgrim" detail="Save 10 K-Pop places" icon={<Sparkles />} locked lockedLabel="locked" />
        </div>
        <div className="flex items-start gap-[var(--space-6)]">
          <ZoomControl onZoomIn={() => {}} onZoomOut={() => {}} zoomInLabel="Zoom in" zoomOutLabel="Zoom out" />
          <RouteMapPreview stops={[{ x: 20, y: 70, day: 1 }, { x: 45, y: 35, day: 1 }, { x: 75, y: 55, day: 2 }]} className="w-[200px]" />
          <Rating value={4.5} countText="128" label="4.5 out of 5, 128 ratings" />
        </div>
        <Rating type="input" label="Your rating" value={stars} onValueChange={setStars} valueText={`${stars} of 5`} starLabels={['1 star', '2 stars', '3 stars', '4 stars', '5 stars']} />
        <AiInput value={msg} onValueChange={setMsg} onSend={() => {}} placeholder="Ask about places, plans or routes" sendLabel="Send" />
        <ul>
          <PlanStopRow name="Gyeongbokgung" number={1} day={1} duration="2h" durationLabel="Time at Gyeongbokgung, 2 hours" onDuration={() => {}} onRemove={() => {}} removeLabel="Remove Gyeongbokgung" reorderLabel="Reorder Gyeongbokgung" />
          <PlanStopRow name="Tosokchon" number={2} day={1} duration="1h" durationLabel="Time at Tosokchon, 1 hour" onDuration={() => {}} onRemove={() => {}} removeLabel="Remove Tosokchon" reorderLabel="Reorder Tosokchon" dragging />
        </ul>
        <ol>
          <ItineraryStop name="Gyeongbokgung" number={1} day={1} meta="2h · 09:00" thumbnail="/mock-images/cherry.png" />
          <li className="pl-[var(--space-5)]"><TransportMode mode="walk" modeLabel="Walk" time="12 min" /></li>
          <ItineraryStop name="Tosokchon" number={2} day={1} meta="1h · 11:12" note="Go before noon" selected thumbnail={null} />
        </ol>
        <ButtonGroup label="Plan actions">
          <Button variant="ghost" size="md">Cancel</Button>
          <Button size="md">Save plan</Button>
        </ButtonGroup>
        <SelectionBar label="Selection" countText="3 selected" onClear={() => {}} clearLabel="Clear selection">
          <Button variant="ghost" size="sm">Move</Button>
          <Button variant="danger" size="sm">Delete</Button>
        </SelectionBar>
        <DateRangePicker value={range} onValueChange={setRange} previousLabel="Previous month" nextLabel="Next month" clearLabel="Clear" maxDays={8} />
      </div>
    )
  },
}
