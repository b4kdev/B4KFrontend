import type { Meta, StoryObj } from '@storybook/react'
import { Bookmark, Plus } from 'lucide-react'
import { ChatBubble, ImageAction } from './Content'
import { ClusterBubble, MapControl, MapPin } from './Map'
import { DragHandle, PlanPill, StopBadge, TransportMode } from './Plan'

const meta = { title: 'Atoms/Map and plan', tags: ['autodocs'] } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <div className="grid max-w-[560px] gap-[var(--space-6)]">
      <div className="flex flex-wrap items-center gap-[var(--space-4)] bg-ui-bg-sunken p-[var(--space-4)]">
        {(['generic', 'k-pop', 'k-drama', 'k-beauty', 'k-food', 'k-culture'] as const).map((c) => <MapPin key={c} category={c} label={c} />)}
        <MapPin category="k-pop" selected label="Selected place" />
        <ClusterBubble count={7} label="7 places, zoom in" />
        <ClusterBubble count={24} label="24 places, zoom in" />
        <ClusterBubble count={120} label="120 places, zoom in" />
        <MapControl icon={<Plus />} label="Zoom in" />
      </div>
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        {([0, 1, 2, 3, 4, 5, 6, 7, 8] as const).map((d) => <StopBadge key={d} number={d || 1} day={d} />)}
        <StopBadge number={12} size="md" day={3} label="Stop 12, Day 3" />
      </div>
      <div className="flex items-center gap-[var(--space-6)]">
        <DragHandle type="grabber" label="Resize" />
        <DragHandle label="Reorder Gyeongbokgung" />
        <PlanPill label="Plan · 3 stops" accessibleLabel="Open plan, 3 stops" />
      </div>
      <div className="grid gap-[var(--space-1)] pl-[var(--space-2)]">
        <TransportMode mode="car" modeLabel="Car" time="10 min" onChange={() => {}} />
        <TransportMode mode="walk" modeLabel="Walk" time="18 min" />
        <TransportMode mode="public" modeLabel="Public" time="25 min" loading onChange={() => {}} />
        <TransportMode mode="estimate" modeLabel="About" time="15 min" />
      </div>
      <div className="flex gap-[var(--space-2)] bg-ui-bg-media p-[var(--space-3)]">
        <ImageAction icon={<Bookmark />} label="Save Gyeongbokgung" />
        <ImageAction icon={<Bookmark />} label="Saved Gyeongbokgung" on />
      </div>
      <div className="grid max-w-[320px] gap-[var(--space-2)]">
        <ChatBubble role="user">Plan a K-drama day in Seoul</ChatBubble>
        <ChatBubble role="assistant">Here is a one-day route with 5 filming spots.</ChatBubble>
        <ChatBubble role="typing" typingLabel="B4K is typing" />
      </div>
    </div>
  ),
}
