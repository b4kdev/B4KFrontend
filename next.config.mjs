import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// API routes whose answer is the same for every visitor (no session, no cookie); later entries win.
const PUBLIC_API = [
  '/api/home/:path+',
  '/api/explore/collections/:slug',
  '/api/explore/k-beauty/perfume-flagships',
  '/api/explore/k-culture/heritage/:region',
  '/api/explore/k-drama/filming-spots/:workId',
  '/api/explore/k-food/michelin-noodles',
  '/api/explore/k-pop/footsteps/:teamId',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Files the middleware does not see (_next, public files) get the same baseline headers; pages and
  // API routes also get the CSP from middleware.ts.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      // Static files in public/ have no hash in their name: a day in caches, refreshed in the background.
      ...['/images/:path*', '/mock-images/:path*', '/brand/:path*'].map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      })),
      // API: never cached by default (account, saved, plans, notifications, anything with a session).
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
      // Public data that reads no session or cookie: 5 minutes at the CDN, then refreshed in the background.
      ...PUBLIC_API.map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
      })),
    ];
  },
  images: {
    // AVIF first, WebP as the fallback; next/image keeps its default quality of 75. Widths are the
    // file sizes per part (2x): thumbnail 160, map photo pin 112, card 560, place detail 840, heroes
    // up to 2400. Fewer widths = fewer stored variants and image transformations.
    formats: ['image/avif', 'image/webp'],
    imageSizes: [16, 32, 48, 64, 96, 112, 160, 256, 384, 560],
    deviceSizes: [640, 750, 828, 840, 1080, 1200, 1920, 2400],
    remotePatterns: [
      // Google OAuth avatar (accounts.google.com / *.googleusercontent.com)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Supabase Storage — wildcard covers both Production and Staging projects.
      // Path covers plain object URLs (/object/public/**) and on-the-fly transform URLs (/render/image/public/**).
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/**' },
    ],
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: 'b4k-zx',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: false,
  webpack: {
    automaticVercelMonitors: false,
    treeshake: { removeDebugLogging: true },
  },
});
