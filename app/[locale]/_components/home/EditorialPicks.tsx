'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import PoiCardRowSection from './PoiCardRowSection'

const CATEGORIES = [
  { key: '',          labelKey: 'catAll'     },
  { key: 'k-pop',    labelKey: 'catKPop'    },
  { key: 'k-drama',  labelKey: 'catKDrama'  },
  { key: 'k-beauty', labelKey: 'catKBeauty' },
  { key: 'k-culture',labelKey: 'catKCulture'},
]

export default function EditorialPicks() {
  const t = useTranslations('home.editorial')
  const [cat, setCat] = useState('')
  const url = cat ? `/api/home/editorial?category=${cat}` : '/api/home/editorial'

  return (
    <PoiCardRowSection
      namespace="home.editorial"
      endpoint={url}
      header={
        <div className="flex gap-sp-2 mb-sp-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className="shrink-0 px-sp-3 py-[5px] text-f-xs font-semibold rounded-full transition-colors duration-[80ms]"
              style={{
                background: cat === c.key ? 'var(--lav)' : 'var(--bg-3)',
                color: cat === c.key ? 'var(--bg)' : 'var(--muted)',
                border: cat === c.key ? '1px solid var(--lav)' : '1px solid var(--bdr)',
              }}
            >
              {t(c.labelKey)}
            </button>
          ))}
        </div>
      }
    />
  )
}
