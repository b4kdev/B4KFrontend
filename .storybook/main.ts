import type { StorybookConfig } from '@storybook/nextjs'

// Developer catalog of the B4K component library (UI-79): one story per component, every
// Figma variant and state, in both themes and all five languages (toolbar).
const config: StorybookConfig = {
  stories: ['../components/library/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: { name: '@storybook/nextjs', options: {} },
  staticDirs: ['../public'],
  docs: { autodocs: 'tag' },
}

export default config
