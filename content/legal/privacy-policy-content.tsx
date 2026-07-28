import type { LegalSection } from '@/components/legal/LegalDocument';

export const privacyPolicyLastUpdated = 'July 24, 2026';
export const privacyPolicyContactEmail = 'support@b4korea.com';

export const privacyPolicySections: LegalSection[] = [
  {
    id: 'introduction',
    heading: '1. Introduction',
    body: (
      <>
        <p>
          B4K (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates the B4K web application (the
          &ldquo;Service&rdquo;) — a multilingual K-culture travel discovery platform for tourists visiting South
          Korea. This policy explains what personal information we collect, why, and what rights you have over it.
        </p>
        <p>B4K is operated from the Republic of Korea. For privacy enquiries: support@b4korea.com.</p>
      </>
    ),
  },
  {
    id: 'information-we-collect',
    heading: '2. Information We Collect',
    body: (
      <>
        <h3>2.1 Information You Provide</h3>
        <p>When you create an account, we collect:</p>
        <ul>
          <li>Email address (email+password sign-up)</li>
          <li>Password (stored hashed via Supabase Auth — we never see or store it in plain text)</li>
          <li>
            If you sign in via Google, Apple, or Microsoft: your name, email, and profile picture as shared by that
            provider
          </li>
          <li>Preferred language</li>
        </ul>
        <p>We do not receive or store your Google/Apple/Microsoft password.</p>

        <h3>2.2 Content You Create</h3>
        <ul>
          <li>Travel plan itineraries (destinations, stops, notes, transport preferences)</li>
          <li>Saved places and saved plans, organized into folders</li>
          <li>Profile preferences and visibility settings</li>
        </ul>
        <p>B4K does not have a reviews or ratings feature. We do not collect star ratings or written reviews of places.</p>

        <h3>2.3 Information Collected Automatically</h3>
        <ul>
          <li>Pages visited, features used, buttons clicked</li>
          <li>Session duration and frequency</li>
          <li>Device type, browser, operating system</li>
          <li>
            Coarse, IP-derived location (country/region level only — B4K does not use device GPS or the browser
            Geolocation API anywhere in the app)
          </li>
          <li>IP address and standard server/API request logs</li>
        </ul>

        <h3>2.4 Personalization Activity</h3>
        <p>To rank and surface content relevant to you, we process:</p>
        <ul>
          <li>In-platform search queries</li>
          <li>Places and plans you save or like</li>
          <li>Places and categories you view</li>
          <li>Plans you create and their destinations</li>
        </ul>
        <p>
          This runs on our own infrastructure (Supabase) — it is not shared with third-party advertising platforms
          and does not involve profiling that produces legal or similarly significant effects on you. You may object
          at any time (see Section 12).
        </p>

        <h3>2.5 Analytics &amp; Behavior Data</h3>
        <ul>
          <li>
            <strong>Google Analytics 4</strong> — page views, events, traffic sources
          </li>
          <li>
            <strong>Microsoft Clarity</strong> — heatmaps, session recordings, click patterns, scroll depth
          </li>
          <li>
            <strong>Sentry</strong> — error and crash reports, with IP address, email, and cookies stripped before
            storage (see Section 9)
          </li>
        </ul>
        <p>
          Analytics and Clarity data collection only begins after you accept the cookie/analytics consent banner. See
          our <a href="/legal/cookies">Cookie Policy</a>.
        </p>
      </>
    ),
  },
  {
    id: 'how-and-why',
    heading: '3. How and Why We Use Your Information',
    body: (
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Purpose</th>
              <th>Legal basis (GDPR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Provide and operate the Service</td>
              <td>Contract</td>
            </tr>
            <tr>
              <td>Save your plans, folders, and preferences</td>
              <td>Contract</td>
            </tr>
            <tr>
              <td>Sign you in and keep your account secure</td>
              <td>Contract / Legitimate interest</td>
            </tr>
            <tr>
              <td>Personalize content recommendations</td>
              <td>Legitimate interest</td>
            </tr>
            <tr>
              <td>Product analytics — understand usage</td>
              <td>Legitimate interest (post-consent)</td>
            </tr>
            <tr>
              <td>Behavior analysis — improve UX</td>
              <td>Legitimate interest (post-consent)</td>
            </tr>
            <tr>
              <td>Error monitoring and debugging</td>
              <td>Legitimate interest</td>
            </tr>
            <tr>
              <td>Detect abuse, fraud, and security threats</td>
              <td>Legitimate interest</td>
            </tr>
            <tr>
              <td>Communicate service updates</td>
              <td>Legitimate interest</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-sp-4">
          We do not sell your personal information. We do not use it for third-party advertising targeting.
        </p>
      </div>
    ),
  },
  {
    id: 'ai-generated-content',
    heading: '4. AI-Generated Content',
    body: (
      <>
        <p>
          B4K offers AI-assisted travel plan generation. Generating a plan may send your query and relevant context
          (e.g. destinations, preferences, saved places) to a third-party AI model provider for processing.
        </p>
        <p>
          AI-generated plans are suggestions only — see the Terms and Conditions for the accuracy disclaimer. We do
          not use your data to train third-party foundation models beyond what is necessary to generate your
          response, and we do not knowingly send special-category data (health, financial, etc.) to any AI provider.
        </p>
      </>
    ),
  },
  {
    id: 'guest-use',
    heading: '5. Guest Use and Local Storage',
    body: (
      <p>
        If you use B4K&rsquo;s planning tools without an account, your in-progress plan (&ldquo;draft&rdquo;) is
        stored only in your browser&rsquo;s local storage — it is not transmitted to or stored on our servers until
        you create an account and choose to save it. Clearing your browser storage will delete an unsaved guest
        draft permanently; we cannot recover it.
      </p>
    ),
  },
  {
    id: 'cookies',
    heading: '6. Cookies',
    body: (
      <p>
        We use cookies to keep you signed in, remember your language preference, and power analytics. Analytics
        cookies load only after consent. Full list and preference management:{' '}
        <a href="/legal/cookies">Cookie Policy</a> or <strong>Settings → Data &amp; Privacy Consent</strong> while
        signed in.
      </p>
    ),
  },
  {
    id: 'third-parties',
    heading: '7. Third Parties We Share Data With',
    body: (
      <div className="overflow-x-auto">
        <p className="mb-sp-4">
          We disclose information to the following service providers so they can perform services on our behalf.
          None of them are permitted to sell or independently reuse your data.
        </p>
        <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Google</td>
              <td>Analytics (GA4), OAuth sign-in, web fonts</td>
            </tr>
            <tr>
              <td>Microsoft</td>
              <td>Behavior analytics (Clarity), OAuth sign-in</td>
            </tr>
            <tr>
              <td>Sentry</td>
              <td>Error and crash monitoring</td>
            </tr>
            <tr>
              <td>Supabase</td>
              <td>Database and authentication hosting</td>
            </tr>
            <tr>
              <td>Naver</td>
              <td>Map rendering</td>
            </tr>
            <tr>
              <td>TMAP</td>
              <td>Route/travel-time calculation for saved plans</td>
            </tr>
            <tr>
              <td>Vercel</td>
              <td>Web hosting</td>
            </tr>
            <tr>
              <td>Upstash</td>
              <td>API rate-limiting</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-sp-4">
          Vendor privacy policies:{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Google
          </a>{' '}
          ·{' '}
          <a href="https://privacy.microsoft.com" target="_blank" rel="noopener noreferrer">
            Microsoft
          </a>{' '}
          ·{' '}
          <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer">
            Sentry
          </a>{' '}
          ·{' '}
          <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
            Supabase
          </a>{' '}
          ·{' '}
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
            Vercel
          </a>{' '}
          ·{' '}
          <a href="https://upstash.com/privacy" target="_blank" rel="noopener noreferrer">
            Upstash
          </a>
        </p>
        <p className="mt-sp-4">
          We do not share your information with any other third party unless required by law, or to protect the
          rights, property, or safety of B4K, our users, or the public.
        </p>
      </div>
    ),
  },
  {
    id: 'international-transfers',
    heading: '8. International Data Transfers',
    body: (
      <p>
        B4K is operated from South Korea. Our service providers process data in the United States and the European
        Union. Where we transfer personal information out of the EEA/UK, we rely on Standard Contractual Clauses with
        the receiving vendor as the transfer safeguard.
      </p>
    ),
  },
  {
    id: 'data-security',
    heading: '9. Data Security',
    body: (
      <>
        <p>
          We use industry-standard measures including HTTPS/TLS encryption, hashed credential storage, token-based
          authentication, and access controls. Error monitoring (Sentry) is configured to strip IP address, email,
          and cookies from crash reports before storage — we don&rsquo;t need that data to debug, so we don&rsquo;t
          collect it there.
        </p>
        <p>
          No system is completely secure. If you believe your account has been compromised, contact
          support@b4korea.com immediately.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    heading: '10. How Long We Keep Your Information',
    body: (
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Data type</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Account and profile data</td>
              <td>Active account + 30 days after deletion request</td>
            </tr>
            <tr>
              <td>Plans, saves, folders</td>
              <td>Active account + 30 days after deletion request</td>
            </tr>
            <tr>
              <td>Personalization activity</td>
              <td>Active account + 30 days after deletion request</td>
            </tr>
            <tr>
              <td>GA4 analytics</td>
              <td>14 months</td>
            </tr>
            <tr>
              <td>Clarity session recordings</td>
              <td>90 days</td>
            </tr>
            <tr>
              <td>Sentry error reports</td>
              <td>Per Sentry&rsquo;s default retention (90 days)</td>
            </tr>
            <tr>
              <td>Server/API logs</td>
              <td>90 days</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-sp-4">
          Account deletion is a 30-day soft delete: your account is deactivated and hidden immediately, and can be
          restored within 30 days. After 30 days, all personal data is permanently deleted.
        </p>
      </div>
    ),
  },
  {
    id: 'childrens-privacy',
    heading: "11. Children's Privacy",
    body: (
      <p>
        B4K is not directed at children under 14 and we do not knowingly collect personal information from anyone
        under 14. If you believe a child has provided us with personal data, contact support@b4korea.com and we will
        delete it.
      </p>
    ),
  },
  {
    id: 'your-rights',
    heading: '12. Your Privacy Rights',
    body: (
      <>
        <p>You have the right to:</p>
        <ul>
          <li>
            <strong>Access</strong> — request a copy of your personal data
          </li>
          <li>
            <strong>Correction</strong> — correct inaccurate data
          </li>
          <li>
            <strong>Deletion</strong> — delete your account and data (Settings → Account → Delete Account)
          </li>
          <li>
            <strong>Portability</strong> — request your data in a portable format
          </li>
          <li>
            <strong>Objection / restriction</strong> — object to processing based on legitimate interest, including
            personalization
          </li>
        </ul>
        <p>
          To exercise any right, email support@b4korea.com. We will respond within 30 days (or a shorter period
          where required by applicable law).
        </p>

        <h3>Jurisdiction-Specific Rights</h3>
        <p>
          The rights above are the global baseline. If you are located in one of the markets below, applicable local
          law gives you these additional or more specific rights.
        </p>

        <p>
          <strong>Brazil (LGPD — Lei Geral de Proteção de Dados, Law No. 13,709/2018):</strong>
        </p>
        <ul>
          <li>Confirmation that we are processing your data</li>
          <li>Access to your data</li>
          <li>Correction of incomplete, inaccurate, or outdated data</li>
          <li>
            Anonymization, blocking, or deletion of unnecessary or excessive data, or data processed in violation of
            the law
          </li>
          <li>Portability of your data to another provider</li>
          <li>Deletion of personal data processed with your consent</li>
          <li>Information about which public and private entities we&rsquo;ve shared your data with</li>
          <li>Information about the possibility of not giving consent, and the consequences of refusing</li>
          <li>Revocation of consent at any time</li>
          <li>Review of decisions made solely through automated processing that affect your interests</li>
        </ul>
        <p>
          We aim to respond to LGPD requests within 15 days, per Brazilian law&rsquo;s shorter statutory window
          (rather than the 30-day window above).
        </p>

        <p>
          <strong>Japan (APPI — Act on the Protection of Personal Information):</strong>
        </p>
        <ul>
          <li>Request disclosure of retained personal data we hold about you</li>
          <li>Request correction, addition, or deletion of retained personal data that is inaccurate</li>
          <li>
            Request suspension of use, erasure, or cessation of provision to third parties, where your data was used
            beyond its stated purpose, was unlawfully acquired, is no longer needed, or was involved in a data breach
          </li>
        </ul>

        <p>
          <strong>Taiwan (Personal Data Protection Act):</strong>
        </p>
        <p>These rights may not be waived or limited in advance by any agreement:</p>
        <ul>
          <li>Inquire about and review your personal data</li>
          <li>Request a copy of your personal data</li>
          <li>Request supplementation or correction of your personal data</li>
          <li>Demand that we stop collecting, processing, or using your personal data</li>
          <li>Request deletion of your personal data</li>
        </ul>

        <p>
          <strong>Thailand (PDPA — Personal Data Protection Act B.E. 2562):</strong>
        </p>
        <ul>
          <li>Access your personal data</li>
          <li>Rectification of inaccurate or incomplete data</li>
          <li>
            Erasure or anonymization of your data — including where you withdraw consent and we have no other legal
            basis to continue processing
          </li>
          <li>Object to processing at any time</li>
          <li>Restrict processing</li>
          <li>Receive your data in a portable, structured format</li>
          <li>Withdraw consent at any time — we publish, and will notify you of, the method to do so</li>
        </ul>
        <p>We aim to respond to Thai PDPA requests within 30 days, as required by law.</p>

        <p>
          <strong>Korea (PIPA — Personal Information Protection Act):</strong> B4K is based and operated in the
          Republic of Korea, so PIPA applies to our processing regardless of your location.
        </p>
        <ul>
          <li>Be informed of, and access, how we collect, use, and share your personal information</li>
          <li>Request correction or deletion of your personal information</li>
          <li>Request suspension of processing of your personal information</li>
          <li>Request that your data be transferred directly to you or to another controller (data portability)</li>
          <li>Object to decisions made solely through fully automated processing that significantly affect you</li>
          <li>Withdraw consent at any time</li>
        </ul>

        <p>
          <strong>EU/UK users:</strong> you have the right to lodge a complaint with your local data protection
          authority.
        </p>

        <p>
          We have not appointed a Data Protection Officer — our scale and processing do not meet the GDPR thresholds
          that require one (no large-scale systematic monitoring, no large-scale special-category processing).
        </p>

        <h3>Global Privacy Control</h3>
        <p>
          B4K does not sell or share personal information in the sense defined by the CCPA/CPRA, so Global Privacy
          Control signals are not applicable — there is nothing to opt out of that we do in the first place.
        </p>
      </>
    ),
  },
  {
    id: 'us-state-rights',
    heading: '13. US State Privacy Rights',
    body: (
      <p>
        Depending on your state of residence, you may have rights to know, delete, correct, and opt out of the
        sale/sharing of personal information, and to non-discrimination for exercising these rights. We do not sell
        or share personal information as defined under these laws.
      </p>
    ),
  },
  {
    id: 'changes',
    heading: '14. Changes to This Policy',
    body: (
      <p>
        We may update this policy. Material changes will be notified via an in-app notice at least 7 days before
        taking effect. Continued use after the effective date constitutes acceptance.
      </p>
    ),
  },
  {
    id: 'contact',
    heading: '15. Contact Us',
    body: (
      <p>
        B4K — support@b4korea.com
        <br />
        For data-rights requests, include &ldquo;Privacy Request&rdquo; in the subject line.
      </p>
    ),
  },
];
