import { SeeAllScreen } from '@/components/v2/screens/A2Explore'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isExploreRow } from '@/lib/explore-sections'
import { seeAllMetadata } from '@/lib/see-all-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string; row: string }> }): Promise<Metadata> {
  const params = await props.params;
  return seeAllMetadata(params.locale, 'k-beauty', params.row)
}

// See all list for a row of this category.
export default async function Page(props: { params: Promise<{ row: string }> }) {
  const params = await props.params;
  if (!isExploreRow('k-beauty', params.row)) notFound()
  return <SeeAllScreen category="k-beauty" row={params.row} />
}
