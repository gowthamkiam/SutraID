import axios, { AxiosError } from 'axios';
import { jwtVerify, createRemoteJWKSet } from 'jose';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface AgentIdentity {
  agent_id: string;
  organization_id: string;
  scopes: string[];
  version?: string;
}

export interface IntrospectionResponse {
  active: boolean;
  scope?: string;
  client_id?: string;
  exp?: number;
  agent_id?: string;
  org_id?: string;
}

export class SutraIdAgentClient {
  constructor(
    private baseUrl: string,
    private clientId: string,
    private clientSecret: string,
  ) {}

  async getAccessToken(): Promise<TokenResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'ai:tool:call ai:memory:read',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to get access token');
      throw error;
    }
  }

  async getIdentity(token: string): Promise<AgentIdentity> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/ai/agents/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to get agent identity');
      throw error;
    }
  }

  async executeTool(
    token: string,
    toolName: string,
    params: Record<string, any>,
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/ai/agents/execute`,
        {
          tool_name: toolName,
          parameters: params,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to execute tool');
      throw error;
    }
  }

  async introspectToken(token: string): Promise<IntrospectionResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth/introspect`,
        { token },
        {
          auth: {
            username: this.clientId,
            password: this.clientSecret,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to introspect token');
      throw error;
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth/revoke`,
        { token },
        {
          auth: {
            username: this.clientId,
            password: this.clientSecret,
          },
        },
      );

      console.log('Token revoked:', response.data);
    } catch (error) {
      this.handleError(error, 'Failed to revoke token');
      throw error;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const jwksUrl = `${this.baseUrl}/.well-known/jwks.json`;
      const JWKS = createRemoteJWKSet(new URL(jwksUrl));
      const { payload } = await jwtVerify(token, JWKS);

      console.log('Token validated successfully');
      console.log('Claims:', JSON.stringify(payload, null, 2));

      return true;
    } catch (error) {
      console.error('Token validation failed:', (error as Error).message);
      return false;
    }
  }

  private handleError(error: unknown, context: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`${context}:`);
      console.error(`Status: ${axiosError.response?.status}`);
      console.error(`Data:`, axiosError.response?.data);
    } else {
      console.error(`${context}:`, (error as Error).message);
    }
  }
}
