import type { Meta, StoryObj } from '@storybook/react'
import { SkipLink } from './SkipLink'

const meta = {
  title: 'Atoms/Skip link',
  component: SkipLink,
  tags: ['autodocs'],
  args: { children: 'Skip to main content' },
} satisfies Meta<typeof SkipLink>

export default meta
type Story = StoryObj<typeof meta>

/** Hidden until focused: click in the canvas, then press Tab. */
export const Default: Story = {
  render: (args) => (
    <>
      <SkipLink {...args} />
      <p className="text-ui-fg-muted">Press Tab to show the skip link.</p>
      <main id="main" tabIndex={-1} className="mt-[var(--space-6)]">Main content</main>
    </>
  ),
}
