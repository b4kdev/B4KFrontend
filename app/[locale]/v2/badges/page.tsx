import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { BadgesScreen } from '@/components/v2/screens/A3Account'
import { GAMIFICATION } from '@/lib/features'
import { badgesMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return GAMIFICATION ? badgesMetadata(params.locale) : {}
}

export default function Page() {
  if (!GAMIFICATION) notFound()
  // Suspense: the screen reads ?badge= (View badge on the unlock toast).
  return <Suspense><BadgesScreen /></Suspense>
}
