import ItineraryDetailView from './_components/ItineraryDetailView'

export default function Page({ params }: { params: { id: string } }) {
  return <ItineraryDetailView id={params.id} />
}
