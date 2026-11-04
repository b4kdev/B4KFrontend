import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchScreen } from '@/components/v2/screens/A4Pages'
import { searchMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return searchMetadata(params.locale)
}

export default function Page() {
  return <Suspense><SearchScreen /></Suspense>
}
