import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import { PolicyService } from './policy.service';
import { CreatePolicyDto, UpdatePolicyDto, EvaluatePolicyDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../organization/guards/org-context.guard';
import { RbacGuard, RequirePermission } from '../rbac/rbac.guard';

@Controller('organizations/:orgId/policies')
@UseGuards(JwtAuthGuard, OrgContextGuard, RbacGuard)
export class PolicyController {
  constructor(private policyService: PolicyService) { }

  /**
   * POST /api/v1/organizations/:orgId/policies
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('policies:create')
  async create(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Body() dto: CreatePolicyDto,
  ) {
    return this.policyService.create(orgId, req.user.id, {
      name: dto.name,
      description: dto.description,
      effect: dto.effect as any,
      resource: dto.resource,
      actions: dto.actions,
      conditions: dto.conditions,
      priority: dto.priority,
      enabled: dto.enabled,
      type: dto.type,
      rules: dto.rules,
    });
  }

  /**
   * GET /api/v1/organizations/:orgId/policies
   */
  @Get()
  @RequirePermission('policies:read')
  async findAll(@Request() req: any, @Param('orgId') orgId: string, @Query('type') type?: string) {
    return this.policyService.findAll(orgId, req.user.id, type);
  }

  /**
   * GET /api/v1/organizations/:orgId/policies/password
   */
  @Get('password')
  @RequirePermission('policies:read')
  async getPasswordPolicy(@Request() req: any, @Param('orgId') orgId: string) {
    return this.policyService.getPasswordPolicy(orgId, req.user.id);
  }

  /**
   * PUT /api/v1/organizations/:orgId/policies/password
   */
  @Put('password')
  @RequirePermission('policies:update')
  async updatePasswordPolicy(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Body() body: any,
  ) {
    return this.policyService.updatePasswordPolicy(orgId, req.user.id, body);
  }

  /**
   * GET /api/v1/organizations/:orgId/policies/:policyId
   */
  @Get(':policyId')
  @RequirePermission('policies:read')
  async findOne(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Param('policyId') policyId: string,
  ) {
    return this.policyService.findOne(orgId, policyId, req.user.id);
  }

  /**
   * PUT /api/v1/organizations/:orgId/policies/:policyId
   */
  @Put(':policyId')
  @RequirePermission('policies:update')
  async update(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Param('policyId') policyId: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.policyService.update(orgId, policyId, req.user.id, dto as any);
  }

  /**
   * DELETE /api/v1/organizations/:orgId/policies/:policyId
   */
  @Delete(':policyId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('policies:delete')
  async delete(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Param('policyId') policyId: string,
  ) {
    return this.policyService.delete(orgId, policyId, req.user.id);
  }

  /**
   * POST /api/v1/organizations/:orgId/policies/evaluate
   * Test policy evaluation
   */
  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('policies:read')
  async evaluate(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Body() dto: EvaluatePolicyDto,
  ) {
    return this.policyService.evaluate(orgId, {
      userId: dto.userId || req.user.id,
      agentId: dto.agentId,
      resource: dto.resource,
      action: dto.action,
      context: dto.context,
    });
  }
}
