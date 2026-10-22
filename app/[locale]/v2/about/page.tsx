import type { Metadata } from 'next'
import { AboutScreen } from '@/components/v2/screens/A4Pages'
import { aboutMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return aboutMetadata(params.locale)
}

export default function Page() {
  return <AboutScreen />
}
