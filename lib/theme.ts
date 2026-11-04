// Theme = what is applied to <html data-theme>. ThemeChoice = what the user picked; 'system'
// (Match device) follows prefers-color-scheme and its changes.
export type Theme = 'dark' | 'light'
export type ThemeChoice = Theme | 'system'

export const THEME_STORAGE_KEY = 'b4k-theme'

// Used when nothing is stored (first visit). A first visit follows the device.
export const DEFAULT_THEME_CHOICE: ThemeChoice = 'system'

// Inlined verbatim as a blocking <script> in app/layout.tsx so data-theme is set before first
// paint (no flash of the wrong theme). While the choice is 'system' it also follows the device
// when the OS theme changes. Keep in sync with resolveTheme / applyTheme below.
export const THEME_BOOT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}',d='${DEFAULT_THEME_CHOICE}',m=window.matchMedia('(prefers-color-scheme: dark)');var choice=function(){var t=localStorage.getItem(k);return t==='dark'||t==='light'||t==='system'?t:d;};var apply=function(){var c=choice();var theme=c==='system'?(m.matches?'dark':'light'):c;document.documentElement.setAttribute('data-theme',theme);document.documentElement.style.colorScheme=theme;};apply();m.addEventListener('change',function(){if(choice()==='system')apply();});}catch(e){}})()`

const isChoice = (v: string | null): v is ThemeChoice => v === 'dark' || v === 'light' || v === 'system'

export function getThemeChoice(): ThemeChoice {
  if (typeof window === 'undefined') return DEFAULT_THEME_CHOICE
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isChoice(stored) ? stored : DEFAULT_THEME_CHOICE
}

export function resolveTheme(choice: ThemeChoice): Theme {
  if (choice !== 'system') return choice
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// The theme currently in effect (after resolving Match device).
export function getStoredTheme(): Theme {
  return resolveTheme(getThemeChoice())
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
}

export function setTheme(choice: ThemeChoice) {
  window.localStorage.setItem(THEME_STORAGE_KEY, choice)
  applyTheme(resolveTheme(choice))
}
