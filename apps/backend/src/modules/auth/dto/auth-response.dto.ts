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

  // MFA challenge fields (set when mfaRequired=true, tokens omitted)
  mfaRequired?: boolean;
  mfaToken?: string;
}
