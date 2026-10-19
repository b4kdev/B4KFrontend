import type { Metadata } from 'next'
import { NotificationsScreen } from '@/components/v2/screens/A3Account'
import { notificationsMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return notificationsMetadata(params.locale)
}

export default function Page() {
  return <NotificationsScreen />
}
