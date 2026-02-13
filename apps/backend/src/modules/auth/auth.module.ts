import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { MfaService } from './services/mfa.service';
import { AuthController } from './controllers/auth.controller';
import { MfaController } from './controllers/mfa.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController, MfaController],
  providers: [AuthService, MfaService, JwtAuthGuard],
  exports: [AuthService, MfaService, JwtAuthGuard],
})
export class AuthModule {}
