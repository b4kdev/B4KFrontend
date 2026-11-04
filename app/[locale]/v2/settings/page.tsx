import type { Metadata } from 'next'
import { SettingsScreen } from '@/components/v2/screens/A3Account'
import { settingsMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return settingsMetadata(params.locale)
}

export default function Page() {
  return <SettingsScreen />
}
