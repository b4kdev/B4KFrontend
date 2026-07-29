import type { Metadata } from 'next'
import { buildPerfumeFlagshipsMetadata, buildPerfumeFlagshipsJsonLd } from './perfume-flagships-seo'
import PerfumeFlagshipsDetailClient from './PerfumeFlagshipsDetailClient'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return buildPerfumeFlagshipsMetadata(params.locale)
}

// DEC-61 — 향수 플래그십 10곳, the one K-Beauty collection the content plan flags
// as fully complete. Fixed slug (no dynamic segment) — this section's axis is
// "목적" (purpose), not a per-entity id.
export default async function PerfumeFlagshipsPage({ params }: { params: { locale: string } }) {
  const jsonLd = buildPerfumeFlagshipsJsonLd(params.locale)
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PerfumeFlagshipsDetailClient />
    </>
  )
}
