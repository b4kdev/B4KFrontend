import { notFound } from 'next/navigation'
import { isNumericId } from '@/lib/itinerary'
import { PlanScreen } from '@/components/v2/screens/A1Plan'
import { JsonLd } from '@/components/v2/JsonLd'
import { planMetadata } from '@/app/[locale]/_seo/page-metadata'
import { buildPlanJsonLd, fetchPublicPlan } from '@/app/[locale]/_seo/plan-seo'

export function generateMetadata({ params }: { params: { locale: string; id: string } }) {
  return planMetadata(params.locale, params.id)
}

export default async function Page({ params }: { params: { locale: string; id: string } }) {
  // Plan addresses are numbers; anything else is Page not found (a private plan still opens for its owner).
  if (!isNumericId(params.id)) notFound()
  const plan = await fetchPublicPlan(params.id)
  return (
    <>
      {plan ? <JsonLd data={buildPlanJsonLd(plan, params.locale)} /> : null}
      <PlanScreen id={params.id} />
    </>
  )
}
