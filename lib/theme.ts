export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'b4k-theme'

// Inlined verbatim as a blocking <script> in app/layout.tsx so data-theme is
// set before first paint (no light-mode flash). Keep the two in sync.
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'){document.documentElement.setAttribute('data-theme','light');document.documentElement.style.colorScheme='light';}}catch(e){}})()`

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
}

export function setTheme(theme: Theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  applyTheme(theme)
}
