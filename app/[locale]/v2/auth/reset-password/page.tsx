import type { Metadata } from 'next'
import { ResetPasswordScreen } from '@/components/v2/screens/A4Auth'
import { utilityMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return utilityMetadata(params.locale, '/auth/reset-password', 'CD1823')
}

export default function Page() {
  return <ResetPasswordScreen />
}
