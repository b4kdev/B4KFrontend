import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Checkbox, Radio, Toggle } from './Choice'

const meta = { title: 'Atoms/Checkbox, Radio, Toggle', tags: ['autodocs'] } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: function Render() {
    const [on, setOn] = useState(true)
    return (
      <div className="grid gap-[var(--space-2)]">
        <Checkbox label="Save to my plans" />
        <Checkbox label="Save to my plans" defaultChecked />
        <Checkbox label="All K-Pop places" indeterminate />
        <Checkbox label="I agree to the terms" invalid />
        <Checkbox label="Disabled" disabled defaultChecked />
        <fieldset className="flex gap-[var(--space-6)]">
          <legend className="sr-only">Transport</legend>
          <Radio name="t" label="Walking" defaultChecked />
          <Radio name="t" label="Public" />
          <Radio name="t" label="Car" disabled />
        </fieldset>
        <Toggle label="Plan reminders" checked={on} onCheckedChange={setOn} />
        <Toggle label="Badges you earn" checked={false} onCheckedChange={() => {}} disabled />
      </div>
    )
  },
}
