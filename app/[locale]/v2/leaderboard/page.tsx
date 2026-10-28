import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LeaderboardScreen } from '@/components/v2/screens/A3Account'
import { GAMIFICATION } from '@/lib/features'
import { leaderboardMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return GAMIFICATION ? leaderboardMetadata(params.locale) : {}
}

export default function Page() {
  if (!GAMIFICATION) notFound()
  return <LeaderboardScreen />
}
