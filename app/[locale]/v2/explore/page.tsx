import type { Metadata } from 'next'
import { ExploreEntryScreen } from '@/components/v2/screens/A2Explore'
import { exploreMetadata } from '@/app/[locale]/_seo/page-metadata'
import { getRidePage } from '@/lib/explore-rides'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return exploreMetadata(params.locale)
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  return <ExploreEntryScreen rides={await getRidePage('k-pop', params.locale)} />
}
