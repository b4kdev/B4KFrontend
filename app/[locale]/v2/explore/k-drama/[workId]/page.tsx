import { SeeAllScreen } from '@/components/v2/screens/A2Explore'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isExploreRow } from '@/lib/explore-sections'
import { seeAllMetadata } from '@/lib/see-all-metadata'

export async function generateMetadata({ params }: { params: { locale: string; workId: string } }): Promise<Metadata> {
  return seeAllMetadata(params.locale, 'k-drama', params.workId)
}

// See all list for a row of this category.
export default function Page({ params }: { params: { workId: string } }) {
  if (!isExploreRow('k-drama', params.workId)) notFound()
  return <SeeAllScreen category="k-drama" row={params.workId} />
}
