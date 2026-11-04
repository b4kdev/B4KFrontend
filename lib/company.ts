// The company details Korean law asks a service to show (footer company line, About B4K). Public
// facts as registered. The company has no registered English name, so every language shows the
// Korean legal name; the address follows the page language (Korean on Korean pages).

export const COMPANY = {
  name: '주식회사 비포케이코퍼레이션',
  ceo: 'MEDEIROS MARIANA',
  registration: '317-81-50692',
  address: {
    ko: '서울특별시 서초구 강남대로 53길 8 7-162호',
    en: '7-162, 8, Gangnam-daero 53-gil, Seocho-gu, Seoul, 06621, Republic of Korea',
  },
  email: 'support@b4korea.com',
  host: 'Vercel Inc.',
  /** The Fair Trade Commission's public business information page for the registration number. */
  checkUrl: 'https://www.ftc.go.kr/bizCommPop.do?wrkr_no=3178150692',
} as const

/** The values for the company line and the About company details in one language. */
export function companyValues(locale: string) {
  return {
    company: COMPANY.name,
    ceo: COMPANY.ceo,
    registration: COMPANY.registration,
    address: locale === 'ko' ? COMPANY.address.ko : COMPANY.address.en,
    email: COMPANY.email,
    host: COMPANY.host,
  }
}

/**
 * Fills a company text with the values, leaving out each part (a ' · ' part or a line) whose value
 * is not there yet, such as the phone number: the text never shows an empty label.
 */
export function fillCompanyText(template: string, values: Record<string, string>) {
  const fill = (part: string) => {
    const names = [...part.matchAll(/\{(\w+)\}/g)].map((m) => m[1])
    if (names.some((n) => !values[n])) return null
    return part.replace(/\{(\w+)\}/g, (_, n: string) => values[n])
  }
  const join = (parts: string[], sep: string) => parts.map(fill).filter((p): p is string => p !== null).join(sep)
  return template.includes('\n') ? join(template.split('\n'), '\n') : join(template.split(' · '), ' · ')
}
