import type { StorybookConfig } from '@storybook/nextjs'

// Developer catalog of the B4K component library: one story per component, every
// Figma variant and state, in both themes and all five languages (toolbar).
const config: StorybookConfig = {
  stories: ['../components/library/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: { name: '@storybook/nextjs', options: {} },
  // next/font/local resolves local fonts to /public/fonts/... inside Storybook.
  staticDirs: ['../public', { from: '../public/fonts', to: '/public/fonts' }],
  docs: { autodocs: 'tag' },
}

export default config
