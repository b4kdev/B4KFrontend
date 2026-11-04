import { SeeAllScreen } from '@/components/v2/screens/A2Explore'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isExploreRow } from '@/lib/explore-sections'
import { seeAllMetadata } from '@/lib/see-all-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string; workId: string }> }): Promise<Metadata> {
  const params = await props.params;
  return seeAllMetadata(params.locale, 'k-drama', params.workId)
}

// See all list for a row of this category.
export default async function Page(props: { params: Promise<{ workId: string }> }) {
  const params = await props.params;
  if (!isExploreRow('k-drama', params.workId)) notFound()
  return <SeeAllScreen category="k-drama" row={params.workId} />
}
