import type { Meta, StoryObj } from '@storybook/react'
import { Link } from './Link'

const meta = {
  title: 'Atoms/Link',
  component: Link,
  tags: ['autodocs'],
  args: { href: '/legal/terms', children: 'Read the terms', type: 'inline' },
  argTypes: { type: { control: 'inline-radio', options: ['inline', 'standalone'] } },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

export const Inline: Story = {
  render: (args) => (
    <p className="max-w-prose type-body-long">
      By saving a plan you agree to the <Link {...args} />. Inline links take the size of the text around them.
    </p>
  ),
}

export const Standalone: Story = { args: { type: 'standalone', children: 'See all' } }

export const External: Story = {
  render: () => (
    <Link external href="https://www.example.com" newTabLabel="(opens in a new tab)">
      Partner site
    </Link>
  ),
}
