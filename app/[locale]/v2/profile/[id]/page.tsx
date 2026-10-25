import type { Metadata } from 'next'
import { ProfileVisitorScreen } from '@/components/v2/screens/A3Account'
import { profileMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string; id: string } }): Promise<Metadata> {
  return profileMetadata(params.locale, params.id)
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProfileVisitorScreen id={params.id} />
}
