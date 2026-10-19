import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginScreen } from '@/components/v2/screens/A4Auth'
import { loginMetadata } from '@/app/[locale]/_seo/page-metadata'

export const metadata: Metadata = loginMetadata

export default function Page() {
  return <Suspense><LoginScreen /></Suspense>
}
