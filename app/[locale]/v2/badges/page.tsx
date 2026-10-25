import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { BadgesScreen } from '@/components/v2/screens/A3Account'
import { GAMIFICATION } from '@/lib/features'

export default function Page() {
  if (!GAMIFICATION) notFound()
  // Suspense: the screen reads ?badge= (View badge on the unlock toast).
  return <Suspense><BadgesScreen /></Suspense>
}
