import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class PasswordValidationService {
  constructor(private prisma: PrismaService) {}

  async validatePassword(
    password: string,
    organizationId?: string
  ): Promise<PasswordValidationResult> {
    const errors: string[] = [];

    // Get organization password policy (or use defaults)
    let policy = null;
    if (organizationId) {
      policy = await this.prisma.passwordPolicy.findUnique({
        where: { organizationId },
      });
    }

    // Use defaults if no policy found
    const minLength = policy?.minLength || 8;
    const requireUppercase = policy?.requireUppercase ?? true;
    const requireLowercase = policy?.requireLowercase ?? true;
    const requireNumbers = policy?.requireNumbers ?? true;
    const requireSymbols = policy?.requireSymbols ?? true;

    // Validate minimum length
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    // Validate uppercase
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Validate lowercase
    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Validate numbers
    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Validate symbols
    if (requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check common passwords (top 100)
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey',
      'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master',
      'sunshine', 'ashley', 'bailey', 'passw0rd', 'shadow', 'superman',
      '123123', 'password1', 'Password1', 'qwertyuiop'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async validatePasswordHistory(
    userId: string,
    newPassword: string,
    organizationId?: string
  ): Promise<boolean> {
    // TODO: Implement password history checking
    // For now, return true (no history conflict)
    return true;
  }
}
