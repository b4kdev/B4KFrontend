import { notFound } from 'next/navigation'
import { LegalScreen } from '@/components/v2/screens/A4Pages'

const DOCS = ['terms', 'privacy', 'cookies'] as const

export default function Page({ params }: { params: { doc: string } }) {
  if (!DOCS.includes(params.doc as (typeof DOCS)[number])) notFound()
  return <LegalScreen doc={params.doc as (typeof DOCS)[number]} />
}
