import type { Metadata } from 'next'
import { buildMichelinNoodlesMetadata, buildMichelinNoodlesJsonLd } from './michelin-noodles-seo'
import MichelinNoodlesDetailClient from './MichelinNoodlesDetailClient'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return buildMichelinNoodlesMetadata(params.locale)
}

// DEC-61 — 미슐랭이 뽑은 면 요리 20곳, fixed slug (badge-scoped, not a per-entity id).
export default async function MichelinNoodlesPage({ params }: { params: { locale: string } }) {
  const jsonLd = buildMichelinNoodlesJsonLd(params.locale)
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MichelinNoodlesDetailClient />
    </>
  )
}
