import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const features = [
  {
    icon: '\u2728',
    title: 'Passwordless Auth',
    description: 'Magic links, email OTP, and biometric authentication. No passwords to remember, no passwords to breach.',
  },
  {
    icon: '\ud83d\udd10',
    title: 'Enterprise SSO',
    description: 'SAML 2.0 and OpenID Connect out of the box. One-click integration with Okta, Azure AD, and Google Workspace.',
  },
  {
    icon: '\ud83e\udd16',
    title: 'AI Agent Auth',
    description: 'Token delegation chains for AI agents. Authenticate both humans and intelligent agents with the same platform.',
  },
  {
    icon: '\ud83c\udfe2',
    title: 'Multi-Tenancy',
    description: 'Built-in organization management with RBAC. Isolate tenants, manage teams, and control access at every level.',
  },
  {
    icon: '\u2699\ufe0f',
    title: 'Developer First',
    description: 'RESTful APIs, comprehensive SDKs, and detailed documentation. Integrate auth in minutes, not weeks.',
  },
  {
    icon: '\ud83d\udee1\ufe0f',
    title: 'Security & Compliance',
    description: 'AES-256-GCM encryption, PKCE flows, audit logging, and network zone policies. Enterprise-grade security built in.',
  },
];

const useCases = [
  {
    title: 'B2B SaaS',
    description: 'Add enterprise SSO to your product in minutes. Let your customers connect their identity providers without complex integrations.',
    tag: 'Enterprise',
  },
  {
    title: 'AI Platforms',
    description: 'Authenticate AI agents alongside human users. Manage token delegation chains and MCP server integrations natively.',
    tag: 'AI-Native',
  },
  {
    title: 'Developer Tools',
    description: 'API key management, OAuth client credentials, and machine-to-machine authentication for your developer platform.',
    tag: 'APIs',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create your project',
    description: 'Sign up, create an organization, and configure your first application in under a minute.',
  },
  {
    number: '02',
    title: 'Configure auth methods',
    description: 'Choose from magic links, SSO, social login, or AI agent tokens. Mix and match as needed.',
  },
  {
    number: '03',
    title: 'Go live',
    description: 'Integrate with a few lines of code. Your users can start authenticating immediately.',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For side projects and experiments',
    features: ['Up to 1,000 MAU', 'Magic link auth', 'Basic SSO', 'Community support'],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'For growing teams and products',
    features: ['Up to 10,000 MAU', 'Enterprise SSO (SAML + OIDC)', 'Multi-tenancy', 'Priority support', 'Custom branding'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations at scale',
    features: ['Unlimited MAU', 'AI agent authentication', 'Audit logging', 'SLA guarantees', 'Dedicated support', 'On-premise option'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const codeSnippet = `// Authenticate with SutraID in 3 lines
import { SutraID } from '@sutraid/sdk';

const auth = new SutraID({
  projectId: 'your-project-id'
});

// Magic link login
await auth.magicLink.send({
  email: 'user@example.com'
});

// Verify and get session
const session = await auth.magicLink.verify({
  token: tokenFromEmail
});

console.log(session.user);
// { id, email, orgId, role }`;

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        background: 'var(--bg-hero)',
        paddingTop: '140px',
        paddingBottom: '100px',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grid pattern overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />

        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '20px',
            padding: '0.35rem 1rem',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: '#a5b4fc',
            marginBottom: '1.5rem',
            letterSpacing: '0.02em',
          }}>
            Now in Beta &mdash; Free for developers
          </div>

          <h1 style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
            fontWeight: 800,
            color: 'var(--text-on-dark)',
            lineHeight: 1.1,
            margin: '0 0 1.5rem',
            letterSpacing: '-0.03em',
          }}>
            Authentication Built for<br />
            <span style={{
              background: 'linear-gradient(135deg, #818cf8, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Humans and AI Agents
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'var(--text-on-dark-secondary)',
            lineHeight: 1.7,
            margin: '0 auto 2.5rem',
            maxWidth: '600px',
          }}>
            SutraID is the AI-native CIAM platform that makes identity simple.
            Passwordless auth, enterprise SSO, and AI agent tokens &mdash; all in one platform.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/login" style={{
              textDecoration: 'none',
              background: '#6366f1',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '0.875rem 2rem',
              borderRadius: '10px',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}>
              Get Started Free
            </a>
            <a href="#developers" style={{
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              fontSize: '1rem',
              fontWeight: 500,
              padding: '0.875rem 2rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              transition: 'background 0.15s',
            }}>
              View Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <p style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 0 1.5rem',
        }}>
          Trusted by innovative teams
        </p>
        <div style={{
          display: 'flex',
          gap: '3rem',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          opacity: 0.4,
        }}>
          {['Acme Corp', 'TechFlow', 'NeuralOps', 'DataPrime', 'CloudScale'].map((name) => (
            <span key={name} style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              letterSpacing: '-0.01em',
            }}>
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="product" style={{
        padding: '6rem 2rem',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 1rem',
              letterSpacing: '-0.02em',
            }}>
              Everything you need for identity
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              A complete authentication and identity management platform designed for modern applications and AI-powered systems.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {features.map((feature) => (
              <div key={feature.title} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '2rem',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.75rem',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" style={{
        padding: '6rem 2rem',
        background: 'var(--bg-section-alt)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 1rem',
              letterSpacing: '-0.02em',
            }}>
              Built for every use case
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              From B2B SaaS to AI agent platforms, SutraID adapts to your needs.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {useCases.map((useCase) => (
              <div key={useCase.title} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '2rem',
              }}>
                <span style={{
                  display: 'inline-block',
                  background: 'var(--accent-light)',
                  color: 'var(--accent-text)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                }}>
                  {useCase.tag}
                </span>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.75rem',
                }}>
                  {useCase.title}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="resources" style={{
        padding: '6rem 2rem',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 1rem',
              letterSpacing: '-0.02em',
            }}>
              Up and running in minutes
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              Three simple steps to add enterprise-grade auth to your application.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
          }}>
            {steps.map((step) => (
              <div key={step.number} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'var(--accent-light)',
                  color: 'var(--accent-primary)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  {step.number}
                </div>
                <h3 style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.5rem',
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section id="developers" style={{
        padding: '6rem 2rem',
        background: 'var(--bg-section-alt)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}>
            <div>
              <h2 style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 1rem',
                letterSpacing: '-0.02em',
              }}>
                Built by developers,<br />for developers
              </h2>
              <p style={{
                fontSize: '1.05rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 1.5rem',
              }}>
                Clean REST APIs, type-safe SDKs, and comprehensive documentation.
                Integrate SutraID into your stack in minutes, not weeks.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['API-first architecture', 'TypeScript & Python SDKs', 'Webhook support', 'OpenAPI spec'].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      color: 'var(--accent-primary)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                    }}>{'\u2713'}</span>
                    <span style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.95rem',
                    }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Snippet */}
            <div style={{
              background: '#0d1117',
              borderRadius: '12px',
              padding: '1.5rem',
              overflow: 'auto',
              border: '1px solid #30363d',
            }}>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
              </div>
              <pre style={{
                margin: 0,
                fontSize: '0.8rem',
                lineHeight: 1.65,
                color: '#c9d1d9',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {codeSnippet}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{
        padding: '6rem 2rem',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 1rem',
              letterSpacing: '-0.02em',
            }}>
              Simple, transparent pricing
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            alignItems: 'stretch',
          }}>
            {pricingPlans.map((plan) => (
              <div key={plan.name} style={{
                background: plan.highlighted ? 'var(--accent-primary)' : 'var(--bg-card)',
                border: plan.highlighted ? 'none' : '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}>
                {plan.highlighted && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#fbbf24',
                    color: '#1a1a1a',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.3rem 1rem',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Most Popular
                  </div>
                )}
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: plan.highlighted ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                  margin: '0 0 0.5rem',
                }}>
                  {plan.name}
                </h3>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{
                    fontSize: '2.75rem',
                    fontWeight: 800,
                    color: plan.highlighted ? '#fff' : 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                  }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{
                      fontSize: '1rem',
                      color: plan.highlighted ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)',
                    }}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: plan.highlighted ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                  margin: '0 0 1.5rem',
                  lineHeight: 1.5,
                }}>
                  {plan.description}
                </p>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '2rem',
                  flex: 1,
                }}>
                  {plan.features.map((feature) => (
                    <div key={feature} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}>
                      <span style={{
                        color: plan.highlighted ? 'rgba(255,255,255,0.8)' : 'var(--accent-primary)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                      }}>{'\u2713'}</span>
                      <span style={{
                        fontSize: '0.875rem',
                        color: plan.highlighted ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)',
                      }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
                <a href="/login" style={{
                  textDecoration: 'none',
                  textAlign: 'center',
                  background: plan.highlighted ? '#fff' : 'var(--btn-primary-bg)',
                  color: plan.highlighted ? 'var(--accent-primary)' : 'var(--btn-primary-text)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  transition: 'opacity 0.15s',
                }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 2rem',
        background: 'var(--bg-hero)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            fontWeight: 800,
            color: 'var(--text-on-dark)',
            margin: '0 0 1rem',
            letterSpacing: '-0.02em',
          }}>
            Ready to get started?
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-on-dark-secondary)',
            lineHeight: 1.6,
            margin: '0 0 2rem',
          }}>
            Join developers building the future of authentication.
            Free forever for up to 1,000 monthly active users.
          </p>
          <a href="/login" style={{
            textDecoration: 'none',
            display: 'inline-block',
            background: '#6366f1',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            padding: '0.875rem 2.5rem',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
          }}>
            Start Building for Free
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
