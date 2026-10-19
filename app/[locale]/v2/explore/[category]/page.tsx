import { notFound } from 'next/navigation'
import { CategoryScreen } from '@/components/v2/screens/A2Explore'

const CATS = ['k-pop', 'k-drama', 'k-beauty', 'k-culture', 'k-food']

export default function Page({ params }: { params: { category: string } }) {
  if (!CATS.includes(params.category)) notFound()
  return <CategoryScreen category={params.category} />
}
