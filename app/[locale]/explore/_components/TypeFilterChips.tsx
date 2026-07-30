'use client'

// DEC-61 — shared local chip row for the 4 new detail pages' type/sub-category
// filter. Deliberately NOT a reuse of ExploreChipFilter: that component has no
// count-in-label support ("전체 31"), which every detail-page mock in the content
// plan uses — retrofitting it there risked regressing the hub pages' simpler chips.

export interface TypeFilterOption {
  key: string
  label: string
  count?: number
}

export default function TypeFilterChips({
  options,
  active,
  onChange,
}: {
  options: TypeFilterOption[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div
      className="flex gap-sp-2 overflow-x-auto pb-sp-2 mb-sp-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
    >
      {options.map(opt => {
        const selected = active === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            aria-pressed={selected}
            className="shrink-0 flex items-center min-h-touch px-sp-4 rounded-full text-f-sm font-semibold whitespace-nowrap transition-colors duration-[80ms]"
            style={selected
              ? { background: 'var(--lav)', color: 'var(--bg)' }
              : { background: 'var(--bg-3)', color: 'var(--muted)', border: '1px solid var(--lav-border)' }}
          >
            {opt.label}{opt.count !== undefined ? ` ${opt.count}` : ''}
          </button>
        )
      })}
    </div>
  )
}
