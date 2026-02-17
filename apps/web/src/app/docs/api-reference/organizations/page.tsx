import EndpointBlock from '@/components/docs/EndpointBlock';
import { organizationsSection } from '@/app/docs/api-data';

export default function OrganizationsReferencePage() {
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
        {organizationsSection.title}
      </h1>
      <p
        style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: '2rem',
        }}
      >
        {organizationsSection.description}
      </p>
      {organizationsSection.endpoints.map((endpoint) => (
        <EndpointBlock key={endpoint.id} endpoint={endpoint} />
      ))}
    </div>
  );
}
