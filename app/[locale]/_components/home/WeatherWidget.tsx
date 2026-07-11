'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import type { HomeWeather } from '@/app/api/home/weather/route'

// Silently hide if no data — OQ-HM-03 (provider not yet selected)
export default function WeatherWidget() {
  const { data } = useSWR<HomeWeather | null>('/api/home/weather', fetcher)
  if (!data) return null

  return (
    <div
      className="mx-sp-4 lg:mx-sp-8 mt-sp-4 px-sp-4 py-sp-3 flex items-center gap-sp-6"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--bdr)' }}
      aria-label={`Seoul ${data.temp_c}°C, ${data.condition}`}
    >
      <div>
        <p className="text-f-2xl font-bold text-fg tabular-nums">{data.temp_c}°C</p>
        <p className="text-f-xs text-muted">{data.condition}</p>
      </div>
      <div className="flex gap-sp-4">
        {data.forecast.map(f => (
          <div key={f.day} className="text-center">
            <p className="text-f-xxs text-muted uppercase tracking-[0.06em]">{f.day}</p>
            <p className="text-f-xs text-fg tabular-nums">{f.high}° / {f.low}°</p>
          </div>
        ))}
      </div>
    </div>
  )
}
