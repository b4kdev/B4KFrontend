import { SpecialScreen } from '@/components/v2/screens/A2Explore'

export default function Page({ params }: { params: { workId: string } }) {
  return <SpecialScreen category="k-drama" api={`/api/explore/k-drama/filming-spots/${params.workId}`} />
}
