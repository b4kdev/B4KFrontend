import { PlanScreen } from '@/components/v2/screens/A1Plan'
import { planMetadata } from '@/app/[locale]/_seo/page-metadata'

export function generateMetadata({ params }: { params: { locale: string; id: string } }) {
  return planMetadata(params.locale, params.id)
}

export default function Page({ params }: { params: { id: string } }) {
  return <PlanScreen id={params.id} />
}
