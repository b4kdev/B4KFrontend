import dynamic from 'next/dynamic'

// Naver Map API is browser-only — ssr: false prevents window.naver errors
const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false })

export default function MapPage() {
  return (
    <>
      {/* Zero-height anchor — map lives in fixed overlay above PageLayout */}
      <div aria-hidden="true" className="h-0" />
      <MapView />
    </>
  )
}
