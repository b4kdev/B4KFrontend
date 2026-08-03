import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getHeritageDetail } from '@/lib/kculture-heritage'
import { buildHeritageMetadata, buildHeritageJsonLd } from './heritage-seo'
import HeritageDetailClient from './HeritageDetailClient'

interface Props {
  params: { locale: string; region: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = getHeritageDetail(params.region, false)
  if (!detail) return {}
  return buildHeritageMetadata(detail, params.locale)
}

// DEC-61 — UNESCO heritage detail page, deep-linked from the K-Culture hub's
// hero CTA + heritage row. Same SSR-shell/client-fetch split as the other
// detail pages this pass.
export default async function HeritagePage({ params }: Props) {
  const detail = getHeritageDetail(params.region, false)
  if (!detail) notFound()

  const jsonLd = buildHeritageJsonLd(detail, params.locale)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HeritageDetailClient region={params.region} />
    </>
  )
}
