import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'SutraID Backend API',
      version: '0.1.0',
    };
  }

  getWelcome() {
    return {
      message: 'Welcome to SutraID - AI-native CIAM Platform',
      description: 'The only authentication system built for both humans AND AI agents',
      documentation: '/api/v1/docs',
      health: '/api/v1/health',
    };
  }
}
