import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SpecialScreen } from '@/components/v2/screens/A2Explore'
import { JsonLd } from '@/components/v2/JsonLd'
import { getHeritageDetail } from '@/lib/kculture-heritage'
import { buildHeritageJsonLd, buildHeritageMetadata } from '@/app/[locale]/explore/k-culture/[region]/heritage/heritage-seo'

type Props = { params: Promise<{ locale: string; region: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const detail = getHeritageDetail(params.region, false)
  if (!detail) return {}
  return buildHeritageMetadata(detail, params.locale)
}

export default async function Page(props: Props) {
  const params = await props.params;
  const detail = getHeritageDetail(params.region, false)
  if (!detail) notFound()
  return (
    <>
      <JsonLd data={buildHeritageJsonLd(detail, params.locale)} />
      <SpecialScreen category="k-culture" api={`/api/explore/k-culture/heritage/${params.region}`} />
    </>
  )
}
