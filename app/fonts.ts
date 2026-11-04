// Every font the app loads through next/font. Shared by app/layout.tsx and Storybook.
//
// One family for display and body: Onest (Latin, every locale). Hangul falls through to
// Pretendard Variable (self-hosted dynamic subset, imported in app/layout.tsx: the browser fetches
// only the unicode ranges a page uses); Japanese and Traditional Chinese to their Noto faces.
// The stacks live in app/tokens.css (--font-family-display / --font-family-body).
import { Onest, Noto_Sans_JP, Noto_Sans_TC } from 'next/font/google';

const onest = Onest({
  subsets: ['latin', 'latin-ext'],
  weight: 'variable',
  variable: '--font-onest',
  display: 'swap',
});

// preload: false: a browser fetches a CJK face only when text in that script is on the page.
const uiNotoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-ui-noto-sans-jp',
  display: 'swap',
  preload: false,
});

const uiNotoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  variable: '--font-ui-noto-sans-tc',
  display: 'swap',
  preload: false,
});

export const uiFontVariables = [onest, uiNotoSansJP, uiNotoSansTC].map((f) => f.variable).join(' ');

// All font CSS variables, set on <html>.
export const fontVariables = uiFontVariables;
