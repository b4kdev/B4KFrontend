import MapView from '@/components/map/MapView'

export default function MapPage() {
  return (
    <>
      {/* Zero-height anchor — map lives in fixed overlay above PageLayout */}
      <div aria-hidden="true" className="h-0" />
      <MapView />
    </>
  )
}
