import { SeeAllScreen } from '@/components/v2/screens/A2Explore'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isExploreRow } from '@/lib/explore-sections'
import { seeAllMetadata } from '@/lib/see-all-metadata'

export async function generateMetadata({ params }: { params: { locale: string; region: string } }): Promise<Metadata> {
  return seeAllMetadata(params.locale, 'k-culture', params.region)
}

// See all list for a row of this category.
export default function Page({ params }: { params: { region: string } }) {
  if (!isExploreRow('k-culture', params.region)) notFound()
  return <SeeAllScreen category="k-culture" row={params.region} />
}
