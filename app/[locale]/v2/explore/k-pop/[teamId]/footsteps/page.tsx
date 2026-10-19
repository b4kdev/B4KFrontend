import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SpecialScreen } from '@/components/v2/screens/A2Explore'
import { JsonLd } from '@/components/v2/JsonLd'
import { getFootstepsDetail } from '@/lib/kpop-footsteps'
import { buildFootstepsJsonLd, buildFootstepsMetadata } from '@/app/[locale]/explore/k-pop/[teamId]/footsteps/footsteps-seo'

type Props = { params: { locale: string; teamId: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = getFootstepsDetail(params.teamId, false)
  if (!detail) return {}
  return buildFootstepsMetadata(detail, params.locale)
}

export default function Page({ params }: Props) {
  const detail = getFootstepsDetail(params.teamId, false)
  if (!detail) notFound()
  return (
    <>
      <JsonLd data={buildFootstepsJsonLd(detail, params.locale)} />
      <SpecialScreen category="k-pop" api={`/api/explore/k-pop/footsteps/${params.teamId}`} />
    </>
  )
}
