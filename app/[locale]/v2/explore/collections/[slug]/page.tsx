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
  if (!(await fetchCollectionDetail(params.slug, params.locale))) notFound()
  return <CollectionScreen slug={params.slug} />
}
