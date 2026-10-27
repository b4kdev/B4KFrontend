import type { Metadata } from 'next'
import { PlanFromSavedScreen } from '@/components/v2/screens/A3Saved'
import { utilityMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return utilityMetadata(params.locale, '/saved/plan', 'CD1363')
}

export default function Page() {
  return <PlanFromSavedScreen />
}
