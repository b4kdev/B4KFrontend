import type { Metadata } from 'next'
import ExplorePage from '../_components/ExplorePage'
import { buildExploreMetadata, buildExploreBreadcrumbJsonLd } from '../_components/explore-seo'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return buildExploreMetadata('k-pop', params.locale)
}

export default async function KPopPage({ params }: { params: { locale: string } }) {
  const jsonLd = await buildExploreBreadcrumbJsonLd('k-pop', params.locale)
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ExplorePage category="k-pop" />
    </>
  )
}
