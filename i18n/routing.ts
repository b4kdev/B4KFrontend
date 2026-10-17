import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ko', 'ja', 'zh-TW', 'pt-BR'],
  defaultLocale: 'en',
});

// PD-06: zh-CN and th were dropped. Old links/bookmarks under these prefixes
// are permanently redirected to en by middleware.ts.
export const RETIRED_LOCALES = ['zh-CN', 'th'] as const;
