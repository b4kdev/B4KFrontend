import { SeeAllScreen } from '@/components/v2/screens/A2Explore'

export default function Page({ params }: { params: { category: string; row: string } }) {
  return <SeeAllScreen category={params.category} row={params.row} />
}
