import type { Metadata } from 'next'
import { HomeScreen } from '@/components/v2/screens/A2Home'
import { JsonLd } from '@/components/v2/JsonLd'
import { homeMetadata } from '@/app/[locale]/_seo/page-metadata'
import { buildWebsiteJsonLd } from '@/app/[locale]/_components/home/home-seo'
import { getRidePage } from '@/lib/explore-rides'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return homeMetadata(params.locale)
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  return (
    <>
      <JsonLd data={buildWebsiteJsonLd(params.locale)} />
      <HomeScreen rides={{ culture: await getRidePage('k-culture', params.locale), food: await getRidePage('k-food', params.locale) }} />
    </>
  )
}
