// Routes and server for the QA scripts (b4k-a11y-audit, b4k-i18n-overflow-audit, b4k-screenshot,
// b4k-a11y-interactive-audit). Paths are relative to the locale root: '' -> /en, '/map' -> /en/map.
// Signed-out pages only; Badges and Leaderboard answer 404 while gamification is off at launch.
export const BASE = process.env.QA_BASE_URL || process.env.A11Y_BASE_URL || 'http://localhost:3000';

// A published plan to open; set QA_PLAN_ID to one that exists on the server under test.
const PLAN_ID = process.env.QA_PLAN_ID || '14';

export const ROUTES = [
  { id: '01-home',             path: '',                     label: 'Home' },
  { id: '02-map',              path: '/map',                 label: 'Map' },
  { id: '03-plan',             path: `/plan/${PLAN_ID}`,     label: 'Published plan' },
  { id: '04-explore',          path: '/explore',             label: 'Explore' },
  { id: '05-explore-kpop',     path: '/explore/k-pop',       label: 'Explore K-Pop' },
  { id: '06-explore-kdrama',   path: '/explore/k-drama',     label: 'Explore K-Drama' },
  { id: '07-explore-kbeauty',  path: '/explore/k-beauty',    label: 'Explore K-Beauty' },
  { id: '08-explore-kfood',    path: '/explore/k-food',      label: 'Explore K-Food' },
  { id: '09-explore-kculture', path: '/explore/k-culture',   label: 'Explore K-Culture' },
  { id: '10-trending',         path: '/explore/trending',    label: 'Trending, see all' },
  { id: '11-saved',            path: '/saved',               label: 'Saved (signed out)' },
  { id: '12-search',           path: '/search',              label: 'Search' },
  { id: '13-sign-in',          path: '/login',               label: 'Sign in' },
  { id: '14-settings',         path: '/settings',            label: 'Settings (signed out)' },
  { id: '15-help',             path: '/help',                label: 'Help' },
  { id: '16-about',            path: '/about',               label: 'About B4K' },
  { id: '17-legal-terms',      path: '/legal/terms',         label: 'Terms' },
  { id: '18-legal-privacy',    path: '/legal/privacy',       label: 'Privacy policy' },
  { id: '19-legal-cookies',    path: '/legal/cookies',       label: 'Cookie policy' },
  { id: '20-not-found',        path: '/no-such-page',        label: 'Page not found' },
];
