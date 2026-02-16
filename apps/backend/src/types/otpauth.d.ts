declare module 'otpauth' {
  export class Secret {
    constructor(options?: { size?: number });
    static fromBase32(value: string): Secret;
    base32: string;
    toString(): string;
  }

  export namespace TOTP {
    interface Options {
      issuer?: string;
      label?: string;
      algorithm?: string;
      digits?: number;
      period?: number;
      secret?: Secret;
    }
  }

  export class TOTP {
    constructor(options: TOTP.Options);
    generate(): string;
    validate(options: { token: string; window?: number }): number | null;
    toString(): string;
    secret: Secret;
  }
}
