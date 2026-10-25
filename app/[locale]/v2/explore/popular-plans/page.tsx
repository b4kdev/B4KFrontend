import { SeeAllScreen } from '@/components/v2/screens/A2Explore'
import type { Metadata } from 'next'
import { seeAllMetadata } from '@/lib/see-all-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return seeAllMetadata(params.locale, 'all', 'popular-plans')
}

// See all list for the Home row.
export default function Page() {
  return <SeeAllScreen category="all" row="popular-plans" />
}
