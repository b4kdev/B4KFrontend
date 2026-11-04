import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MapScreen } from '@/components/v2/screens/A1Map'
import { mapMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return mapMetadata(params.locale)
}

export default function Page() {
  return <Suspense><MapScreen /></Suspense>
}
