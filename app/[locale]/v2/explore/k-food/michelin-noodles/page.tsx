import type { Metadata } from 'next'
import { SpecialScreen } from '@/components/v2/screens/A2Explore'
import { JsonLd } from '@/components/v2/JsonLd'
import { buildMichelinNoodlesJsonLd, buildMichelinNoodlesMetadata } from '@/app/[locale]/explore/k-food/michelin-noodles/michelin-noodles-seo'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return buildMichelinNoodlesMetadata(params.locale)
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  return (
    <>
      <JsonLd data={await buildMichelinNoodlesJsonLd(params.locale)} />
      <SpecialScreen category="k-food" api="/api/explore/k-food/michelin-noodles" titleKey="CD0267" />
    </>
  )
}
