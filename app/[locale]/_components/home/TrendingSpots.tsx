'use client'

import PoiCardRowSection from './PoiCardRowSection'

export default function TrendingSpots() {
  return <PoiCardRowSection namespace="home.trending" endpoint="/api/home/trending" />
}
