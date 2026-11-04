import type { Metadata } from 'next'
import { CategoryScreen } from '@/components/v2/screens/A2Explore'
import { JsonLd } from '@/components/v2/JsonLd'
import { buildExploreBreadcrumbJsonLd, buildExploreMetadata } from '@/app/[locale]/explore/_components/explore-seo'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return buildExploreMetadata('k-culture', params.locale)
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  return (
    <>
      <JsonLd data={await buildExploreBreadcrumbJsonLd('k-culture', params.locale)} />
      <CategoryScreen category="k-culture" />
    </>
  )
}
