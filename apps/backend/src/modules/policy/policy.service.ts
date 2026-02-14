import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PolicyEffect } from '@prisma/client';

export interface EvaluationContext {
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
  geoLocation?: string;
  [key: string]: any;
}

export interface EvaluationResult {
  decision: 'ALLOW' | 'DENY';
  matchedPolicy?: {
    id: string;
    name: string;
    effect: PolicyEffect;
    priority: number;
  };
  reason: string;
}

@Injectable()
export class PolicyService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) { }

  async ensureDefaults(organizationId: string) {
    // 0. Ensure Organization exists (for demo purposes)
    // In a real app, this would likely throw, but for the demo we auto-seed correctly.
    const orgExists = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!orgExists) {
      if (organizationId === 'org_sutraid_enterprise_demo') {
        await this.prisma.organization.create({
          data: {
            id: organizationId,
            name: 'SutraID Enterprise Demo',
            slug: 'sutraid-demo',
            domain: 'demo.sutraid.com',
          }
        });
      } else {
        // If it's a random ID that doesn't exist, we can't create policies for it.
        // We'll let it fail or throw a clearer error, but the FK constraint is technically correct.
        throw new NotFoundException(`Organization ${organizationId} not found`);
      }
    }

    // 1. Ensure Password Policy exists
    // Use upsert to handle race conditions where multiple requests try to create it simultaneously
    await this.prisma.passwordPolicy.upsert({
      where: { organizationId },
      create: {
        organizationId,
        // Default secure settings
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true,
        lockoutThreshold: 5,
        lockoutDuration: 30,
      },
      update: {}, // No-op if it exists
    });

    // 2. Ensure Default Sign-on Policy exists
    const signOnPolicy = await this.prisma.policy.findFirst({
      where: {
        organizationId,
        type: 'SIGN_ON',
        name: 'Default Sign-on Policy',
      },
    });

    if (!signOnPolicy) {
      await this.create(organizationId, {
        name: 'Default Sign-on Policy',
        description: 'Default authentication rules for all users',
        effect: 'ALLOW',
        resource: 'auth:login',
        actions: ['login'],
        priority: 0,
        enabled: true,
        // @ts-ignore - Create DTO mismatch with internal helper
        type: 'SIGN_ON',
        rules: [
          {
            id: 'default_rule',
            name: 'Catch-all',
            conditions: { group: 'Everyone' },
            requirement: 'MFA_OPTIONAL',
            priority: 999
          }
        ]
      });
    }
  }

  /**
   * Create a new policy
   */
  async create(organizationId: string, data: {
    name: string;
    description?: string;
    effect?: PolicyEffect;
    resource: string;
    actions: string[];
    conditions?: Record<string, any>;
    priority?: number;
    enabled?: boolean;
    type?: 'ACCESS' | 'SIGN_ON' | 'MFA' | 'PASSWORD';
    rules?: any[];
  }) {
    // @ts-ignore
    return this.prisma.policy.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        effect: data.effect || 'ALLOW',
        type: data.type || 'ACCESS',
        resource: data.resource,
        actions: data.actions,
        conditions: data.conditions || {},
        rules: data.rules || [],
        priority: data.priority || 0,
        enabled: data.enabled !== false,
      },
    });
  }

  /**
   * List all policies for an organization
   */
  async findAll(organizationId: string, type?: string) {
    await this.ensureDefaults(organizationId);
    return this.prisma.policy.findMany({
      where: {
        organizationId,
        ...(type ? { type: type as any } : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get Password Policy
   */
  async getPasswordPolicy(organizationId: string) {
    await this.ensureDefaults(organizationId);
    return this.prisma.passwordPolicy.findUniqueOrThrow({
      where: { organizationId },
    });
  }

  /**
   * Update Password Policy
   */
  async updatePasswordPolicy(organizationId: string, data: any) {
    await this.ensureDefaults(organizationId);
    return this.prisma.passwordPolicy.update({
      where: { organizationId },
      data: {
        minLength: data.minLength,
        requireUppercase: data.requireUppercase,
        requireLowercase: data.requireLowercase,
        requireNumbers: data.requireNumbers,
        requireSymbols: data.requireSymbols,
        lockoutThreshold: data.lockoutThreshold,
        lockoutDuration: data.lockoutDuration,
      },
    });
  }

  /**
   * Get a single policy
   */
  async findOne(organizationId: string, policyId: string) {
    const policy = await this.prisma.policy.findFirst({
      where: { id: policyId, organizationId },
    });
    if (!policy) throw new NotFoundException('Policy not found');
    return policy;
  }

  /**
   * Update a policy
   */
  async update(organizationId: string, policyId: string, data: {
    name?: string;
    description?: string;
    effect?: PolicyEffect;
    resource?: string;
    actions?: string[];
    conditions?: Record<string, any>;
    priority?: number;
    enabled?: boolean;
  }) {
    await this.findOne(organizationId, policyId);
    return this.prisma.policy.update({
      where: { id: policyId },
      data,
    });
  }

  /**
   * Delete a policy
   */
  async delete(organizationId: string, policyId: string) {
    await this.findOne(organizationId, policyId);
    await this.prisma.policy.delete({ where: { id: policyId } });
    return { message: 'Policy deleted successfully' };
  }

  /**
   * Evaluate policies for a request
   * Uses deny-override: if any DENY policy matches, the result is DENY
   */
  async evaluate(
    organizationId: string,
    params: {
      userId?: string;
      agentId?: string;
      resource: string;
      action: string;
      context?: EvaluationContext;
    },
  ): Promise<EvaluationResult> {
    const policies = await this.prisma.policy.findMany({
      where: {
        organizationId,
        enabled: true,
      },
      orderBy: { priority: 'desc' },
    });

    let result: EvaluationResult = {
      decision: 'DENY',
      reason: 'No matching policy found (default deny)',
    };

    for (const policy of policies) {
      if (!this.matchesResource(params.resource, policy.resource)) continue;
      if (!policy.actions.includes(params.action) && !policy.actions.includes('*')) continue;
      if (!this.matchesConditions(params.context || {}, policy.conditions as Record<string, any>)) continue;

      // Policy matches
      if (policy.effect === 'DENY') {
        result = {
          decision: 'DENY',
          matchedPolicy: {
            id: policy.id,
            name: policy.name,
            effect: policy.effect,
            priority: policy.priority,
          },
          reason: `Denied by policy: ${policy.name}`,
        };
        break; // Deny-override: first deny wins
      }

      if (policy.effect === 'ALLOW' && result.decision === 'DENY') {
        result = {
          decision: 'ALLOW',
          matchedPolicy: {
            id: policy.id,
            name: policy.name,
            effect: policy.effect,
            priority: policy.priority,
          },
          reason: `Allowed by policy: ${policy.name}`,
        };
      }
    }

    // Log the evaluation
    await this.auditService.log({
      organizationId,
      userId: params.userId,
      agentId: params.agentId,
      action: 'policy.evaluated',
      resource: params.resource,
      result: result.decision === 'ALLOW' ? 'SUCCESS' : 'DENIED',
      metadata: {
        requestedAction: params.action,
        decision: result.decision,
        matchedPolicyId: result.matchedPolicy?.id,
        matchedPolicyName: result.matchedPolicy?.name,
      },
    });

    return result;
  }

  /**
   * Match a resource against a pattern (supports wildcards)
   * e.g., "api:orders:*" matches "api:orders:123"
   */
  private matchesResource(resource: string, pattern: string): boolean {
    if (pattern === '*') return true;

    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex chars except *
      .replace(/\*/g, '.*');

    return new RegExp(`^${regexPattern}$`).test(resource);
  }

  /**
   * Check if context matches policy conditions
   */
  private matchesConditions(
    context: EvaluationContext,
    conditions: Record<string, any>,
  ): boolean {
    if (!conditions || Object.keys(conditions).length === 0) return true;

    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'ipRange':
          if (context.ipAddress && !this.isIpInRange(context.ipAddress, value)) {
            return false;
          }
          break;
        case 'geoLocations':
          if (context.geoLocation && Array.isArray(value) && !value.includes(context.geoLocation)) {
            return false;
          }
          break;
        case 'timeWindow':
          if (!this.isInTimeWindow(value)) {
            return false;
          }
          break;
        default:
          // Generic key-value match
          if (context[key] !== value) return false;
      }
    }

    return true;
  }

  /**
   * Basic IP range check (supports CIDR notation)
   */
  private isIpInRange(ip: string, cidr: string): boolean {
    const [range, bits] = cidr.split('/');
    if (!bits) return ip === range;

    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    const ipNum = this.ipToNum(ip);
    const rangeNum = this.ipToNum(range);

    return (ipNum & mask) === (rangeNum & mask);
  }

  private ipToNum(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  }

  /**
   * Check if current time is within a time window (e.g., "09:00-17:00")
   */
  private isInTimeWindow(window: string): boolean {
    const [start, end] = window.split('-');
    if (!start || !end) return true;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  // ============================================
  // NetworkZone methods
  // ============================================

  async createNetworkZone(organizationId: string, data: {
    name: string;
    description?: string;
    ipRanges: string[];
    geoLocations?: string[];
    trusted?: boolean;
  }) {
    return this.prisma.networkZone.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        ipRanges: data.ipRanges,
        geoLocations: data.geoLocations || [],
        trusted: data.trusted || false,
      },
    });
  }

  async findAllNetworkZones(organizationId: string) {
    return this.prisma.networkZone.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteNetworkZone(organizationId: string, zoneId: string) {
    const zone = await this.prisma.networkZone.findFirst({
      where: { id: zoneId, organizationId },
    });
    if (!zone) throw new NotFoundException('Network zone not found');
    await this.prisma.networkZone.delete({ where: { id: zoneId } });
    return { message: 'Network zone deleted successfully' };
  }

  /**
   * Check if an IP is in any trusted network zone
   */
  async isIpTrusted(organizationId: string, ipAddress: string): Promise<boolean> {
    const zones = await this.prisma.networkZone.findMany({
      where: { organizationId, trusted: true, enabled: true },
    });

    for (const zone of zones) {
      for (const range of zone.ipRanges) {
        if (this.isIpInRange(ipAddress, range)) return true;
      }
    }

    return false;
  }
}
