'use client';

import { useState } from 'react';
import Link from 'next/link';

const steps = [
    {
        id: 'setup',
        title: '1. Organization Setup',
        description: 'Get your unique workspace and configure your environment.',
        icon: '🏢'
    },
    {
        id: 'identity',
        title: '2. Identity Onboarding',
        description: 'Create profiles for both humans and intelligent AI agents.',
        icon: '🤖'
    },
    {
        id: 'apps',
        title: '3. Application Integration',
        description: 'Connect your tools using OIDC, SAML, or our SDKs.',
        icon: '🔌'
    },
    {
        id: 'policies',
        title: '4. Security Policies',
        description: 'Configure Passkey MFA, SSO, and JIT Authorization.',
        icon: '🛡️'
    }
];

export default function IntegrationGuide() {
    const [activeStep, setActiveStep] = useState('setup');

    const cardStyle: React.CSSProperties = {
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    };

    const codeBlockStyle: React.CSSProperties = {
        background: '#0f172a',
        color: '#e2e8f0',
        padding: '1.5rem',
        borderRadius: '12px',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        overflowX: 'auto',
        lineHeight: 1.5,
        border: '1px solid #1e293b'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#ffffff',
            color: '#1e293b',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            paddingBottom: '6rem'
        }}>
            {/* Navigation Header */}
            <nav style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
                zIndex: 10
            }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
                    <span style={{ color: '#6366f1' }}>S</span>utra<span style={{ color: '#6366f1' }}>ID</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Guides</span>
                </div>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>Product</Link>
                    <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>Console</Link>
                    <Link href="#" style={{ textDecoration: 'none', color: '#6366f1', fontWeight: 700 }}>Integration Guide</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header style={{
                padding: '5rem 2rem 4rem',
                textAlign: 'center',
                background: 'radial-gradient(circle at 50% 0%, #f5f3ff 0%, #ffffff 100%)'
            }}>
                <h1 style={{
                    fontSize: '3.5rem',
                    fontWeight: 900,
                    color: '#0f172a',
                    letterSpacing: '-0.04em',
                    margin: '0 0 1rem'
                }}>
                    Automate Identity for the <span style={{ color: '#6366f1' }}>AI Era</span>
                </h1>
                <p style={{
                    fontSize: '1.25rem',
                    color: '#64748b',
                    maxWidth: '800px',
                    margin: '0 auto 3rem',
                    lineHeight: 1.6
                }}>
                    End-to-end integration walkthrough. Learn how to secure your workforce, your customers, and your intelligent agents.
                </p>
            </header>

            {/* Interactive Flow Demo */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '4rem' }}>

                    {/* Vertical Menu */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {steps.map((step) => (
                            <button
                                key={step.id}
                                onClick={() => setActiveStep(step.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.25rem',
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    border: '1px solid',
                                    borderColor: activeStep === step.id ? '#6366f1' : '#f1f5f9',
                                    background: activeStep === step.id ? '#f5f3ff' : '#ffffff',
                                    color: activeStep === step.id ? '#4338ca' : '#1e293b',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: activeStep === step.id ? '0 10px 15px -3px rgba(99, 102, 241, 0.1)' : 'none'
                                }}
                            >
                                <span style={{ fontSize: '1.75rem' }}>{step.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{step.title}</div>
                                    <div style={{ fontSize: '0.9rem', color: activeStep === step.id ? '#6366f1' : '#64748b', marginTop: '0.2rem' }}>
                                        {step.description}
                                    </div>
                                </div>
                            </button>
                        ))}

                        <div style={{
                            marginTop: '2rem',
                            padding: '1.5rem',
                            background: '#f8fafc',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 800 }}>Animations Outline</h4>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                                Our marketing GIFs follow the <strong>&quot;Sutra Flow&quot;</strong>: Signup → Policy Config → Agent Onboarding → Successful Auth.
                            </p>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={cardStyle}>
                        {activeStep === 'setup' && (
                            <div>
                                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Register Your Organization</h2>
                                <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
                                    The first step is creating your SutraID workspace. This gives you access to a secure tenant where all your identity data and policies will live.
                                </p>
                                <div style={codeBlockStyle}>
                                    {`// 1. Initialize the SDK
const sutra = new SutraID({
  organizationId: 'acme-corp-123',
  apiKey: process.env.SUTRA_API_KEY
});

// 2. Configure your environment
await sutra.organizations.configure({
  domain: 'acme.com',
  defaultRegion: 'us-east-1'
});`}
                                </div>
                            </div>
                        )}

                        {activeStep === 'identity' && (
                            <div>
                                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Humans & AI Agents</h2>
                                <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
                                    SutraID is the first platform to treat AI agents as first-class citizens. Whether it&apos;s a teammate or an LLM-powered bot, onboarding is seamless.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ margin: '0 0 0.5rem' }}>👤 Humans</h4>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Full MFA support, SSO, and profile management.</p>
                                    </div>
                                    <div style={{ padding: '1.25rem', background: '#f5f3ff', borderRadius: '12px', border: '1px solid #c7d2fe' }}>
                                        <h4 style={{ margin: '0 0 0.5rem' }}>🤖 AI Agents</h4>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Short-lived tokens, scoped permissions, and audit trails.</p>
                                    </div>
                                </div>
                                <div style={codeBlockStyle}>
                                    {`// Create an AI Agent identity
const agent = await sutra.agents.create({
  name: 'SupportBot-V2',
  capability: ['READ_TICKETS', 'INTERNAL_CHAT'],
  validity: '30d'
});`}
                                </div>
                            </div>
                        )}

                        {activeStep === 'apps' && (
                            <div>
                                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Connect Your Applications</h2>
                                <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
                                    Integrate your internal apps or external SaaS tools using standard protocols. We support OIDC, SAML, and custom API-based auth.
                                </p>
                                <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
                                    {['OIDC', 'SAML 2.0', 'OAuth', 'Custom API'].map(tag => (
                                        <span key={tag} style={{ padding: '0.4rem 0.8rem', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>{tag}</span>
                                    ))}
                                </div>
                                <div style={codeBlockStyle}>
                                    {`// Redirect user to SutraID Login
window.location.href = sutra.getLoginUrl({
  clientId: 'app_dashboard_main',
  redirectUri: 'https://app.acme.com/callback',
  scopes: ['openid', 'profile', 'email']
});`}
                                </div>
                            </div>
                        )}

                        {activeStep === 'policies' && (
                            <div>
                                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Intelligent Policies</h2>
                                <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
                                    Define how and when users can access resources. Implement <strong>Just-In-Time (JIT)</strong> authorization and **Adaptive MFA** effortlessly.
                                </p>

                                <div style={{ padding: '1.5rem', background: '#1e293b', borderRadius: '12px', marginBottom: '2rem' }}>
                                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Policy Mockup</div>
                                    <div style={{ color: '#fff', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                                        <div>IF (user.risk_score {'>'} 0.4) </div>
                                        <div style={{ paddingLeft: '2rem', color: '#fbbf24' }}>REQUIRE passkey_mfa</div>
                                        <div style={{ marginTop: '0.5rem' }}>IF (agent.type === &apos;AI&apos; && resource.tier === &apos;SECURE&apos;)</div>
                                        <div style={{ paddingLeft: '2rem', color: '#6366f1' }}>REQUEST jit_approval FROM manager</div>
                                    </div>
                                </div>

                                <div style={codeBlockStyle}>
                                    {`// Evaluate a JIT access request
const { decision, reason } = await sutra.policies.evaluate({
  subject: 'agent_support_bot',
  action: 'FETCH_CREDIT_CARD',
  context: { remoteIp: '192.168.1.1' }
});`}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Landing Page ASCII Preview */}
            <section style={{ maxWidth: '1200px', margin: '6rem auto 0', padding: '0 2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>Demo Screen: Sample Landing Page Mockup</h3>
                <div style={{
                    background: '#0f172a',
                    color: '#38bdf8',
                    padding: '2rem',
                    borderRadius: '20px',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    lineHeight: 1.4,
                    whiteSpace: 'pre',
                    border: '4px solid #1e293b',
                    overflowX: 'auto'
                }}>
                    {`+-----------------------------------------------------------+
| [S] SutraID Logo          Product   Docs   Guides          |
+-----------------------------------------------------------+
|                                                           |
|     AUTOMATE IDENTITY FOR THE AI-NATIVE WORKFORCE         |
|                                                           |
|       [ GIF: Signup -> Policy -> Agent Setup Flow ]       |
|                                                           |
|   +-------------------+      +-------------------------+  |
|   | ⚡ QUICK START    |      | 🤖 AI AGENT ONBOARDING  |  |
|   | Register Org      |      | Set scoped permissions  |  |
|   +-------------------+      +-------------------------+  |
|                                                           |
|   +-------------------+      +-------------------------+  |
|   | 🛡️ SECURITY        |      | 🔌 CONNECTIONS          |  |
|   | Passkeys & MFA    |      | OIDC / SAML / JIT       |  |
|   +-------------------+      +-------------------------+  |
|                                                           |
+-----------------------------------------------------------+`}
                </div>
            </section>

            {/* Call to Action */}
            <section style={{
                maxWidth: '850px',
                margin: '6rem auto 0',
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                borderRadius: '32px',
                color: '#fff',
                boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.3)'
            }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Ready to Integrate?</h2>
                <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2.5rem' }}>Join 500+ teams building the future of AI-native authentication.</p>
                <div style={{ display: 'flex', justifySelf: 'center', gap: '1rem' }}>
                    <Link href="/login" style={{
                        background: '#fff', color: '#4338ca', padding: '1rem 2.5rem',
                        borderRadius: '12px', fontWeight: 700, textDecoration: 'none',
                        fontSize: '1.1rem'
                    }}>Start Building Free</Link>
                    <Link href="#" style={{
                        background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '1rem 2.5rem',
                        borderRadius: '12px', fontWeight: 700, textDecoration: 'none',
                        fontSize: '1.1rem', border: '1px solid rgba(255,255,255,0.2)'
                    }}>View Full API Reference</Link>
                </div>
            </section>

            <style jsx>{`
        main button:hover {
          transform: scale(1.02);
          border-color: #6366f1 !important;
        }
      `}</style>
        </div>
    );
}
