import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './services/auth.service';
import { MfaService } from './services/mfa.service';
import { PasswordValidationService } from './services/password-validation.service';
import { AuthController } from './controllers/auth.controller';
import { MfaController } from './controllers/mfa.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        name: 'auth-login',
        ttl: 60000, // 1 minute
        limit: 5, // 5 attempts per minute per IP+email
      },
      {
        name: 'auth-magic-link',
        ttl: 300000, // 5 minutes
        limit: 3, // 3 magic link requests per 5 minutes
      },
      {
        name: 'auth-password-reset',
        ttl: 900000, // 15 minutes
        limit: 3, // 3 password reset requests per 15 minutes
      },
    ]),
  ],
  controllers: [AuthController, MfaController],
  providers: [AuthService, MfaService, PasswordValidationService, JwtAuthGuard, AuthRateLimitGuard],
  exports: [AuthService, MfaService, PasswordValidationService, JwtAuthGuard],
})
export class AuthModule {}
