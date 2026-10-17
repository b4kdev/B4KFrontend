// Every font the app loads through next/font. Shared by app/layout.tsx and Storybook.
import {
  Open_Sans,
  IBM_Plex_Mono,
  M_PLUS_1,
  Noto_Sans_TC,
  Inter,
  Archivo_Black,
  Noto_Sans_KR,
  Noto_Sans_JP,
  Dela_Gothic_One,
} from 'next/font/google';
import localFont from 'next/font/local';


const openSans = Open_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-open-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

const mPlus1 = M_PLUS_1({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-m-plus-1',
  display: 'swap',
});

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-noto-sans-tc',
  display: 'swap',
});

// BLK-30: was a raw @font-face in globals.css with no fallback-metrics override,
// unlike every font above — a real (if secondary) CLS contributor on the hero
// heading. next/font/local generates the ascent/descent/size-adjust override
// automatically, same as the next/font/google fonts above.
const moderniz = localFont({
  src: '../public/fonts/moderniz.woff2',
  weight: '900',
  style: 'normal',
  variable: '--font-moderniz',
  display: 'swap',
});

// New design fonts (UI-36), read by --font-family-display / --font-family-body in
// app/tokens.css. preload: false — a browser fetches a face only when text uses it, so
// these cost nothing on pages still on the old design. CJK faces load per unicode-range.
const uiInter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-ui-inter',
  display: 'swap',
  preload: false,
});

const uiArchivoBlack = Archivo_Black({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  variable: '--font-ui-archivo-black',
  display: 'swap',
  preload: false,
});

const uiNotoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-ui-noto-sans-kr',
  display: 'swap',
  preload: false,
});

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

const uiDelaGothicOne = Dela_Gothic_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-ui-dela-gothic-one',
  display: 'swap',
  preload: false,
});

export const uiFontVariables = [uiInter, uiArchivoBlack, uiNotoSansKR, uiNotoSansJP, uiNotoSansTC, uiDelaGothicOne]
  .map((f) => f.variable)
  .join(' ');

// All font CSS variables, set on <html>.
export const fontVariables = [openSans, ibmPlexMono, mPlus1, notoSansTC, moderniz]
  .map((f) => f.variable)
  .concat(uiFontVariables)
  .join(' ');
