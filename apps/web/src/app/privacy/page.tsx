import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy - SutraID',
  description: 'SutraID Privacy Policy. Learn how we collect, use, and protect your personal data.',
};

export default function PrivacyPage() {
  const lastUpdated = 'February 11, 2026';

  return (
    <>
      <Navbar />
      <main style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingTop: '6rem',
      }}>
        <article style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '3rem 2rem 4rem',
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
            letterSpacing: '-0.5px',
          }}>
            Privacy Policy
          </h1>
          <p style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem',
            marginBottom: '3rem',
          }}>
            Last updated: {lastUpdated}
          </p>

          <div style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.8,
          }}>
            <Section title="1. Introduction">
              <p>
                SutraID (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the sutraid.com website and the SutraID
                identity and access management platform (collectively, the &quot;Service&quot;). This Privacy Policy explains
                how we collect, use, disclose, and safeguard your personal information when you use our Service.
              </p>
              <p>
                By accessing or using SutraID, you agree to this Privacy Policy. If you do not agree, please do not use
                the Service.
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <h4 style={h4Style}>2.1 Information You Provide</h4>
              <ul>
                <li><strong>Account Information:</strong> Email address, name (optional), and profile picture when you create an account.</li>
                <li><strong>Authentication Credentials:</strong> Password hashes (if using password-based auth). We never store plaintext passwords.</li>
                <li><strong>Organization Data:</strong> Organization name, domain, and member details for enterprise accounts.</li>
                <li><strong>Communications:</strong> Any information you provide when contacting support.</li>
              </ul>

              <h4 style={h4Style}>2.2 Information Collected Automatically</h4>
              <ul>
                <li><strong>Usage Data:</strong> IP address, browser type, device information, pages visited, and timestamps.</li>
                <li><strong>Authentication Logs:</strong> Login timestamps, authentication method used, IP address, and device fingerprint for security purposes.</li>
                <li><strong>Session Data:</strong> Session tokens and refresh tokens to maintain your authenticated state.</li>
              </ul>

              <h4 style={h4Style}>2.3 Information from Third Parties</h4>
              <ul>
                <li><strong>SSO Providers:</strong> When you authenticate via SAML or OIDC, we receive identity attributes (email, name, groups) from your identity provider as configured by your organization.</li>
              </ul>
            </Section>

            <Section title="3. How We Use Your Information">
              <p>We use collected information to:</p>
              <ul>
                <li>Provide, operate, and maintain the Service</li>
                <li>Authenticate your identity and manage sessions</li>
                <li>Process and deliver magic link and password reset emails</li>
                <li>Enforce security policies, detect fraud, and prevent unauthorized access</li>
                <li>Send service-related communications (security alerts, account notifications)</li>
                <li>Improve and optimize the Service</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p>
                We do <strong>not</strong> sell your personal data to third parties. We do <strong>not</strong> use your
                data for advertising or behavioral profiling.
              </p>
            </Section>

            <Section title="4. Data Storage and Security">
              <p>Your data is stored in secure, SOC 2 compliant cloud infrastructure. We implement the following security measures:</p>
              <ul>
                <li>All data in transit is encrypted via TLS 1.2+</li>
                <li>Passwords are hashed using bcrypt with appropriate cost factors</li>
                <li>Authentication tokens are hashed with SHA-256 before storage</li>
                <li>Database connections use encrypted channels</li>
                <li>Access to production systems is restricted and audited</li>
                <li>Magic links and password reset tokens expire after 15 minutes</li>
              </ul>
            </Section>

            <Section title="5. Data Sharing and Disclosure">
              <p>We may share your information only in the following circumstances:</p>
              <ul>
                <li><strong>Service Providers:</strong> We use third-party services to operate our platform, including Resend (email delivery), Neon (database hosting), Vercel (web hosting), and Railway (API hosting). These providers process data on our behalf under data processing agreements.</li>
                <li><strong>Your Organization:</strong> If you use SutraID through an enterprise organization, your organization administrator may access your activity and profile data.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law, regulation, or valid legal process.</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction.</li>
              </ul>
            </Section>

            <Section title="6. Your Rights">
              <p>Depending on your jurisdiction, you may have the following rights:</p>

              <h4 style={h4Style}>Under GDPR (EEA/UK residents)</h4>
              <ul>
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
                <li><strong>Portability:</strong> Request your data in a structured, machine-readable format</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              </ul>

              <h4 style={h4Style}>Under CCPA (California residents)</h4>
              <ul>
                <li>Right to know what personal information is collected and how it is used</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
                <li>Right to non-discrimination for exercising your rights</li>
              </ul>

              <p>
                To exercise any of these rights, contact us at{' '}
                <a href="mailto:privacy@sutraid.com" style={linkStyle}>privacy@sutraid.com</a>.
                We will respond within 30 days.
              </p>
            </Section>

            <Section title="7. Cookies and Tracking">
              <p>
                SutraID uses minimal cookies strictly necessary for the Service to function:
              </p>
              <ul>
                <li><strong>Authentication tokens:</strong> Stored in localStorage to maintain your session</li>
                <li><strong>Theme preference:</strong> Stored in localStorage to remember your light/dark mode choice</li>
              </ul>
              <p>
                We do not use third-party tracking cookies, advertising pixels, or analytics trackers that share data
                with external parties.
              </p>
            </Section>

            <Section title="8. Data Retention">
              <ul>
                <li><strong>Account Data:</strong> Retained for as long as your account is active. Deleted within 30 days of account deletion request.</li>
                <li><strong>Authentication Logs:</strong> Retained for 90 days for security and audit purposes.</li>
                <li><strong>Session Tokens:</strong> Automatically expire and are purged after 30 days.</li>
                <li><strong>Magic Link Tokens:</strong> Expire after 15 minutes and are purged within 24 hours.</li>
              </ul>
            </Section>

            <Section title="9. Children's Privacy">
              <p>
                SutraID is not intended for use by anyone under the age of 16. We do not knowingly collect personal
                information from children. If you believe a child has provided us with personal data, please contact us
                at <a href="mailto:privacy@sutraid.com" style={linkStyle}>privacy@sutraid.com</a> and we will delete it.
              </p>
            </Section>

            <Section title="10. International Data Transfers">
              <p>
                Your information may be transferred to and processed in countries other than your country of residence.
                We ensure appropriate safeguards are in place, including standard contractual clauses, to protect your
                data in accordance with this Privacy Policy and applicable law.
              </p>
            </Section>

            <Section title="11. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting
                the updated policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service
                after changes constitutes acceptance of the updated policy.
              </p>
            </Section>

            <Section title="12. Contact Us">
              <p>If you have questions about this Privacy Policy or our data practices, contact us at:</p>
              <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                <li><strong>Email:</strong> <a href="mailto:privacy@sutraid.com" style={linkStyle}>privacy@sutraid.com</a></li>
                <li><strong>Support:</strong> <a href="/support" style={linkStyle}>sutraid.com/support</a></li>
                <li><strong>Website:</strong> <a href="https://sutraid.com" style={linkStyle}>sutraid.com</a></li>
              </ul>
            </Section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

const h4Style: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginTop: '1.25rem',
  marginBottom: '0.5rem',
};

const linkStyle: React.CSSProperties = {
  color: 'var(--accent-primary)',
  textDecoration: 'none',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2 style={{
        fontSize: '1.35rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '1rem',
        marginTop: 0,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
