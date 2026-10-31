import type { Metadata } from 'next'
import { AboutScreen } from '@/components/v2/screens/A4Pages'
import { aboutMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return aboutMetadata(params.locale)
}

export default function Page() {
  return <AboutScreen />
}
