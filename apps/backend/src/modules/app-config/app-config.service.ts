import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfig } from '@prisma/client';

@Injectable()
export class AppConfigService {
  constructor(private prisma: PrismaService) { }

  async get(): Promise<AppConfig> {
    let config = await this.prisma.appConfig.findUnique({ where: { id: 'singleton' } });
    if (!config) {
      config = await this.prisma.appConfig.create({ data: { id: 'singleton' } });
    }
    return config;
  }

  async update(data: Partial<Omit<AppConfig, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AppConfig> {
    return this.prisma.appConfig.update({ where: { id: 'singleton' }, data: data as any });
  }

  async getBranding(): Promise<{
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    customLoginConfig: any;
  }> {
    const config = await this.get();
    return {
      name: config.name,
      logoUrl: config.logoUrl,
      primaryColor: config.primaryColor,
      customLoginConfig: config.customLoginConfig,
    };
  }
}
