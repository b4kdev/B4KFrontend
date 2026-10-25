import type { Metadata } from 'next'
import { ProfileOwnScreen } from '@/components/v2/screens/A3Account'
import { profileOwnMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return profileOwnMetadata(params.locale)
}

export default function Page() {
  return <ProfileOwnScreen />
}
