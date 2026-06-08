import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'th', 'pt-BR'],
  defaultLocale: 'en',
});
