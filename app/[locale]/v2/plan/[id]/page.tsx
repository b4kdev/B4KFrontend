import { notFound } from 'next/navigation'
import { isNumericId } from '@/lib/itinerary'
import { PlanScreen } from '@/components/v2/screens/A1Plan'
import { JsonLd } from '@/components/v2/JsonLd'
import { planMetadata } from '@/app/[locale]/_seo/page-metadata'
import { buildPlanJsonLd, fetchPublicPlan } from '@/app/[locale]/_seo/plan-seo'
import { seoText } from '@/lib/seo'

export async function generateMetadata(props: { params: Promise<{ locale: string; id: string }> }) {
  const params = await props.params;
  return planMetadata(params.locale, params.id)
}

export default async function Page(props: { params: Promise<{ locale: string; id: string }> }) {
  const params = await props.params;
  // Plan addresses are numbers; anything else is Page not found (a private plan still opens for its owner).
  if (!isNumericId(params.id)) notFound()
  const plan = await fetchPublicPlan(params.id)
  const untitled = plan && !plan.title ? (await seoText(params.locale)).k('profile.untitledPlan') : ''
  return (
    <>
      {plan ? <JsonLd data={buildPlanJsonLd(plan, params.locale, untitled)} /> : null}
      <PlanScreen id={params.id} />
    </>
  )
}
