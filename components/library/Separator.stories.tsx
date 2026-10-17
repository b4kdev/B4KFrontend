import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from './Separator'

const meta = {
  title: 'Atoms/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical', 'with-text'] } },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = { render: () => <div className="max-w-[320px]"><Separator /></div> }

export const Vertical: Story = {
  render: () => (
    <div className="flex h-[var(--control-height-sm)] items-center gap-[var(--space-3)]">
      <span>Help</span>
      <Separator orientation="vertical" />
      <span>Privacy</span>
    </div>
  ),
}

export const WithText: Story = { render: () => <div className="max-w-[320px]"><Separator orientation="with-text" text="or" /></div> }
