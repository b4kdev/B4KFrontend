import { SeeAllScreen } from '@/components/v2/screens/A2Explore'

// See all list (SCR-010) for a row of this category.
export default function Page({ params }: { params: { teamId: string } }) {
  return <SeeAllScreen category="k-pop" row={params.teamId} />
}
