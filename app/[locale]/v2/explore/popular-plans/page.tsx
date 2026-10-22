import { SeeAllScreen } from '@/components/v2/screens/A2Explore'
import { seeAllMetadata } from '@/lib/see-all-metadata'

export const metadata = seeAllMetadata

// See all list for the Home row.
export default function Page() {
  return <SeeAllScreen category="all" row="popular-plans" />
}
