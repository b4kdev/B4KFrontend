import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFilmingSpotsDetail } from '@/lib/kdrama-filming-spots'
import { buildFilmingSpotsMetadata, buildFilmingSpotsJsonLd } from './filming-spots-seo'
import FilmingSpotsDetailClient from './FilmingSpotsDetailClient'

interface Props {
  params: { locale: string; workId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = getFilmingSpotsDetail(params.workId, false)
  if (!detail) return {}
  return buildFilmingSpotsMetadata(detail, params.locale)
}

// DEC-61 — 촬영지 (filming spots) detail page, deep-linked from the K-Drama hub's
// hero CTA + filming row. Same SSR-shell/client-fetch split as the K-Pop footsteps page.
export default async function FilmingSpotsPage({ params }: Props) {
  const detail = getFilmingSpotsDetail(params.workId, false)
  if (!detail) notFound()

  const jsonLd = buildFilmingSpotsJsonLd(detail, params.locale)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FilmingSpotsDetailClient workId={params.workId} />
    </>
  )
}
