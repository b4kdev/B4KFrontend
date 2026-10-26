'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getConsent } from '@/lib/consent'
import { withoutQuery } from '@/lib/analytics'

const GA_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

// GA4 and Clarity both stay off until the visitor accepts in the cookie banner: no script
// tag, no request, not even a cookieless ping. A later Decline sends a consent update to GA4.
export default function Analytics() {
  const [granted, setGranted] = useState(false)

  useEffect(() => {
    setGranted(getConsent() === 'accepted')
    const onChange = (e: Event) => {
      setGranted((e as CustomEvent<'accepted' | 'declined'>).detail === 'accepted')
    }
    window.addEventListener('b4k-consent-change', onChange)
    return () => window.removeEventListener('b4k-consent-change', onChange)
  }, [])

  // Page views are sent here, not by gtag itself, so the address leaves without its query
  // (the search text on /search, ids, tokens); campaign tags stay.
  // The first one goes out from the init script below; data-pv holds the last path sent.
  const pathname = usePathname()
  useEffect(() => {
    const root = document.documentElement
    if (!granted || !GA_ID || typeof window.gtag !== 'function' || root.dataset.pv === pathname) return
    root.dataset.pv = pathname ?? ''
    window.gtag('event', 'page_view', { page_location: withoutQuery(window.location.href), page_title: document.title })
  }, [granted, pathname])

  return (
    <>
      {granted && GA_ID && (
        <>
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('consent', 'default', {
                analytics_storage: 'granted',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: false });
              // First page view, address without its query as withoutQuery() in lib/analytics.ts.
              var u = new URL(location.href), keep = [];
              u.searchParams.forEach(function (v, k) { if (k.indexOf('utm_') === 0) keep.push([k, v]); });
              u.search = new URLSearchParams(keep).toString();
              u.hash = '';
              document.documentElement.dataset.pv = location.pathname;
              gtag('event', 'page_view', { page_location: u.toString(), page_title: document.title });
            `}
          </Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        </>
      )}

      {granted && CLARITY_ID && (
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
