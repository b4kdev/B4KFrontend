import type { LegalSection } from '@/components/legal/LegalDocument';

export const termsLastUpdated = 'July 24, 2026';
export const termsContactEmail = 'support@b4korea.com';

export const termsSections: LegalSection[] = [
  {
    id: 'agreement',
    heading: '1. Agreement to Terms',
    body: (
      <p>
        By accessing or using B4K (&ldquo;the Service&rdquo;), a website located at b4korea.com, you agree to be
        bound by these Terms and Conditions (&ldquo;Terms&rdquo;). If you do not agree, do not use the Service.
        These Terms apply to all users worldwide.
      </p>
    ),
  },
  {
    id: 'description',
    heading: '2. Description of Service',
    body: (
      <>
        <p>B4K is a travel discovery and trip-planning platform for K-culture content. The Service includes:</p>
        <ul>
          <li>Discovery of points of interest across K-Pop, K-Drama, K-Beauty, and K-Culture categories</li>
          <li>AI-assisted and manual travel plan creation</li>
          <li>Saving, organizing, and sharing travel plans and points of interest</li>
        </ul>
        <p>
          B4K does not currently offer in-app purchases, subscriptions, or e-commerce transactions.
          Partner-affiliated plans redirect to the partner&rsquo;s own website.
        </p>
      </>
    ),
  },
  {
    id: 'eligibility',
    heading: '3. Eligibility',
    body: (
      <p>
        You must be at least 14 years old to use the Service. By using it, you confirm you meet this requirement. If
        you are under 18, you confirm you have parental or guardian consent.
      </p>
    ),
  },
  {
    id: 'account-registration',
    heading: '4. Account Registration',
    body: (
      <ul>
        <li>You may register with email and password, or sign in via Google, Apple, or Microsoft.</li>
        <li>You are responsible for maintaining the security of your account credentials.</li>
        <li>You must not share your account or use another person&rsquo;s account.</li>
        <li>You must provide accurate information and keep it up to date.</li>
        <li>Notify us immediately at support@b4korea.com if you suspect unauthorized access to your account.</li>
      </ul>
    ),
  },
  {
    id: 'user-content',
    heading: '5. User-Generated Content',
    body: (
      <>
        <h3>5.1 Your Content</h3>
        <p>
          You may create travel plans, save points of interest, and set a profile (&ldquo;Your Content&rdquo;) on
          B4K. B4K does not have a reviews, ratings, or comments feature.
        </p>
        <h3>5.2 License You Grant Us</h3>
        <p>
          By publishing Your Content (e.g. a plan you mark as published, which becomes accessible via a share link
          and to other users), you grant B4K a non-exclusive, worldwide, royalty-free license to host, display, and
          distribute that Content as part of operating the Service. You retain ownership. Unpublished/draft content
          is not shared with other users.
        </p>
        <h3>5.3 Content Standards</h3>
        <p>Your Content must not:</p>
        <ul>
          <li>Be false, misleading, or defamatory</li>
          <li>Infringe any third party&rsquo;s intellectual property rights</li>
          <li>Contain another person&rsquo;s personal data without their consent</li>
          <li>Be abusive, harassing, threatening, or hateful</li>
          <li>Promote illegal activity</li>
          <li>Contain spam or unsolicited commercial solicitation</li>
          <li>Violate any applicable law</li>
        </ul>
        <h3>5.4 Removal</h3>
        <p>
          We may remove any Content that violates these standards without prior notice. Repeated violations may
          result in account suspension or termination.
        </p>
      </>
    ),
  },
  {
    id: 'ip-rights',
    heading: '6. Intellectual Property Rights',
    body: (
      <p>
        All content, design, code, and trademarks on B4K that are not User-Generated Content are owned by B4K or our
        licensors. You may not copy, reproduce, distribute, or create derivative works from our content without
        express written permission.
      </p>
    ),
  },
  {
    id: 'prohibited-activities',
    heading: '7. Prohibited Activities',
    body: (
      <>
        <p>You must not:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure</li>
          <li>Scrape, crawl, or systematically extract data from the Service</li>
          <li>Interfere with or disrupt the Service or its servers</li>
          <li>Use automated tools to interact with the Service without our permission</li>
          <li>Impersonate another person or entity</li>
          <li>Circumvent any technical measure we use to protect the Service</li>
          <li>Advertise or sell goods/services through the Service (including via profile bio or plan descriptions)</li>
          <li>Sell, trade, or transfer your account or profile to another person</li>
        </ul>
        <h3>7.1 B4K-Specific Prohibited Activities</h3>
        <ul>
          <li>Manipulate the leaderboard or badge system via fake accounts, bots, or coordinated inauthentic activity</li>
          <li>Use automated or bot methods to circumvent AI feature usage limits (e.g. the guest request cap)</li>
          <li>
            Scrape or harvest map data, points of interest, or geographic information from the Service for any
            purpose beyond personal, non-commercial use
          </li>
          <li>
            Publish a plan that infringes another user&rsquo;s intellectual property, or copy another user&rsquo;s
            published plan without attribution
          </li>
          <li>Upload illegal, obscene, or infringing content via the profile avatar-upload feature</li>
          <li>Post false or misleading plan content created solely to inflate save counts or leaderboard rank</li>
        </ul>
      </>
    ),
  },
  {
    id: 'third-party-content',
    heading: '8. Third-Party Content and Links',
    body: (
      <p>
        B4K may display information about third-party places (attractions, businesses) and may link to third-party
        websites. We do not endorse and are not responsible for third-party content, products, or services.
        Interactions with third parties are at your own risk.
      </p>
    ),
  },
  {
    id: 'ai-plans',
    heading: '9. AI-Generated Plans',
    body: (
      <p>
        B4K offers AI-assisted travel plan generation. AI-generated plans are suggestions only. We do not guarantee
        their accuracy, completeness, suitability, or up-to-date status (opening hours, prices, and availability
        change). Always verify information independently before traveling.
      </p>
    ),
  },
  {
    id: 'dmca',
    heading: '10. Copyright Infringement (DMCA)',
    body: (
      <>
        <p>
          If you believe Content on B4K infringes your copyright, notify us with: (1) your contact information, (2)
          identification of the copyrighted work, (3) identification of the allegedly infringing material and its
          location, (4) a statement of good-faith belief the use is unauthorized, and (5) a statement, under penalty
          of perjury, that the notice is accurate and you are authorized to act.
        </p>
        <p>Send notices to support@b4korea.com.</p>
      </>
    ),
  },
  {
    id: 'services-management',
    heading: '11. Services Management',
    body: (
      <p>
        We reserve the right, but not the obligation, to monitor the Service for violations of these Terms, take
        legal action against anyone who violates them, and remove or refuse Content, in our sole discretion, without
        notice.
      </p>
    ),
  },
  {
    id: 'term-termination',
    heading: '12. Term and Termination',
    body: (
      <>
        <h3>12.1 By You</h3>
        <p>
          You may delete your account at any time via Settings → Account → Delete Account. Deletion is a 30-day soft
          delete — your account is deactivated and hidden immediately, and can be restored within 30 days. After 30
          days, all personal data is permanently deleted.
        </p>
        <h3>12.2 By Us</h3>
        <p>
          We may suspend or terminate your account if you violate these Terms, engage in abusive behavior, or for
          any other reason at our sole discretion. We will attempt to notify you unless doing so would cause harm or
          is prohibited by law.
        </p>
      </>
    ),
  },
  {
    id: 'modifications',
    heading: '13. Modifications and Interruptions',
    body: (
      <p>
        We may change, suspend, or discontinue any part of the Service at any time without liability. We do not
        guarantee the Service will be available at all times; it may be unavailable during maintenance or due to
        factors outside our control.
      </p>
    ),
  },
  {
    id: 'disclaimer',
    heading: '14. Disclaimer',
    body: (
      <>
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITHOUT WARRANTY OF ANY KIND.
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, B4K DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED,
          INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>We do not warrant that:</p>
        <ul>
          <li>The Service will be uninterrupted, timely, secure, or error-free</li>
          <li>Information on the Service (including AI-generated content and third-party place data) is accurate, complete, or current</li>
          <li>The Service will meet your specific requirements</li>
        </ul>
      </>
    ),
  },
  {
    id: 'liability',
    heading: '15. Limitation of Liability',
    body: (
      <>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, B4K SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE
          POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          Our total liability to you for any claim arising from these Terms or the Service will not exceed the
          amount you paid us in the 12 months before the claim — which, for a free service, is zero.
        </p>
      </>
    ),
  },
  {
    id: 'indemnification',
    heading: '16. Indemnification',
    body: (
      <p>
        You agree to defend, indemnify, and hold B4K harmless from any claim or demand made by a third party due to
        or arising out of your breach of these Terms, your Content, or your violation of any law or a third
        party&rsquo;s rights.
      </p>
    ),
  },
  {
    id: 'user-data',
    heading: '17. User Data',
    body: (
      <>
        <p>
          We maintain certain data you transmit to the Service for the purpose of managing performance, plus data
          relating to your use of the Service. You are solely responsible for data you transmit or that relates to
          activity you undertake using the Service.
        </p>
        <p>
          If you use B4K&rsquo;s planning tools without an account, your draft plan is stored only in your
          browser&rsquo;s local storage and is never transmitted to our servers until you create an account and
          choose to save it.
        </p>
        <p>
          We are not liable to you for any loss or corruption of any such data, including guest drafts stored only
          in local browser storage.
        </p>
      </>
    ),
  },
  {
    id: 'governing-law',
    heading: '18. Governing Law and Dispute Resolution',
    body: (
      <>
        <p>These Terms are governed by the laws of the Republic of Korea, without regard to conflict-of-law principles.</p>
        <p>
          <strong>Informal resolution:</strong> before filing a claim, you agree to try to resolve the dispute
          informally by contacting support@b4korea.com. We will attempt to resolve the dispute through good-faith
          mediation for at least 30 days from the date of first contact.
        </p>
        <p>
          <strong>Arbitration:</strong> if a dispute is not resolved informally within that period, it will be
          submitted to binding arbitration seated in Seoul, Republic of Korea, before a single arbitrator, conducted
          in English.
        </p>
        <p>
          <strong>Note for users in jurisdictions with mandatory consumer-protection laws:</strong> nothing in this
          section limits any right you have under the mandatory consumer-protection laws of your country of
          residence, including any right such laws give you to bring a claim in your local courts regardless of this
          arbitration agreement.
        </p>
      </>
    ),
  },
  {
    id: 'corrections',
    heading: '19. Corrections',
    body: (
      <p>
        There may be information on the Service that contains typographical errors, inaccuracies, or omissions. We
        reserve the right to correct any errors and to update information at any time without prior notice.
      </p>
    ),
  },
  {
    id: 'electronic-communications',
    heading: '20. Electronic Communications',
    body: (
      <p>
        By using the Service, you consent to receive electronic communications from us. You agree that any notice,
        agreement, disclosure, or other communication we send electronically satisfies any legal requirement that
        such communication be in writing.
      </p>
    ),
  },
  {
    id: 'misc',
    heading: '21. Miscellaneous',
    body: (
      <p>
        These Terms and any policies posted by us constitute the entire agreement between you and B4K. Our failure
        to enforce any right or provision is not a waiver of it. If any provision is found unenforceable, the
        remaining provisions remain in full effect.
      </p>
    ),
  },
  {
    id: 'changes',
    heading: '22. Changes to These Terms',
    body: (
      <p>
        We may update these Terms. Material changes will be notified via an in-app notice at least 7 days before
        taking effect. Continued use after the effective date constitutes acceptance of the updated Terms.
      </p>
    ),
  },
  {
    id: 'contact',
    heading: '23. Contact Us',
    body: (
      <p>
        B4K — support@b4korea.com
        <br />
        For legal notices, include &ldquo;Legal Notice&rdquo; in the subject line.
      </p>
    ),
  },
];
