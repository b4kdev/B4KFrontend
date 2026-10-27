import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ConsentScreen } from '@/components/v2/screens/A4Auth'
import { utilityMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return utilityMetadata(params.locale, '/consent', 'CD1504')
}

export default function Page() {
  return <Suspense><ConsentScreen /></Suspense>
}
