import type { Metadata } from 'next'
import { HelpScreen } from '@/components/v2/screens/A4Pages'
import { JsonLd } from '@/components/v2/JsonLd'
import { helpMetadata } from '@/app/[locale]/_seo/page-metadata'
import { buildFaqJsonLd } from '@/app/[locale]/help/help-seo'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return helpMetadata(params.locale)
}

export default async function Page({ params }: { params: { locale: string } }) {
  return (
    <>
      <JsonLd data={await buildFaqJsonLd(params.locale)} />
      <HelpScreen />
    </>
  )
}
