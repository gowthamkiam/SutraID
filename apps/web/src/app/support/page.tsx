import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Support - SutraID',
  description: 'Get help with SutraID. Contact our support team, browse FAQs, and find resources.',
};

const faqs = [
  {
    q: 'How do I sign in to SutraID?',
    a: 'SutraID supports passwordless magic links, password-based authentication, and enterprise SSO (SAML 2.0 / OIDC). Enter your email on the login page and choose your preferred method.',
  },
  {
    q: 'I didn\'t receive my magic link email. What should I do?',
    a: 'Check your spam/junk folder first. Magic links are sent from mail.sutraid.com. If you still don\'t see it, try requesting a new one. Links expire after 15 minutes.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Click "Forgot password?" on the login page, enter your email, and we\'ll send you a secure reset link. If you use passwordless login, no password reset is needed.',
  },
  {
    q: 'How do I set up SSO for my organization?',
    a: 'Navigate to Dashboard > SSO Providers and click "Add Provider". SutraID supports SAML 2.0 and OIDC with providers like Okta, Azure AD, and Google Workspace.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. SutraID uses industry-standard encryption (AES-256, bcrypt for passwords, SHA-256 for tokens), TLS for all connections, and stores data in SOC 2 compliant infrastructure.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Contact us at support@sutraid.com with your account email and we will process your deletion request within 30 days, in compliance with GDPR and CCPA.',
  },
];

export default function SupportPage() {
  return (
    <>
      <Navbar />
      <main style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingTop: '6rem',
      }}>
        {/* Hero */}
        <section style={{
          textAlign: 'center',
          padding: '3rem 2rem 4rem',
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            letterSpacing: '-0.5px',
          }}>
            How can we help?
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            lineHeight: 1.6,
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Find answers to common questions or reach out to our support team directly.
          </p>
        </section>

        {/* Contact Cards */}
        <section style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 2rem 3rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '2rem',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Email Support</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              Reach our team for technical issues, account inquiries, or general questions.
            </p>
            <a href="mailto:support@sutraid.com" style={{
              color: 'var(--accent-primary)',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}>
              support@sutraid.com
            </a>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
              Response within 24 hours on business days
            </p>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '2rem',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Documentation</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              Browse our developer docs for API references, integration guides, and SDKs.
            </p>
            <a href="https://docs.sutraid.com" style={{
              color: 'var(--accent-primary)',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}>
              docs.sutraid.com
            </a>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
              Guides, API references, and quickstarts
            </p>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '2rem',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>System Status</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              Check the current status of SutraID services and view past incidents.
            </p>
            <a href="https://status.sutraid.com" style={{
              color: 'var(--accent-primary)',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}>
              status.sutraid.com
            </a>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
              Real-time uptime monitoring
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '2rem 2rem 4rem',
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '2rem',
            textAlign: 'center',
          }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '1.5rem',
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginTop: 0,
                  marginBottom: '0.75rem',
                }}>
                  {faq.q}
                </h3>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Enterprise Support CTA */}
        <section style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 2rem 4rem',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'var(--accent-light)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '2.5rem 2rem',
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginTop: 0,
              marginBottom: '0.75rem',
            }}>
              Need Enterprise Support?
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
              maxWidth: '500px',
              margin: '0 auto 1.5rem',
            }}>
              Get priority SLA, dedicated account management, custom integrations, and 24/7 support with our Enterprise plan.
            </p>
            <a href="mailto:enterprise@sutraid.com" style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              background: 'var(--accent-primary)',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '50px',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}>
              Contact Sales
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
