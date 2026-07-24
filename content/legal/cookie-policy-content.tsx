import type { LegalSection } from '@/components/legal/LegalDocument';

export const cookiePolicyLastUpdated = 'July 24, 2026';
export const cookiePolicyContactEmail = 'support@b4korea.com';

export const cookiePolicySections: LegalSection[] = [
  {
    id: 'what-are-cookies',
    heading: '1. What Are Cookies',
    body: (
      <p>
        Cookies are small text files stored on your device when you visit a website. They allow the site to remember
        information about your visit — such as your login session or preferences.
      </p>
    ),
  },
  {
    id: 'cookies-we-use',
    heading: '2. Cookies We Use',
    body: (
      <div className="overflow-x-auto">
        <h3>2.1 Strictly Necessary</h3>
        <p>These cookies are required for the platform to function. They cannot be disabled.</p>
        <table>
          <thead>
            <tr>
              <th>Cookie</th>
              <th>Set by</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>sb-&lt;project-ref&gt;-auth-token</code> (may split into <code>.0</code>/<code>.1</code> for
                large sessions)
              </td>
              <td>B4K (Supabase Auth)</td>
              <td>Keeps you signed in</td>
              <td>Session</td>
            </tr>
            <tr>
              <td>
                <code>NEXT_LOCALE</code>
              </td>
              <td>B4K</td>
              <td>Remembers your language preference</td>
              <td>1 year</td>
            </tr>
          </tbody>
        </table>

        <h3>2.2 Analytics</h3>
        <p>These cookies help us understand how the platform is used. They are loaded after you accept the cookie banner.</p>
        <table>
          <thead>
            <tr>
              <th>Cookie</th>
              <th>Set by</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>_ga</code>
              </td>
              <td>Google Analytics 4</td>
              <td>Distinguishes unique users</td>
              <td>14 months</td>
            </tr>
            <tr>
              <td>
                <code>_ga_*</code>
              </td>
              <td>Google Analytics 4</td>
              <td>Session state</td>
              <td>14 months</td>
            </tr>
            <tr>
              <td>
                <code>_clck</code>
              </td>
              <td>Microsoft Clarity</td>
              <td>Persists Clarity User ID</td>
              <td>1 year</td>
            </tr>
            <tr>
              <td>
                <code>_clsk</code>
              </td>
              <td>Microsoft Clarity</td>
              <td>Connects page views to a session</td>
              <td>1 day</td>
            </tr>
            <tr>
              <td>
                <code>MUID</code>
              </td>
              <td>Microsoft Clarity</td>
              <td>Identifies unique browsers across Microsoft domains</td>
              <td>1 year</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'not-used-for',
    heading: '3. What We Do NOT Use Cookies For',
    body: (
      <ul>
        <li>Advertising or ad targeting</li>
        <li>Selling data to third parties</li>
        <li>Tracking you across other websites (beyond what GA4 and Clarity do for analytics purposes)</li>
      </ul>
    ),
  },
  {
    id: 'managing-preferences',
    heading: '4. Managing Your Cookie Preferences',
    body: (
      <>
        <p>
          <strong>In B4K:</strong> use the preferences panel below to review and change your analytics consent at
          any time.
        </p>
        <p>
          <strong>In your browser:</strong> you can block or delete cookies via your browser settings. Note that
          disabling strictly necessary cookies will break sign-in functionality.
        </p>
        <p>
          <strong>Opt-out links:</strong>
        </p>
        <ul>
          <li>
            Google Analytics:{' '}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
              tools.google.com/dlpage/gaoptout
            </a>
          </li>
          <li>
            Microsoft Clarity:{' '}
            <a href="https://privacy.microsoft.com/en-us/privacystatement" target="_blank" rel="noopener noreferrer">
              privacy.microsoft.com
            </a>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'changes',
    heading: '5. Changes to This Policy',
    body: (
      <p>
        We may update this policy when we add new cookies or change vendors. The &ldquo;Last updated&rdquo; date at
        the top reflects the most recent revision.
      </p>
    ),
  },
  {
    id: 'contact',
    heading: '6. Contact',
    body: <p>B4K — support@b4korea.com</p>,
  },
];
