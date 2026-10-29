'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getConsent } from '@/lib/consent'
import { notePath, withoutQuery } from '@/lib/analytics'

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
  // (the search text on /search, ids, tokens); campaign tags stay. Every other hit takes the same
  // cleaned address and referrer from gtag('set'), not gtag's own read of document.location.
  // The first one goes out from the init script below; data-pv holds the last path sent.
  const pathname = usePathname()
  // Kept with or without consent: only the last two paths, in memory, for the place source.
  useEffect(() => notePath(pathname), [pathname])
  useEffect(() => {
    const root = document.documentElement
    if (!granted || !GA_ID || typeof window.gtag !== 'function' || root.dataset.pv === pathname) return
    root.dataset.pv = pathname ?? ''
    const page_location = withoutQuery(window.location.href)
    window.gtag('set', { page_location })
    window.gtag('event', 'page_view', { page_location, page_title: document.title })
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
              // Addresses without their query, as withoutQuery() in lib/analytics.ts: set for every
              // hit (page views, search, engagement, custom events), the referrer too.
              function clean(href) {
                try {
                  var u = new URL(href), keep = [];
                  u.searchParams.forEach(function (v, k) { if (k.indexOf('utm_') === 0) keep.push([k, v]); });
                  u.search = new URLSearchParams(keep).toString();
                  u.hash = '';
                  return u.toString();
                } catch (e) { return ''; }
              }
              var loc = clean(location.href), ref = document.referrer ? clean(document.referrer) : '';
              gtag('set', { page_location: loc, page_referrer: ref });
              gtag('config', '${GA_ID}', { send_page_view: false, page_location: loc, page_referrer: ref });
              document.documentElement.dataset.pv = location.pathname;
              gtag('event', 'page_view', { page_location: loc, page_title: document.title });
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
