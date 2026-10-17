import type { Meta, StoryObj } from '@storybook/react'
import { Plus } from 'lucide-react'
import { Button } from './Button'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Save plan', variant: 'primary', size: 'lg' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['lg', 'md', 'sm'] },
    leadingIcon: { control: false },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithLeadingIcon: Story = { args: { leadingIcon: <Plus /> } }

export const Loading: Story = { args: { loading: true } }

/** Every Figma variant: Variant x Size, then Disabled and Loading. Hover, Pressed and Focus: use the pointer and Tab. */
export const AllVariants: Story = {
  render: () => (
    <div className="grid gap-[var(--space-6)]">
      {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-[var(--space-4)]">
          {(['lg', 'md', 'sm'] as const).map((size) => (
            <Button key={size} variant={variant} size={size}>
              Save plan
            </Button>
          ))}
          <Button variant={variant} leadingIcon={<Plus />}>
            Add stop
          </Button>
          <Button variant={variant} disabled>
            Save plan
          </Button>
          <Button variant={variant} loading>
            Save plan
          </Button>
        </div>
      ))}
    </div>
  ),
}
