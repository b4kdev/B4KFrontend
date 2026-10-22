import { SeeAllScreen } from '@/components/v2/screens/A2Explore'
import { seeAllMetadata } from '@/lib/see-all-metadata'

export const metadata = seeAllMetadata

// See all list for a row of this category.
export default function Page({ params }: { params: { workId: string } }) {
  return <SeeAllScreen category="k-drama" row={params.workId} />
}
