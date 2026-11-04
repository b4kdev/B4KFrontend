import { SeeAllScreen } from '@/components/v2/screens/A2Explore'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isExploreRow } from '@/lib/explore-sections'
import { seeAllMetadata } from '@/lib/see-all-metadata'

export async function generateMetadata(
  props: { params: Promise<{ locale: string; category: string; row: string }> }
): Promise<Metadata> {
  const params = await props.params;
  return seeAllMetadata(params.locale, params.category, params.row)
}

export default async function Page(props: { params: Promise<{ category: string; row: string }> }) {
  const params = await props.params;
  if (!isExploreRow(params.category, params.row)) notFound()
  return <SeeAllScreen category={params.category} row={params.row} />
}
