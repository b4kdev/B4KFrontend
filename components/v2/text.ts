import { cloneElement, isValidElement, type ReactElement } from 'react'

// Text fit rule: K-Pop, K-Drama, K-Beauty, K-Food, K-Culture (and their translations, e.g. K-팝) never
// split at the hyphen. Word joiners (U+2060) around the hyphen forbid a line break there without
// changing how the text looks or reads.
const K_NAME = /(^|[^A-Za-z0-9])K-(?=\S)/g

export const keepKNames = (s: string) => s.replace(K_NAME, '$1K⁠-⁠')

/** keepKNames on every string inside a value (messages, legal sections incl. their JSX). */
export function keepKNamesDeep<T>(v: T): T {
  if (typeof v === 'string') return keepKNames(v) as T
  if (isValidElement(v)) {
    const el = v as ReactElement<{ children?: unknown }>
    return (el.props.children === undefined ? el : cloneElement(el, { children: keepKNamesDeep(el.props.children) } as never)) as T
  }
  if (Array.isArray(v)) return v.map(keepKNamesDeep) as T
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, keepKNamesDeep(x)])) as T
  return v
}
