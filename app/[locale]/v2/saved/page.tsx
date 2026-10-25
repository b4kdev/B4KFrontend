import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SavedScreen } from '@/components/v2/screens/A3Saved'
import { savedMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return savedMetadata(params.locale)
}

export default function Page() {
  return <Suspense><SavedScreen /></Suspense>
}
