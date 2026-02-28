'use client';

import {
  ShieldCheck,
  Lock,
  Zap,
  Users,
  Code2,
  ShieldAlert,
  ArrowRight,
  Fingerprint,
  Globe,
  Cpu,
  Layers,
  Share2,
  Bot,
  Star
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';

const features = [
  {
    icon: Fingerprint,
    title: 'Passwordless Auth',
    description: 'Magic links, email OTP, and biometric authentication. No passwords to remember, no passwords to breach.',
    color: '#6366f1',
  },
  {
    icon: Globe,
    title: 'Enterprise SSO',
    description: 'SAML 2.0 and OpenID Connect out of the box. One-click integration with Okta, Azure AD, and Google Workspace.',
    color: '#3b82f6',
  },
  {
    icon: Bot,
    title: 'Agentic IAM',
    description: 'Secure authentication and granular access control for APIs, AI agents, remote MCP servers, and more.',
    color: '#10b981',
  },
  {
    icon: Users,
    title: 'Team Governance',
    description: 'Built-in team management with granular RBAC. Secure your environment, manage collaborators, and control access at every level.',
    color: '#8b5cf6',
  },
  {
    icon: Code2,
    title: 'Developer First',
    description: 'RESTful APIs, comprehensive SDKs, and detailed documentation. Integrate auth in minutes, not weeks.',
    color: '#ec4899',
  },
  {
    icon: ShieldCheck,
    title: 'Security & Compliance',
    description: 'AES-256-GCM encryption, PKCE flows, audit logging, and network zone policies. Enterprise-grade security built in.',
    color: '#f59e0b',
  },
];

const useCases = [
  {
    title: 'B2B SaaS',
    description: 'Add enterprise SSO to your product in minutes. Let your customers connect their identity providers without complex integrations.',
    tag: 'Enterprise',
    icon: Globe,
    color: '#0ea5e9',
  },
  {
    title: 'AI Platforms',
    description: 'Authenticate AI agents alongside human users. Manage token delegation chains and MCP server integrations natively.',
    tag: 'AI-Native',
    icon: Bot,
    color: '#8b5cf6',
  },
  {
    title: 'Developer Tools',
    description: 'API key management, OAuth client credentials, and machine-to-machine authentication for your developer platform.',
    tag: 'APIs',
    icon: Zap,
    color: '#10b981',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create your project',
    description: 'Sign up, set up your project, and configure your first application in under a minute.',
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

// Note: Pricing and billing are intentionally excluded from the open-source version.

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
// { id, email, role }`;

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      color: '#111827',
      // Force soft light theme variables
      '--bg-primary': '#f9fafb',
      '--bg-card': '#ffffff',
      '--text-primary': '#111827',
      '--text-secondary': '#4b5563',
      '--border-color': '#e5e7eb',
      '--accent-primary': '#06b6d4',
      '--accent-light': '#ecfeff',
      '--nav-bg': 'rgba(255, 255, 255, 0.8)',
    } as any}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        background: 'radial-gradient(circle at 50% -20%, #2e2f5e 0%, #0a0a0b 80%)',
        paddingTop: '160px',
        paddingBottom: '120px',
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
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />

        <div style={{ position: 'relative', maxWidth: '900px', margin: '0 auto', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '20px',
            padding: '0.35rem 1.25rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#818cf8',
            marginBottom: '2rem',
            letterSpacing: '0.02em',
          }}>
            Now in Beta &mdash; Free for developers
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 950,
            color: '#ffffff',
            lineHeight: 1.05,
            margin: '0 0 2rem',
            letterSpacing: '-0.04em',
          }}>
            Authentication Built for<br />
            <span style={{
              background: 'linear-gradient(to right, #6366f1, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Humans and AI Agents
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
            color: '#9ca3af',
            lineHeight: 1.6,
            margin: '0 auto 3.5rem',
            maxWidth: '650px',
          }}>
            SutraID is the AI-native CIAM platform that makes identity simple. Passwordless auth, enterprise SSO, and AI agent tokens — all in one platform.
          </p>

          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              textDecoration: 'none',
              background: '#6366f1',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 800,
              padding: '1rem 2.5rem',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = '#4f46e5';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = '#6366f1';
              }}
            >
              Get Started Free
            </Link>
            <Link href="/integration-guide" style={{
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#e5e7eb',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '1rem 2.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              View Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{
        padding: '5rem 2rem',
        textAlign: 'center',
        background: '#0a0a0b',
        position: 'relative',
        zIndex: 1,
      }}>
        <p style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          margin: '0 0 2.5rem',
        }}>
          Trusted by innovative teams
        </p>
        <div style={{
          display: 'flex',
          gap: '4rem',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {['Acme Corp', 'TechFlow', 'NeuralOps', 'DataPrime', 'CloudScale'].map((name) => (
            <span key={name} style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.02em',
            }}>
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Curly Transition Top (Dark -> Light) */}
      <div style={{
        background: '#0a0a0b',
        height: '100px',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        marginTop: '-1px', // Prevent gap
      }}>
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <path
            d="M 0 100 C 0 100 300 100 300 100 C 450 100 550 0 720 0 C 890 0 990 100 1140 100 C 1140 100 1440 100 1440 100 L 1440 100 L 0 100 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Light Bundle Container */}
      <div style={{
        background: '#ffffff',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Feature Section: Everything you need (KEEP LATEST RICH CARDS) */}
        <section id="product" style={{
          padding: '10rem 2rem',
          background: '#ffffff',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <h2 style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                fontWeight: 950,
                color: '#111827',
                margin: '0 0 1.25rem',
                letterSpacing: '-0.04em',
              }}>
                Everything you need for identity
              </h2>
              <p style={{
                fontSize: '1.25rem',
                color: '#4b5563',
                maxWidth: '700px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}>
                A comprehensive identity platform that combines high-fidelity security with developer simplicity.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2.5rem',
            }}>
              {features.map((feature) => (
                <div key={feature.title} style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '32px',
                  padding: '3rem',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-12px)';
                    e.currentTarget.style.borderColor = feature.color;
                    e.currentTarget.style.boxShadow = `0 30px 60px ${feature.color}15`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.03)';
                  }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    background: `${feature.color}10`,
                    color: feature.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <feature.icon size={32} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: '#111827',
                      margin: '0 0 1rem',
                      letterSpacing: '-0.02em',
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{
                      fontSize: '1.1rem',
                      color: '#4b5563',
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" style={{
          padding: '10rem 2rem',
          background: '#f9fafb',
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 950,
                color: '#111827',
                margin: '0 0 1rem',
                letterSpacing: '-0.03em',
              }}>
                Built for every use case
              </h2>
              <p style={{
                fontSize: '1.2rem',
                color: '#4b5563',
                maxWidth: '600px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}>
                From B2B SaaS to AI agent platforms, SutraID adapts to your needs.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
            }}>
              {useCases.map((useCase) => (
                <div key={useCase.title} style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '32px',
                  padding: '3rem',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-12px)';
                    e.currentTarget.style.borderColor = useCase.color;
                    e.currentTarget.style.boxShadow = `0 30px 60px ${useCase.color}15`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.05)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '18px',
                      background: `${useCase.color}10`,
                      color: useCase.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <useCase.icon size={32} />
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '100px',
                      background: '#f8fafc',
                      color: '#64748b',
                      border: '1px solid #e2e8f0',
                    }}>
                      {useCase.tag}
                    </span>
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: '#111827',
                      margin: '0 0 1rem',
                      letterSpacing: '-0.02em',
                    }}>
                      {useCase.title}
                    </h3>
                    <p style={{
                      fontSize: '1.1rem',
                      color: '#4b5563',
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {useCase.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="resources" style={{
          padding: '10rem 2rem',
          background: '#ffffff',
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <h2 style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                fontWeight: 950,
                color: '#111827',
                margin: '0 0 1.25rem',
                letterSpacing: '-0.04em',
              }}>
                Up and running in minutes
              </h2>
              <p style={{
                fontSize: '1.25rem',
                color: '#4b5563',
                maxWidth: '500px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}>
                Three simple steps to add enterprise-grade auth to your application.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '3rem',
            }}>
              {steps.map((step) => (
                <div key={step.number} style={{
                  textAlign: 'left',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '32px',
                  padding: '4rem 3rem',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-12px)';
                    e.currentTarget.style.borderColor = '#06b6d4';
                    e.currentTarget.style.boxShadow = '0 30px 60px rgba(6, 182, 212, 0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Large Background Number */}
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '10px',
                    fontSize: '8rem',
                    fontWeight: 950,
                    color: '#06b6d4',
                    opacity: 0.05,
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}>
                    {step.number}
                  </div>

                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: '#ecfeff',
                    color: '#0891b2',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.1)',
                  }}>
                    {step.number}
                  </div>

                  <div style={{ zIndex: 1 }}>
                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: '#111827',
                      margin: '0 0 1rem',
                      letterSpacing: '-0.01em',
                    }}>
                      {step.title}
                    </h3>
                    <p style={{
                      fontSize: '1.1rem',
                      color: '#4b5563',
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Developer Section */}
        <section id="developers" style={{
          padding: '10rem 2rem',
          background: '#f8fafc',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle background glow */}
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, transparent 70%)',
            filter: 'blur(60px)',
            zIndex: 0,
          }} />

          <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '5rem',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{
                  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                  fontWeight: 950,
                  color: '#111827',
                  margin: '0 0 1.5rem',
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                }}>
                  Built by developers,<br />for developers
                </h2>
                <p style={{
                  fontSize: '1.25rem',
                  color: '#4b5563',
                  lineHeight: 1.7,
                  margin: '0 0 3rem',
                }}>
                  Clean REST APIs, type-safe SDKs, and comprehensive documentation.
                  Integrate SutraID into your stack in minutes, not weeks.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {['API-first architecture', 'TypeScript & Python SDKs', 'Webhook support', 'OpenAPI spec'].map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#ecfeff',
                        color: '#0891b2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 900,
                        boxShadow: '0 2px 6px rgba(6, 182, 212, 0.1)',
                      }}>
                        {'\u2713'}
                      </div>
                      <span style={{
                        color: '#334155',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                      }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Snippet Container */}
              <div style={{
                background: '#0d1117',
                borderRadius: '32px',
                padding: '2.5rem',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 40px 100px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Glow behind code */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />

                <div style={{
                  display: 'flex',
                  gap: '0.6rem',
                  marginBottom: '2rem',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ff5f57', opacity: 0.9 }} />
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#febc2e', opacity: 0.9 }} />
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#28c840', opacity: 0.9 }} />
                </div>
                <pre style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  lineHeight: 1.8,
                  color: '#e6edf3',
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {codeSnippet}
                </pre>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* AI Agent Demo Section */}
      <section style={{
        padding: '8rem 2rem',
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 20px 40px rgba(16, 185, 129, 0.2)',
          }}>
            <Bot size={40} />
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 950,
            color: '#111827',
            margin: '0 0 1.5rem',
            letterSpacing: '-0.03em',
          }}>
            Identity for AI Agents
          </h2>

          <p style={{
            fontSize: '1.25rem',
            color: '#4b5563',
            lineHeight: 1.7,
            margin: '0 0 3rem',
            maxWidth: '700px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            SutraID provides OAuth 2.1 compliant authentication for AI agents using client credentials flow. Secure, standardized, and ready to integrate.
          </p>

          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '24px',
            padding: '2.5rem',
            marginBottom: '2.5rem',
            textAlign: 'left',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
            }}>
              <div>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#10b981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem',
                }}>
                  Features
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  fontSize: '1rem',
                  color: '#374151',
                  lineHeight: 2,
                }}>
                  <li>✓ OAuth 2.1 Client Credentials</li>
                  <li>✓ JWT Token Validation</li>
                  <li>✓ Token Introspection</li>
                  <li>✓ Scope-based Access Control</li>
                </ul>
              </div>
              <div>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#10b981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem',
                }}>
                  Technologies
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  fontSize: '1rem',
                  color: '#374151',
                  lineHeight: 2,
                }}>
                  <li>✓ Node.js + TypeScript</li>
                  <li>✓ Commander CLI</li>
                  <li>✓ Jose (JWT validation)</li>
                  <li>✓ Axios HTTP Client</li>
                </ul>
              </div>
            </div>
          </div>

          <a
            href="https://github.com/gowthamkiam/SutraID/tree/main/examples/ai-agent-demo"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 800,
              padding: '1.25rem 3rem',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.3)';
            }}
          >
            Try AI Agent Demo
            <ArrowRight size={20} />
          </a>

          <div style={{
            marginTop: '2rem',
            fontSize: '0.95rem',
            color: '#6b7280',
          }}>
            Complete working example with step-by-step guide
          </div>
        </div>
      </section>

      {/* Bottom Transition (Clean cut to dark) */}
      <div style={{ height: '80px', background: '#ffffff' }} />

      {/* Dark Bottom Section (no pricing UI in OSS version) */}
      <div style={{
        background: '#0a0a0b',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* CTA Section */}
        <section style={{
          padding: '10rem 2rem',
          background: 'radial-gradient(circle at 50% 0%, #17171e 0%, #0a0a0b 100%)',
          textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: 950,
              color: '#fff',
              margin: '0 0 1.5rem',
              letterSpacing: '-0.04em',
            }}>
              Ready to get started?
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#9ca3af',
              lineHeight: 1.6,
              margin: '0 0 3.5rem',
            }}>
              Join developers building the future of authentication with a fully open-source, self-hostable platform.
            </p>
            <Link href="/login" style={{
              textDecoration: 'none',
              background: '#6366f1',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 800,
              padding: '1.25rem 3.5rem',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.3s ease',
              display: 'inline-block',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = '#4f46e5';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = '#6366f1';
              }}
            >
              Get Started Self-Hosting
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
