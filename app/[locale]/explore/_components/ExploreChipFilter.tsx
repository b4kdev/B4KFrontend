'use client'

import { useTranslations } from 'next-intl'

export interface ChipFilterConfig {
  /** Query param name: 'agency' | 'district' | 'region'. */
  param: string
  /** Chip values (also the query param values). */
  values: string[]
}

interface Props {
  config: ChipFilterConfig
  active: string | null
  onChange: (value: string | null) => void
}

export default function ExploreChipFilter({ config, active, onChange }: Props) {
  const t = useTranslations('explore')

  const chip = (label: string, selected: boolean, onClick: () => void, key: string) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="shrink-0 flex items-center min-h-touch px-sp-4 rounded-full text-f-sm font-semibold whitespace-nowrap transition-colors duration-[80ms]"
      style={
        selected
          ? { background: 'var(--fg)', color: 'var(--bg)' }
          : { background: 'var(--bg-3)', color: 'var(--muted)', border: '1px solid var(--bdr)' }
      }
    >
      {label}
    </button>
  )

  return (
    <div
      className="flex gap-sp-2 overflow-x-auto pb-sp-2 mb-sp-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label={t('filters.ariaLabel')}
    >
      {chip(t('filters.all'), active === null, () => onChange(null), '__all')}
      {config.values.map((v) =>
        chip(t(`filters.${config.param}.${v}`), active === v, () => onChange(v), v),
      )}
    </div>
  )
}
