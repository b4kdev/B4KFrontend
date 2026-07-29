import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFootstepsDetail } from '@/lib/kpop-footsteps'
import { buildFootstepsMetadata, buildFootstepsJsonLd } from './footsteps-seo'
import FootstepsDetailClient from './FootstepsDetailClient'

interface Props {
  params: { locale: string; teamId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = getFootstepsDetail(params.teamId, false)
  if (!detail) return {}
  return buildFootstepsMetadata(detail, params.locale)
}

// CT_KP_EXT (DEC-60) — 멤버 발자취 detail page, deep-linked from the K-Pop hub's
// memberFootsteps row + hero CTA. SSR shell + client-fetched interactive type
// filter, same split as ExplorePage.tsx/KpopArtistNav.tsx.
export default async function FootstepsPage({ params }: Props) {
  const detail = getFootstepsDetail(params.teamId, false)
  if (!detail) notFound()

  const jsonLd = buildFootstepsJsonLd(detail, params.locale)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FootstepsDetailClient teamId={params.teamId} />
    </>
  )
}
