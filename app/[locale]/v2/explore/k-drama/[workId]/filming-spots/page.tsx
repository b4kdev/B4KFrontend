import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SpecialScreen } from '@/components/v2/screens/A2Explore'
import { JsonLd } from '@/components/v2/JsonLd'
import { getFilmingSpotsDetail } from '@/lib/kdrama-filming-spots'
import { buildFilmingSpotsJsonLd, buildFilmingSpotsMetadata } from '@/app/[locale]/explore/k-drama/[workId]/filming-spots/filming-spots-seo'

type Props = { params: { locale: string; workId: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = getFilmingSpotsDetail(params.workId, false)
  if (!detail) return {}
  return buildFilmingSpotsMetadata(detail, params.locale)
}

export default function Page({ params }: Props) {
  const detail = getFilmingSpotsDetail(params.workId, false)
  if (!detail) notFound()
  return (
    <>
      <JsonLd data={buildFilmingSpotsJsonLd(detail, params.locale)} />
      <SpecialScreen category="k-drama" api={`/api/explore/k-drama/filming-spots/${params.workId}`} />
    </>
  )
}
