import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginScreen } from '@/components/v2/screens/A4Auth'
import { loginMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return loginMetadata(params.locale)
}

export default function Page() {
  return <Suspense><LoginScreen /></Suspense>
}
