import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Google OAuth avatar (accounts.google.com / *.googleusercontent.com)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
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
