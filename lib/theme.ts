export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'b4k-theme'

// Default theme is light; dark is opt-in via Settings. Inlined verbatim as a
// blocking <script> in app/layout.tsx so data-theme is set before first paint
// (no flash of the wrong theme). Keep the two in sync.
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var theme=t==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',theme);document.documentElement.style.colorScheme=theme;}catch(e){}})()`

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
}

export function setTheme(theme: Theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  applyTheme(theme)
}
