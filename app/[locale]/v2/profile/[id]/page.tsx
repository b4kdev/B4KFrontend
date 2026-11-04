import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BffError, bffFetch } from '@/lib/bff'
import { ProfileVisitorScreen } from '@/components/v2/screens/A3Account'
import { profileMetadata } from '@/app/[locale]/_seo/page-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const params = await props.params;
  return profileMetadata(params.locale, params.id)
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // A planner that does not exist is Page not found; other failures still show the screen (its own error state).
  const missing = await bffFetch(`/profiles/${encodeURIComponent(params.id)}`, { token: null }).then(() => false, (e) => e instanceof BffError && e.status === 404)
  if (missing) notFound()
  return <ProfileVisitorScreen id={params.id} />
}
