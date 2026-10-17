import type { Meta, StoryObj } from '@storybook/react'
import { Spinner } from './Spinner'

const meta = {
  title: 'Atoms/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  args: { size: 'md', label: 'Loading' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-[var(--space-6)]">
      <Spinner size="sm" label="Loading" />
      <Spinner size="md" label="Loading" />
      <Spinner size="lg" label="Loading" />
      <span className="inline-flex bg-ui-bg-inverse p-[var(--space-3)]"><Spinner size="sm" tone="inverse" /></span>
    </div>
  ),
}
