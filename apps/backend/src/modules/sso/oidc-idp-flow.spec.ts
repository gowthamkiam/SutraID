/**
 * OIDC IdP Token Validation & PKCE Flow Tests
 *
 * Pure jose-based tests — no NestJS dependencies.
 * Validates JWT signing, claims, expiration, audience/issuer checks,
 * and defends against alg=none attacks.
 */
import * as jose from 'jose';
import * as crypto from 'crypto';

describe('OIDC IdP Token Validation Flow', () => {
  let publicKey: jose.KeyLike;
  let privateKey: jose.KeyLike;
  let wrongPrivateKey: jose.KeyLike;

  const TEST_ISSUER = 'http://localhost:3000/api/v1/sso/oidc-idp/22843968-59d7-4488-9ef2-f9f720945b57';
  const TEST_CLIENT_ID = 'app_4b66113d6d7fd374183c94837d306fcf';
  const TEST_USER_ID = 'usr_a1b2c3d4e5f6';
  const TEST_NONCE = 'test-nonce-123';

  beforeAll(async () => {
    const kp = await jose.generateKeyPair('RS256');
    publicKey = kp.publicKey;
    privateKey = kp.privateKey;

    const wrongKp = await jose.generateKeyPair('RS256');
    wrongPrivateKey = wrongKp.privateKey;
  });

  // Helper to build a signed id_token with optional claim overrides
  async function buildIdToken(
    overrides: Record<string, unknown> = {},
    alg = 'RS256',
    key: jose.KeyLike = privateKey,
  ): Promise<string> {
    const claims: Record<string, unknown> = {
      sub: TEST_USER_ID,
      email: 'test@example.com',
      iss: TEST_ISSUER,
      aud: TEST_CLIENT_ID,
      nonce: TEST_NONCE,
      ...overrides,
    };
    return new jose.SignJWT(claims as jose.JWTPayload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(key);
  }

  // ── Positive ──────────────────────────────────────────────────────────

  describe('positive - valid token claims', () => {
    it('should verify a correctly signed id_token with all standard claims', async () => {
      const jwt = await buildIdToken();
      const { payload } = await jose.jwtVerify(jwt, publicKey, {
        issuer: TEST_ISSUER,
        audience: TEST_CLIENT_ID,
      });

      expect(payload.sub).toBe(TEST_USER_ID);
      expect(payload.email).toBe('test@example.com');
      expect(payload.iss).toBe(TEST_ISSUER);
      expect(payload.aud).toBe(TEST_CLIENT_ID);
      expect(payload.nonce).toBe(TEST_NONCE);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
      expect(payload.exp! - payload.iat!).toBe(3600);
    });

    it('should verify token with ES256 algorithm', async () => {
      const esKp = await jose.generateKeyPair('ES256');
      const jwt = await buildIdToken({}, 'ES256', esKp.privateKey);
      const { payload } = await jose.jwtVerify(jwt, esKp.publicKey, {
        issuer: TEST_ISSUER,
        audience: TEST_CLIENT_ID,
      });
      expect(payload.sub).toBe(TEST_USER_ID);
    });
  });

  // ── Negative ──────────────────────────────────────────────────────────

  describe('negative - token rejection', () => {
    it('should reject token signed with wrong key', async () => {
      const jwt = await buildIdToken({}, 'RS256', wrongPrivateKey);
      await expect(
        jose.jwtVerify(jwt, publicKey, { issuer: TEST_ISSUER, audience: TEST_CLIENT_ID }),
      ).rejects.toThrow();
    });

    it('should reject expired token', async () => {
      const jwt = await new jose.SignJWT({
        sub: TEST_USER_ID,
        iss: TEST_ISSUER,
        aud: TEST_CLIENT_ID,
      } as jose.JWTPayload)
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
        .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
        .sign(privateKey);

      await expect(
        jose.jwtVerify(jwt, publicKey, { issuer: TEST_ISSUER, audience: TEST_CLIENT_ID }),
      ).rejects.toThrow();
    });

    it('should reject token with wrong issuer', async () => {
      const jwt = await buildIdToken({ iss: 'https://evil.example.com' });
      await expect(
        jose.jwtVerify(jwt, publicKey, { issuer: TEST_ISSUER, audience: TEST_CLIENT_ID }),
      ).rejects.toThrow();
    });

    it('should reject token with wrong audience', async () => {
      const jwt = await buildIdToken({ aud: 'wrong-client-id' });
      await expect(
        jose.jwtVerify(jwt, publicKey, { issuer: TEST_ISSUER, audience: TEST_CLIENT_ID }),
      ).rejects.toThrow();
    });

    it('should detect missing sub claim', async () => {
      const jwt = await new jose.SignJWT({
        iss: TEST_ISSUER,
        aud: TEST_CLIENT_ID,
        email: 'test@example.com',
      } as jose.JWTPayload)
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey);

      const { payload } = await jose.jwtVerify(jwt, publicKey, {
        issuer: TEST_ISSUER,
        audience: TEST_CLIENT_ID,
      });
      // jose verifies signature/exp/iss/aud but does not enforce sub —
      // application-level validation must reject this.
      expect(payload.sub).toBeUndefined();
    });

    it('should detect missing email claim', async () => {
      const jwt = await buildIdToken({ email: undefined });
      const { payload } = await jose.jwtVerify(jwt, publicKey, {
        issuer: TEST_ISSUER,
        audience: TEST_CLIENT_ID,
      });
      expect(payload.email).toBeUndefined();
    });

    it('should detect missing nonce claim', async () => {
      const jwt = await buildIdToken({ nonce: undefined });
      const { payload } = await jose.jwtVerify(jwt, publicKey, {
        issuer: TEST_ISSUER,
        audience: TEST_CLIENT_ID,
      });
      expect(payload.nonce).toBeUndefined();
    });

    it('should reject alg=none attack (unsigned token)', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        sub: TEST_USER_ID,
        iss: TEST_ISSUER,
        aud: TEST_CLIENT_ID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })).toString('base64url');
      const unsignedJwt = `${header}.${payload}.`;

      await expect(
        jose.jwtVerify(unsignedJwt, publicKey, { issuer: TEST_ISSUER, audience: TEST_CLIENT_ID }),
      ).rejects.toThrow();
    });

    it('should reject token issued for a different client', async () => {
      const jwt = await buildIdToken({ aud: 'app_different_client_id' });
      await expect(
        jose.jwtVerify(jwt, publicKey, { issuer: TEST_ISSUER, audience: TEST_CLIENT_ID }),
      ).rejects.toThrow();
    });
  });

  // ── PKCE ──────────────────────────────────────────────────────────────

  describe('PKCE code_challenge validation (S256)', () => {
    it('should produce matching code_challenge for a given code_verifier', () => {
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      // Re-compute and verify deterministic
      const recomputed = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');
      expect(codeChallenge).toBe(recomputed);

      // Challenge must differ from verifier (it's a one-way hash)
      expect(codeChallenge).not.toBe(codeVerifier);
    });

    it('should fail when wrong verifier is used', () => {
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      const wrongVerifier = crypto.randomBytes(32).toString('base64url');
      const wrongChallenge = crypto
        .createHash('sha256')
        .update(wrongVerifier)
        .digest('base64url');

      expect(codeChallenge).not.toBe(wrongChallenge);
    });

    it('should produce a 43-character base64url-encoded challenge', () => {
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      // SHA-256 output is 32 bytes → 43 chars in base64url (no padding)
      expect(codeChallenge).toHaveLength(43);
      expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });
});
