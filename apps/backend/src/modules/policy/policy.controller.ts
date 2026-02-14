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
} from '@nestjs/common';
import { PolicyService } from './policy.service';
import { CreatePolicyDto, UpdatePolicyDto, EvaluatePolicyDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('organizations/:orgId/policies')
@UseGuards(JwtAuthGuard)
export class PolicyController {
  constructor(private policyService: PolicyService) { }

  /**
   * POST /api/v1/organizations/:orgId/policies
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreatePolicyDto,
  ) {
    return this.policyService.create(orgId, {
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
  async findAll(@Param('orgId') orgId: string, @Query('type') type?: string) {
    return this.policyService.findAll(orgId, type);
  }

  /**
   * GET /api/v1/organizations/:orgId/policies/password
   */
  @Get('password')
  async getPasswordPolicy(@Param('orgId') orgId: string) {
    return this.policyService.getPasswordPolicy(orgId);
  }

  /**
   * PUT /api/v1/organizations/:orgId/policies/password
   */
  @Put('password')
  async updatePasswordPolicy(
    @Param('orgId') orgId: string,
    @Body() body: any,
  ) {
    return this.policyService.updatePasswordPolicy(orgId, body);
  }

  /**
   * GET /api/v1/organizations/:orgId/policies/:policyId
   */
  @Get(':policyId')
  async findOne(
    @Param('orgId') orgId: string,
    @Param('policyId') policyId: string,
  ) {
    return this.policyService.findOne(orgId, policyId);
  }

  /**
   * PUT /api/v1/organizations/:orgId/policies/:policyId
   */
  @Put(':policyId')
  async update(
    @Param('orgId') orgId: string,
    @Param('policyId') policyId: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.policyService.update(orgId, policyId, dto as any);
  }

  /**
   * DELETE /api/v1/organizations/:orgId/policies/:policyId
   */
  @Delete(':policyId')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('orgId') orgId: string,
    @Param('policyId') policyId: string,
  ) {
    return this.policyService.delete(orgId, policyId);
  }

  /**
   * POST /api/v1/organizations/:orgId/policies/evaluate
   * Test policy evaluation
   */
  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  async evaluate(
    @Param('orgId') orgId: string,
    @Body() dto: EvaluatePolicyDto,
  ) {
    return this.policyService.evaluate(orgId, {
      userId: dto.userId,
      agentId: dto.agentId,
      resource: dto.resource,
      action: dto.action,
      context: dto.context,
    });
  }
}
