import type { Decorator, Preview } from '@storybook/react'
import { useEffect } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { fontVariables } from '../app/fonts'
import '../app/tokens.css'
import './preview.css'

// Sets what the app sets on <html>: data-theme (Light / Dark), lang (the five locales) and the
// font variables, so tokens resolve exactly as on the site.
const withAppShell: Decorator = (Story, ctx) => {
  const { theme, lang } = ctx.globals as { theme: 'light' | 'dark'; lang: string }
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
    html.style.colorScheme = theme
    html.lang = lang
    html.className = fontVariables
  }, [theme, lang])
  return (
    <NextIntlClientProvider locale={lang} messages={{}}>
      <div className="min-h-screen bg-ui-bg p-[var(--space-6)] type-body-base text-ui-fg">
        <Story />
      </div>
    </NextIntlClientProvider>
  )
}

const preview: Preview = {
  decorators: [withAppShell],
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
    lang: {
      description: 'Language',
      toolbar: { title: 'Language', icon: 'globe', items: ['en', 'pt-BR', 'ko', 'ja', 'zh-TW'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light', lang: 'en' },
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
    controls: { expanded: true },
  },
}

export default preview
