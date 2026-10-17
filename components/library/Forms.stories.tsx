import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Mail } from 'lucide-react'
import { SearchInput } from './SearchInput'
import { Select } from './Select'
import { Textarea } from './Textarea'
import { TextInput } from './TextInput'

const meta = { title: 'Atoms/Form fields', tags: ['autodocs'] } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

/** Text input, Select, Textarea, Search input: every state from Figma. */
export const Gallery: Story = {
  render: function Render() {
    const [email, setEmail] = useState('name@example.com')
    const [q, setQ] = useState('Gwangjang')
    const [note, setNote] = useState('')
    return (
      <div className="grid max-w-[360px] gap-[var(--space-6)]">
        <TextInput label="Email" placeholder="Email *" required leadingIcon={<Mail />} />
        <TextInput label="Email" showLabel value={email} onChange={(e) => setEmail(e.target.value)} onClear={() => setEmail('')} clearLabel="Clear" help="We send the sign-in link here." />
        <TextInput label="Email" showLabel value="name@" readOnly error="Enter a full email address." />
        <TextInput label="Email" placeholder="Email" size="md" disabled />
        <Select label="Language" showLabel placeholder="Choose a language" defaultValue="">
          <option value="en">English</option>
          <option value="ko">한국어</option>
        </Select>
        <Textarea label="Note" showLabel placeholder="Add a note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} showCounter help="Only you see this." />
        <SearchInput label="Search places and plans" placeholder="Search places and plans" value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} clearLabel="Clear" />
      </div>
    )
  },
}
