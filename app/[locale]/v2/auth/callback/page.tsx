import type { Metadata } from 'next'
import { AuthCallbackScreen } from '@/components/v2/screens/A4Auth'
import { utilityMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return utilityMetadata(params.locale, '/auth/callback', 'CD0050')
}

export default function Page() {
  return <AuthCallbackScreen />
}
