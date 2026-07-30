import type { Metadata } from 'next'
import ExplorePage from '../_components/ExplorePage'
import { buildExploreMetadata, buildExploreBreadcrumbJsonLd } from '../_components/explore-seo'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return buildExploreMetadata('k-food', params.locale)
}

// DEC-61 — K-Food promoted to a real 5th Explore section (previously didn't exist
// anywhere in the app or FRD inventory).
export default async function KFoodPage({ params }: { params: { locale: string } }) {
  const jsonLd = await buildExploreBreadcrumbJsonLd('k-food', params.locale)
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ExplorePage category="k-food" />
    </>
  )
}
