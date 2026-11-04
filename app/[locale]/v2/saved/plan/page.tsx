import type { Metadata } from 'next'
import { PlanFromSavedScreen } from '@/components/v2/screens/A3Saved'
import { utilityMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return utilityMetadata(params.locale, '/saved/plan', 'CD1363')
}

export default function Page() {
  return <PlanFromSavedScreen />
}
