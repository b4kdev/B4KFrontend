import type { Meta, StoryObj } from '@storybook/react'
import { MapPin, Plus, SlidersHorizontal } from 'lucide-react'
import { Chip } from './Chip'
import { Fab } from './Fab'
import { IconButton } from './IconButton'

const meta = { title: 'Atoms/Icon button, Chip, FAB', tags: ['autodocs'] } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <div className="grid gap-[var(--space-6)]">
      <div className="flex items-center gap-[var(--space-4)]">
        <IconButton variant="primary" label="Add" icon={<Plus />} />
        <IconButton variant="secondary" label="Add" icon={<Plus />} />
        <IconButton variant="ghost" label="Add" icon={<Plus />} />
        <IconButton variant="primary" label="Add" icon={<Plus />} disabled />
      </div>
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <Chip>All</Chip>
        <Chip selected count={31}>All</Chip>
        <Chip leadingIcon={<MapPin />}>Places</Chip>
        <Chip type="dismissible" dismissLabel="Remove K-Pop filter">K-Pop</Chip>
        <Chip type="dropdown">Sort</Chip>
        <Chip type="icon-only" leadingIcon={<SlidersHorizontal />}>All filters</Chip>
        <Chip disabled>Disabled</Chip>
      </div>
      <div className="flex flex-wrap items-center gap-[var(--space-2)] bg-ui-bg-sunken p-[var(--space-4)]">
        <Chip type="map" leadingIcon={<MapPin />}>K-Pop</Chip>
        <Chip type="map" selected leadingIcon={<MapPin />}>K-Drama</Chip>
      </div>
      <div className="flex items-center gap-[var(--space-4)]">
        <Fab label="Ask AI" />
        <Fab type="extended" label="Ask AI" />
        <Fab label="Ask AI" open />
      </div>
    </div>
  ),
}
