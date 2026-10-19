import type { Metadata } from 'next'
import LoginClient from './LoginClient'
import { loginMetadata } from '@/app/[locale]/_seo/page-metadata'

export const metadata: Metadata = loginMetadata

export default function LoginPage() {
  return <LoginClient />
}
