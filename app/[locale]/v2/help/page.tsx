import type { Metadata } from 'next'
import { HelpScreen } from '@/components/v2/screens/A4Pages'
import { JsonLd } from '@/components/v2/JsonLd'
import { helpMetadata } from '@/app/[locale]/_seo/page-metadata'
import { buildFaqJsonLd } from '@/app/[locale]/help/help-seo'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return helpMetadata(params.locale)
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  return (
    <>
      <JsonLd data={await buildFaqJsonLd(params.locale)} />
      <HelpScreen />
    </>
  )
}
