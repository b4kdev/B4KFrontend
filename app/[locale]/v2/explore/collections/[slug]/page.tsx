import { CollectionScreen } from '@/components/v2/screens/A2Explore'

export default function Page({ params }: { params: { slug: string } }) {
  return <CollectionScreen slug={params.slug} />
}
