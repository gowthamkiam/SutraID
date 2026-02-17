import EndpointBlock from '@/components/docs/EndpointBlock';
import { samlProviderSection } from '@/app/docs/api-data';

export default function SamlProviderReferencePage() {
  return (
    <div style={{ maxWidth: '960px' }}>
      <h1
        style={{
          fontSize: '2.2rem',
          fontWeight: 900,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginTop: 0,
          marginBottom: '0.5rem',
        }}
      >
        {samlProviderSection.title}
      </h1>
      <p
        style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: '2rem',
        }}
      >
        {samlProviderSection.description}
      </p>
      {samlProviderSection.endpoints.map((endpoint) => (
        <EndpointBlock key={endpoint.id} endpoint={endpoint} />
      ))}
    </div>
  );
}
