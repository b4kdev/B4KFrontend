import { notFound } from 'next/navigation'
import { LeaderboardScreen } from '@/components/v2/screens/A3Account'
import { GAMIFICATION } from '@/lib/features'

export default function Page() {
  if (!GAMIFICATION) notFound()
  return <LeaderboardScreen />
}
