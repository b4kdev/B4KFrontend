import type { Metadata } from 'next'
import { ExploreEntryScreen } from '@/components/v2/screens/A2Explore'
import { exploreMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return exploreMetadata(params.locale)
}

export default function Page() {
  return <ExploreEntryScreen />
}
