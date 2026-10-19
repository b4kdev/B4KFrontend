import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/cn'

// Table row (part of CMP-054, T-15; UI-14) and the Table organism (UI-72): rows separated by 1px
// lines, no stripes. Header: bg-raised, body/label fg-muted, sort icon; the sorted column is fg
// with an arrow. Body rows table/row-height 48, border-subtle; hover state-hover, selected
// state-selected. Numbers right-aligned with tabular figures.

export type Column<T> = {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  numeric?: boolean
  sortable?: boolean
}

export type TableProps<T> = {
  /** Caption (can be sr-only via captionHidden). */
  caption: string
  captionHidden?: boolean
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  sort?: { id: string; direction: 'ascending' | 'descending' }
  onSort?: (id: string) => void
  /** Figma Show select: a Checkbox element per row and one for the header. */
  select?: { header: ReactNode; cell: (row: T) => ReactNode; isSelected: (row: T) => boolean }
  className?: string
}

export function Table<T>({ caption, captionHidden, columns, rows, rowKey, sort, onSort, select, className }: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left">
        <caption className={cn('pb-[var(--space-2)] text-left type-title-card text-ui-fg', captionHidden && 'sr-only')}>{caption}</caption>
        <thead>
          <tr className="h-[var(--table-header-height)] border-b border-ui-border bg-ui-bg-raised">
            {/* Select column hugs the checkbox: padding + 20 + padding. */}
            {select ? <th scope="col" className="w-0 px-[var(--table-cell-padding-x)]">{select.header}</th> : null}
            {columns.map((c) => {
              const sorted = sort?.id === c.id
              const Icon = !sorted ? ChevronsUpDown : sort?.direction === 'ascending' ? ArrowUp : ArrowDown
              return (
                <th
                  key={c.id}
                  scope="col"
                  aria-sort={sorted ? sort?.direction : c.sortable ? 'none' : undefined}
                  className={cn('px-[var(--table-cell-padding-x)] type-body-label', sorted ? 'text-ui-fg' : 'text-ui-fg-muted', c.numeric && 'text-right')}
                >
                  {c.sortable && onSort ? (
                    <button type="button" onClick={() => onSort(c.id)} className={cn('inline-flex items-center gap-[var(--space-1)] focus-visible:shadow-focus-ring focus-visible:outline-none', c.numeric && 'flex-row-reverse')}>
                      {c.header}
                      <Icon aria-hidden className="size-[var(--icon-size-xs)]" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const selected = select?.isSelected(r)
            return (
              <tr key={rowKey(r)} aria-selected={select ? selected : undefined} className={cn('h-[var(--table-row-height)] border-b border-ui-border-subtle', selected ? 'bg-ui-state-selected' : 'hover:bg-ui-state-hover')}>
                {select ? <td className="px-[var(--table-cell-padding-x)]">{select.cell(r)}</td> : null}
                {columns.map((c, i) => (
                  <td
                    key={c.id}
                    className={cn(
                      'px-[var(--table-cell-padding-x)] type-body-base',
                      // First column: fg, one line with an ellipsis (max-w-0 lets the cell shrink); the rest fg-muted.
                      i === 0 ? 'max-w-0 truncate text-ui-fg' : 'text-ui-fg-muted',
                      c.numeric && 'text-right tabular-nums',
                    )}
                  >
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
