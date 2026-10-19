import type { Metadata } from 'next'
import { HomeScreen } from '@/components/v2/screens/A2Home'
import { JsonLd } from '@/components/v2/JsonLd'
import { homeMetadata } from '@/app/[locale]/_seo/page-metadata'
import { buildWebsiteJsonLd } from '@/app/[locale]/_components/home/home-seo'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return homeMetadata(params.locale)
}

export default function Page() {
  return (
    <>
      <JsonLd data={buildWebsiteJsonLd()} />
      <HomeScreen />
    </>
  )
}
