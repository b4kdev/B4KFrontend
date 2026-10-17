import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Toast } from './Toast'

const meta = {
  title: 'Molecules/Toast',
  component: Toast,
  tags: ['autodocs'],
  args: {
    type: 'info',
    message: 'Saved to Seoul food',
    action: { label: 'View', onClick: fn() },
    onClose: fn(),
    closeLabel: 'Close',
  },
  argTypes: { type: { control: 'inline-radio', options: ['info', 'success', 'warning', 'critical'] } },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const AllTypes: Story = {
  render: (args) => (
    <div className="grid gap-[var(--space-4)]">
      <Toast {...args} type="info" />
      <Toast {...args} type="success" message="Added to Day 1" action={undefined} />
      <Toast {...args} type="warning" message="You are offline. Changes save when you reconnect." action={undefined} />
      <Toast {...args} type="critical" message="Could not save the plan" action={{ label: 'Retry', onClick: () => {} }} />
    </div>
  ),
}
