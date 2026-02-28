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

  async ensureDefaults() {
    await this.prisma.passwordPolicy.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true,
        lockoutThreshold: 5,
        lockoutDuration: 30,
      },
      update: {},
    });

    const signOnPolicy = await this.prisma.policy.findFirst({
      where: {
        type: 'SIGN_ON',
        name: 'Default Sign-on Policy',
      },
    });

    if (!signOnPolicy) {
      await this.create('SYSTEM', {
        name: 'Default Sign-on Policy',
        description: 'Default authentication rules for all users',
        effect: 'ALLOW',
        resource: 'auth:login',
        actions: ['login'],
        priority: 0,
        enabled: true,
        // @ts-ignore
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

  async create(actorId: string, data: {
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
    return this.prisma.policy.create({
      data: {
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

  async findAll(type?: string) {
    return this.prisma.policy.findMany({
      where: {
        ...(type ? { type: type as any } : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getPasswordPolicy() {
    return this.prisma.passwordPolicy.findMany();
  }

  async updatePasswordPolicy(data: any) {
    return this.prisma.passwordPolicy.updateMany({
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

  async findOne(policyId: string) {
    const policy = await this.prisma.policy.findFirst({
      where: { id: policyId },
    });
    if (!policy) throw new NotFoundException('Policy not found');
    return policy;
  }

  async update(policyId: string, data: {
    name?: string;
    description?: string;
    effect?: PolicyEffect;
    resource?: string;
    actions?: string[];
    conditions?: Record<string, any>;
    priority?: number;
    enabled?: boolean;
  }) {
    await this.findOne(policyId);
    return this.prisma.policy.update({
      where: { id: policyId },
      data,
    });
  }

  async delete(policyId: string) {
    await this.findOne(policyId);
    await this.prisma.policy.delete({ where: { id: policyId } });
    return { message: 'Policy deleted successfully' };
  }

  async evaluate(
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
        break;
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

    await this.auditService.log({
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
        ipAddress: params.context?.ipAddress,
        userAgent: params.context?.userAgent,
        geoLocation: params.context?.geoLocation,
      },
    });

    return result;
  }

  private matchesResource(resource: string, pattern: string): boolean {
    if (pattern === '*') return true;

    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');

    return new RegExp(`^${regexPattern}$`).test(resource);
  }

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
          if (context[key] !== value) return false;
      }
    }

    return true;
  }

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

  async createNetworkZone(actorId: string, data: {
    name: string;
    description?: string;
    ipRanges: string[];
    geoLocations?: string[];
    trusted?: boolean;
  }) {
    return this.prisma.networkZone.create({
      data: {
        name: data.name,
        description: data.description,
        ipRanges: data.ipRanges,
        geoLocations: data.geoLocations || [],
        trusted: data.trusted || false,
      },
    });
  }

  async findAllNetworkZones() {
    return this.prisma.networkZone.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteNetworkZone(zoneId: string) {
    const zone = await this.prisma.networkZone.findFirst({
      where: { id: zoneId },
    });
    if (!zone) throw new NotFoundException('Network zone not found');
    await this.prisma.networkZone.delete({ where: { id: zoneId } });
    return { message: 'Network zone deleted successfully' };
  }

  async isIpTrusted(ipAddress: string): Promise<boolean> {
    const zones = await this.prisma.networkZone.findMany({
      where: { trusted: true, enabled: true },
    });

    for (const zone of zones) {
      for (const range of zone.ipRanges) {
        if (this.isIpInRange(ipAddress, range)) return true;
      }
    }

    return false;
  }
}
