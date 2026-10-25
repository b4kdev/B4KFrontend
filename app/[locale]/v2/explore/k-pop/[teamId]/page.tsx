import { SeeAllScreen } from '@/components/v2/screens/A2Explore'
import type { Metadata } from 'next'
import { seeAllMetadata } from '@/lib/see-all-metadata'

export async function generateMetadata({ params }: { params: { locale: string; teamId: string } }): Promise<Metadata> {
  return seeAllMetadata(params.locale, 'k-pop', params.teamId)
}

// See all list for a row of this category.
export default function Page({ params }: { params: { teamId: string } }) {
  return <SeeAllScreen category="k-pop" row={params.teamId} />
}
