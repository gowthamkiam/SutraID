# SutraID AI Agent Demo

OAuth 2.1 compliant AI agent client for SutraID. This demo showcases how AI agents can securely authenticate and interact with protected APIs using client credentials flow.

## Features

- ✅ OAuth 2.1 Client Credentials Grant
- ✅ JWT token validation using JWKS
- ✅ Token introspection
- ✅ Token revocation
- ✅ Protected endpoint access with scope validation
- ✅ Error handling and retry logic

## Prerequisites

- Node.js 20+
- SutraID backend running
- Admin access to create AI agents

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Register AI Agent

First, create an AI agent via the SutraID admin API:

```bash
curl -X POST http://localhost:3000/api/v1/organizations/{orgId}/applications/ai-agents \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My AI Agent",
    "description": "Test agent for demo",
    "scopes": ["ai:tool:call", "ai:memory:read"]
  }'
```

The response will include your `client_id` and `client_secret`.

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
SUTRAID_BASE_URL=http://localhost:3000
CLIENT_ID=app_your_client_id_here
CLIENT_SECRET=your_client_secret_here
```

### 4. Run Demo

```bash
npm run demo
```

## Usage

### Get Access Token

```bash
npm run demo login
```

Output:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "ai:tool:call ai:memory:read"
}
```

### Get Agent Identity

```bash
npm run demo identity --token YOUR_ACCESS_TOKEN
```

Output:
```json
{
  "agent_id": "app_abc123",
  "organization_id": "org-uuid",
  "scopes": ["ai:tool:call", "ai:memory:read"],
  "version": "1.0.0"
}
```

### Execute Tool

```bash
npm run demo execute --token YOUR_ACCESS_TOKEN --tool calculator --params '{"op":"add","a":5,"b":3}'
```

Output:
```json
{
  "tool": "calculator",
  "agent_id": "app_abc123",
  "organization_id": "org-uuid",
  "result": {
    "result": 8
  },
  "executed_at": "2024-01-15T10:30:00.000Z"
}
```

### Introspect Token

```bash
npm run demo introspect --token YOUR_ACCESS_TOKEN
```

Output:
```json
{
  "active": true,
  "scope": "ai:tool:call ai:memory:read",
  "client_id": "app_abc123",
  "exp": 1705320600,
  "agent_id": "app_abc123",
  "org_id": "org-uuid"
}
```

### Revoke Token

```bash
npm run demo revoke --token YOUR_ACCESS_TOKEN
```

Output:
```json
{
  "status": "revoked"
}
```

## API Reference

### SutraIdAgentClient

```typescript
import { SutraIdAgentClient } from './src/agent-client';

const client = new SutraIdAgentClient(
  'http://localhost:3000',
  'your_client_id',
  'your_client_secret'
);

// Get access token
const token = await client.getAccessToken();

// Get agent identity
const identity = await client.getIdentity(token);

// Execute tool
const result = await client.executeTool(token, 'calculator', { op: 'add', a: 1, b: 2 });

// Introspect token
const introspection = await client.introspectToken(token);

// Revoke token
await client.revokeToken(token);
```

## Architecture

```
┌─────────────┐
│  AI Agent   │
│   (This)    │
└──────┬──────┘
       │ 1. Client Credentials Grant
       ▼
┌─────────────────────┐
│  SutraID Backend    │
│  OAuth 2.1 Server   │
└──────┬──────────────┘
       │ 2. JWT Access Token
       │    (typ: ai_agent)
       ▼
┌─────────────────────┐
│  Protected APIs     │
│  /ai/agents/me      │
│  /ai/agents/execute │
└─────────────────────┘
```

## Token Structure

AI Agent tokens are JWTs with specific claims:

```json
{
  "typ": "ai_agent",
  "agent_id": "app_abc123",
  "org_id": "org-uuid",
  "org_name": "Acme Corp",
  "scope": "ai:tool:call ai:memory:read",
  "agent_version": "1.0.0",
  "exp": 1705320600,
  "iat": 1705317000,
  "iss": "https://api.sutraid.com",
  "aud": "https://api.sutraid.com"
}
```

## Available Scopes

- `ai:tool:call` - Execute tools and functions
- `ai:memory:read` - Read agent memory and context
- `ai:memory:write` - Write to agent memory
- `ai:user:read` - Read user profile information
- `ai:org:read` - Read organization information

## Error Handling

The demo includes comprehensive error handling:

- Invalid credentials → 401 Unauthorized
- Expired token → 401 Unauthorized, auto-refresh
- Insufficient scope → 403 Forbidden
- Invalid tool → 404 Not Found
- Network errors → Retry with exponential backoff

## Security Notes

- **Never commit** `.env` file to version control
- Client secrets are **single-use** - store securely after creation
- Tokens are **short-lived** (default 1 hour)
- Always use **HTTPS** in production
- Implement **rate limiting** for token requests

## Troubleshooting

### "Client authentication required"

Make sure your `CLIENT_ID` and `CLIENT_SECRET` are correctly set in `.env`.

### "Token is not for AI agent"

Your token was issued for a different application type. Ensure you're using an AI agent application created via `/api/v1/organizations/:orgId/applications/ai-agents`.

### "Insufficient scope for this tool"

Request additional scopes when creating your AI agent or add them via the admin API.

## License

MIT

## Resources

- [SutraID Documentation](https://docs.sutraid.com)
- [OAuth 2.1 Specification](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-11)
- [RFC 7662 - Token Introspection](https://datatracker.ietf.org/doc/html/rfc7662)
- [RFC 7009 - Token Revocation](https://datatracker.ietf.org/doc/html/rfc7009)
