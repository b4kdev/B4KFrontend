import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LegalScreen } from '@/components/v2/screens/A4Pages'
import { LEGAL_DOCS, legalMetadata, type LegalDoc } from '@/app/[locale]/_seo/page-metadata'

type Props = { params: { locale: string; doc: string } }
const isDoc = (d: string): d is LegalDoc => (LEGAL_DOCS as readonly string[]).includes(d)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return isDoc(params.doc) ? legalMetadata(params.doc, params.locale) : {}
}

export default function Page({ params }: Props) {
  if (!isDoc(params.doc)) notFound()
  return <LegalScreen doc={params.doc} />
}
