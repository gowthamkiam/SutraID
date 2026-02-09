// Shared types for SutraID platform

// User types
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Auth types
export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface MagicLinkRequest {
  email: string;
}

export interface VerifyMagicLinkRequest {
  token: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Agent types (for AI-native features - Phase 2)
export interface Agent {
  id: string;
  agentType: 'MCP_SERVER' | 'SERVICE_ACCOUNT' | 'BOT' | 'INTEGRATION' | 'AI_ASSISTANT';
  agentName: string;
  clientId: string;
  scopes: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  createdAt: Date;
}

export interface DelegationChain {
  chain: string[]; // Array of user_id/agent_id
  depth: number;
  maxDepth: number;
}
