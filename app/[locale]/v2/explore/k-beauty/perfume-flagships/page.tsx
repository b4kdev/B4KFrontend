import type { Metadata } from 'next'
import { SpecialScreen } from '@/components/v2/screens/A2Explore'
import { JsonLd } from '@/components/v2/JsonLd'
import { buildPerfumeFlagshipsJsonLd, buildPerfumeFlagshipsMetadata } from '@/app/[locale]/explore/k-beauty/perfume-flagships/perfume-flagships-seo'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return buildPerfumeFlagshipsMetadata(params.locale)
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  return (
    <>
      <JsonLd data={await buildPerfumeFlagshipsJsonLd(params.locale)} />
      <SpecialScreen category="k-beauty" api="/api/explore/k-beauty/perfume-flagships" />
    </>
  )
}
