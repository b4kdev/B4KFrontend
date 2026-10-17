import { ProfileVisitorScreen } from '@/components/v2/screens/A3Account'

export default function Page({ params }: { params: { id: string } }) {
  return <ProfileVisitorScreen id={params.id} />
}
