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

@Controller('policies')
@UseGuards(JwtAuthGuard, OrgContextGuard, RbacGuard)
export class PolicyController {
  constructor(private policyService: PolicyService) { }

  /**
   * POST /api/v1/policies
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('policies:create')
  async create(
    @Request() req: any,
    @Body() dto: CreatePolicyDto,
  ) {
    return this.policyService.create(req.user.id, {
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
   * GET /api/v1/policies
   */
  @Get()
  @RequirePermission('policies:read')
  async findAll(@Query('type') type?: string) {
    return this.policyService.findAll(type);
  }

  /**
   * GET /api/v1/policies/password
   */
  @Get('password')
  @RequirePermission('policies:read')
  async getPasswordPolicy() {
    return this.policyService.getPasswordPolicy();
  }

  /**
   * PUT /api/v1/policies/password
   */
  @Put('password')
  @RequirePermission('policies:update')
  async updatePasswordPolicy(
    @Body() body: any,
  ) {
    return this.policyService.updatePasswordPolicy(body);
  }

  /**
   * GET /api/v1/policies/:policyId
   */
  @Get(':policyId')
  @RequirePermission('policies:read')
  async findOne(
    @Param('policyId') policyId: string,
  ) {
    return this.policyService.findOne(policyId);
  }

  /**
   * PUT /api/v1/policies/:policyId
   */
  @Put(':policyId')
  @RequirePermission('policies:update')
  async update(
    @Param('policyId') policyId: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.policyService.update(policyId, dto as any);
  }

  /**
   * DELETE /api/v1/policies/:policyId
   */
  @Delete(':policyId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('policies:delete')
  async delete(
    @Param('policyId') policyId: string,
  ) {
    return this.policyService.delete(policyId);
  }

  /**
   * POST /api/v1/policies/evaluate
   * Test policy evaluation
   */
  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('policies:read')
  async evaluate(
    @Request() req: any,
    @Body() dto: EvaluatePolicyDto,
  ) {
    return this.policyService.evaluate({
      userId: dto.userId || req.user.id,
      agentId: dto.agentId,
      resource: dto.resource,
      action: dto.action,
      context: dto.context,
    });
  }
}
