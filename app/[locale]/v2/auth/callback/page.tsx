import type { Metadata } from 'next'
import { AuthCallbackScreen } from '@/components/v2/screens/A4Auth'
import { utilityMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return utilityMetadata(params.locale, '/auth/callback', 'CD0050')
}

export default function Page() {
  return <AuthCallbackScreen />
}
