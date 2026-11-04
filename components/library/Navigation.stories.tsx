import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Bookmark, Compass, House, Map, Pencil, Share2, Trash2 } from 'lucide-react'
import { CountBadge } from './Badge'
import { CalendarDay } from './Content'
import { ComboboxOption, MenuItem } from './Menu'
import { NAV_ITEM_TARGET, NavItem, PageItem, Segment, StepItem, Tab } from './Nav'

const meta = { title: 'Atoms/Navigation and menus', tags: ['autodocs'] } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: function Render() {
    const [tab, setTab] = useState(0)
    const [seg, setSeg] = useState(0)
    return (
      <div className="grid max-w-[480px] gap-[var(--space-6)]">
        <div role="tablist" className="flex border-b border-ui-border">
          {['Places', 'Plans', 'Day 1'].map((t, i) => (
            <Tab key={t} selected={tab === i} day={i === 2 ? 1 : undefined} onClick={() => setTab(i)}>{t}</Tab>
          ))}
        </div>
        <div role="radiogroup" aria-label="Visibility" className="flex w-[240px] rounded-full border border-ui-border-strong p-[2px]">
          {['Private', 'Public'].map((t, i) => <Segment key={t} selected={seg === i} onClick={() => setSeg(i)}>{t}</Segment>)}
        </div>
        <div className="flex gap-[var(--space-1)]">{[1, 2, 3].map((n) => <PageItem key={n} current={n === 2}>{n}</PageItem>)}</div>
        <nav aria-label="Main" className="flex w-[320px] border border-ui-border">
          <a href="#" className={NAV_ITEM_TARGET} aria-current="page"><NavItem icon={<House />} label="Home" active /></a>
          <a href="#" className={NAV_ITEM_TARGET}><NavItem icon={<Map />} label="Map" /></a>
          <a href="#" className={NAV_ITEM_TARGET}><NavItem icon={<Compass />} label="Explore" /></a>
          <a href="#" className={NAV_ITEM_TARGET}><NavItem icon={<Bookmark />} label="Saved" badge={<CountBadge />} /></a>
        </nav>
        <ol className="flex gap-[var(--space-4)]">
          <StepItem number={1} label="Where & when" state="done" />
          <StepItem number={2} label="Interests" state="current" />
          <StepItem number={3} label="Review" />
        </ol>
        <div role="menu" className="w-[240px] rounded-2xl border border-ui-border bg-ui-bg-elevated py-[var(--space-2)]">
          <MenuItem icon={<Pencil />}>Rename</MenuItem>
          <MenuItem icon={<Share2 />} checked>Share</MenuItem>
          <MenuItem icon={<Trash2 />} variant="danger">Delete folder</MenuItem>
        </div>
        <ul role="listbox" aria-label="Suggestions" className="w-[320px] bg-ui-bg-elevated">
          <ComboboxOption id="o1" type="recent" title="Gwangjang Market" onSelect={() => {}} onRemove={() => {}} removeLabel="Remove" />
          <ComboboxOption id="o2" type="place" title="Gwangjang Market" match="Gwang" secondary="Jongno-gu · Market" active onSelect={() => {}} />
        </ul>
        <div className="flex">
          <CalendarDay day={19} label="19 October" today />
          <CalendarDay day={20} label="20 October" position="start" />
          <CalendarDay day={21} label="21 October" position="in-range" />
          <CalendarDay day={22} label="22 October" position="end" />
          <CalendarDay day={23} label="23 October" />
          <CalendarDay day={12} label="12 October" disabled />
        </div>
      </div>
    )
  },
}
