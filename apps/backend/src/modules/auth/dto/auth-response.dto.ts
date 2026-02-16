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
  };

  // Organization info (set after successful login)
  organization?: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };

  // MFA challenge fields (set when mfaRequired=true, tokens omitted)
  mfaRequired?: boolean;
  mfaToken?: string;
}
