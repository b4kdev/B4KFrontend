import type { Metadata } from 'next'
import { ResetPasswordScreen } from '@/components/v2/screens/A4Auth'
import { utilityMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return utilityMetadata(params.locale, '/auth/reset-password', 'CD1823')
}

export default function Page() {
  return <ResetPasswordScreen />
}
