import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CollectionDetailClient from './CollectionDetailClient'
import { fetchCollectionDetail } from '@/lib/collections'
import { collectionMetadata } from '@/app/[locale]/_seo/page-metadata'

interface Props {
  params: { locale: string; slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return collectionMetadata(params.slug, params.locale)
}

// Generalized detail page for every entity_type='collection' row (108 real rows,
// confirmed live 2026-08-30 via GET /entities?type=collection) — see lib/collections.ts
// for why one route covers all of them instead of a page per wireframe concept.
export default async function CollectionPage({ params }: Props) {
  const detail = await fetchCollectionDetail(params.slug, params.locale)
  if (!detail) notFound()

  return <CollectionDetailClient slug={params.slug} />
}
