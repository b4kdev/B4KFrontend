'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { getConsent } from '@/lib/consent'

const GA_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

// DEC-16 — GA4 (Consent Mode v2, cookieless-until-consent) + Clarity (hard block until
// accepted). GA4 mounts unconditionally; Clarity only mounts once consent is 'accepted'.
export default function Analytics() {
  const [clarityGranted, setClarityGranted] = useState(false)

  useEffect(() => {
    setClarityGranted(getConsent() === 'accepted')
    const onChange = (e: Event) => {
      setClarityGranted((e as CustomEvent<'accepted' | 'declined'>).detail === 'accepted')
    }
    window.addEventListener('b4k-consent-change', onChange)
    return () => window.removeEventListener('b4k-consent-change', onChange)
  }, [])

  return (
    <>
      {/* Reads consent directly from localStorage at execution time — avoids a React
          round-trip race between mount and the gtag() consent default call. */}
      {GA_ID && (
        <>
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              var consent = localStorage.getItem('b4k_analytics_consent');
              gtag('consent', 'default', {
                analytics_storage: consent === 'accepted' ? 'granted' : 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        </>
      )}

      {clarityGranted && CLARITY_ID && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      )}
    </>
  )
}
