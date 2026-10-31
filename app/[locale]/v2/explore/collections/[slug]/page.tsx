import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchCollectionDetail } from '@/lib/collections'
import { CollectionScreen } from '@/components/v2/screens/A2Explore'
import { collectionMetadata } from '@/app/[locale]/_seo/page-metadata'

type Props = { params: { locale: string; slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return collectionMetadata(params.slug, params.locale)
}

export default async function Page({ params }: Props) {
  // Page not found only when the collection does not exist; when the load fails the screen
  // still renders and shows its error state with Try again.
  const detail = await fetchCollectionDetail(params.slug, params.locale).catch(() => undefined)
  if (detail === null) notFound()
  return <CollectionScreen slug={params.slug} />
}
