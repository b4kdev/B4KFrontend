import { SpecialScreen } from '@/components/v2/screens/A2Explore'

export default function Page({ params }: { params: { region: string } }) {
  return <SpecialScreen category="k-culture" api={`/api/explore/k-culture/heritage/${params.region}`} />
}
