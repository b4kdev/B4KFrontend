import { SeeAllScreen } from '@/components/v2/screens/A2Explore'
import type { Metadata } from 'next'
import { seeAllMetadata } from '@/lib/see-all-metadata'

export async function generateMetadata({ params }: { params: { locale: string; category: string; row: string } }): Promise<Metadata> {
  return seeAllMetadata(params.locale, params.category, params.row)
}

export default function Page({ params }: { params: { category: string; row: string } }) {
  return <SeeAllScreen category={params.category} row={params.row} />
}
