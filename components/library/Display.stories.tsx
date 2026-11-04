import type { Meta, StoryObj } from '@storybook/react'
import { Bell, CloudSun, MapPin } from 'lucide-react'
import { Avatar } from './Avatar'
import { Badge, CountBadge } from './Badge'
import { Logo, ProviderLogo } from './Brand'
import { ForecastDay, StatCounter } from './Content'
import { Image } from './Image'
import { ProgressBar, Skeleton } from './Progress'
import { Tooltip } from './Tooltip'
import { IconButton } from './IconButton'

const meta = { title: 'Atoms/Display', tags: ['autodocs'] } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <div className="grid max-w-[640px] gap-[var(--space-6)]">
      <div className="flex items-center gap-[var(--space-6)]">
        <Logo label="B4K" />
        <Logo type="mark" label="B4K" />
        <ProviderLogo />
      </div>
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <Badge variant="strong">Featured</Badge>
        <Badge>Featured</Badge>
        <Badge variant="inverse">Featured</Badge>
        <Badge variant="outline" leadingIcon={<MapPin />}>Seoul</Badge>
        <span className="bg-ui-bg-media p-[var(--space-2)]"><Badge variant="on-image">On image</Badge></span>
        <Badge variant="critical">Closed</Badge>
      </div>
      <div className="flex items-center gap-[var(--space-6)]">
        <span className="relative inline-flex"><Bell className="size-[var(--icon-size-md)]" /><CountBadge count={3} className="absolute -right-[6px] -top-[4px]" /></span>
        <span className="relative inline-flex"><Bell className="size-[var(--icon-size-md)]" /><CountBadge count={120} className="absolute -right-[10px] -top-[4px]" /></span>
        <span className="relative inline-flex"><Bell className="size-[var(--icon-size-md)]" /><CountBadge className="absolute -right-[2px] -top-[2px]" /></span>
      </div>
      <div className="flex items-end gap-[var(--space-4)]">
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => <Avatar key={s} size={s} name="Sun Kim" />)}
        <Avatar size="md" />
      </div>
      <div className="grid grid-cols-4 gap-[var(--space-3)]">
        <Image ratio="1:1" alt="" />
        <Image ratio="4:3" alt="" src="/mock-images/cherry.png" />
        <Image ratio="16:9" alt="" />
        <Image ratio="12:5" alt="" />
      </div>
      <div className="grid gap-[var(--space-3)]">
        <ProgressBar value={60} label="Step 2 of 3" />
        <ProgressBar label="Loading" />
        <div className="flex items-center gap-[var(--space-3)]">
          <Skeleton shape="circle" className="size-[var(--avatar-size-md)]" />
          <div className="grid flex-1 gap-[var(--space-2)]"><Skeleton shape="line" className="w-2/3" /><Skeleton shape="line" className="w-1/3" /></div>
          <Skeleton className="aspect-[4/3] w-[120px]" />
        </div>
      </div>
      <div className="flex items-center gap-[var(--space-4)]">
        <StatCounter number={12} label="Trips" />
        <StatCounter number={340} label="Saves" separator />
        <ForecastDay day="Mon" icon={<CloudSun />} range="21° / 13°" label="Monday, partly cloudy, 13 to 21 degrees" />
        <Tooltip text="Add to plan"><IconButton label="Notifications" icon={<Bell />} /></Tooltip>
      </div>
    </div>
  ),
}
