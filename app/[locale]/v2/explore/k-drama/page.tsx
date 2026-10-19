import type { Metadata } from 'next'
import { CategoryScreen } from '@/components/v2/screens/A2Explore'
import { JsonLd } from '@/components/v2/JsonLd'
import { buildExploreBreadcrumbJsonLd, buildExploreMetadata } from '@/app/[locale]/explore/_components/explore-seo'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return buildExploreMetadata('k-drama', params.locale)
}

export default async function Page({ params }: { params: { locale: string } }) {
  return (
    <>
      <JsonLd data={await buildExploreBreadcrumbJsonLd('k-drama', params.locale)} />
      <CategoryScreen category="k-drama" />
    </>
  )
}
