import { PlanScreen } from '@/components/v2/screens/A1Plan'

export default function Page({ params }: { params: { id: string } }) {
  return <PlanScreen id={params.id} />
}
