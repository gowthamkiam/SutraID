export class AuthResponseDto {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType: string = 'Bearer';
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    mustChangePassword?: boolean;
  };

  mfaRequired?: boolean;
  mfaEnrollmentRequired?: boolean;
  mfaToken?: string;
  mustChangePassword?: boolean;
}
