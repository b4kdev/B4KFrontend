import { notFound } from 'next/navigation'
import { CategoryScreen } from '@/components/v2/screens/A2Explore'

const CATS = ['k-pop', 'k-drama', 'k-beauty', 'k-culture', 'k-food']

export default async function Page(props: { params: Promise<{ category: string }> }) {
  const params = await props.params;
  if (!CATS.includes(params.category)) notFound()
  return <CategoryScreen category={params.category} />
}
