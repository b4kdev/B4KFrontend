import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchCollectionDetail } from '@/lib/collections'
import CollectionDetailClient from './CollectionDetailClient'

interface Props {
  params: { locale: string; slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = await fetchCollectionDetail(params.slug)
  if (!detail) return {}
  return { title: `${detail.title} | B4K` }
}

// Generalized detail page for every entity_type='collection' row (108 real rows,
// confirmed live 2026-08-30 via GET /entities?type=collection) — see lib/collections.ts
// for why one route covers all of them instead of a page per wireframe concept.
export default async function CollectionPage({ params }: Props) {
  const detail = await fetchCollectionDetail(params.slug)
  if (!detail) notFound()

  return <CollectionDetailClient slug={params.slug} />
}
