import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchScreen } from '@/components/v2/screens/A4Pages'
import { searchMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return searchMetadata(params.locale)
}

export default function Page() {
  return <Suspense><SearchScreen /></Suspense>
}
