import type { Metadata } from 'next'
import { ExploreEntryScreen } from '@/components/v2/screens/A2Explore'
import { exploreMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return exploreMetadata(params.locale)
}

export default function Page() {
  return <ExploreEntryScreen />
}
