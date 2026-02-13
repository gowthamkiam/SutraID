jest.setTimeout(30000);

process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-purposes';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.RESEND_API_KEY = 'test-resend-api-key';
process.env.FRONTEND_URL = 'http://localhost:3001';
process.env.EMAIL_FROM = 'test@example.com';
process.env.NODE_ENV = 'test';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  })),
}));
