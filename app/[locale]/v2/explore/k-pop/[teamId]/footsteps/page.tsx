import { SpecialScreen } from '@/components/v2/screens/A2Explore'

export default function Page({ params }: { params: { teamId: string } }) {
  return <SpecialScreen category="k-pop" api={`/api/explore/k-pop/footsteps/${params.teamId}`} />
}
