import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MapScreen } from '@/components/v2/screens/A1Map'
import { mapMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return mapMetadata(params.locale)
}

export default function Page() {
  return <Suspense><MapScreen /></Suspense>
}
