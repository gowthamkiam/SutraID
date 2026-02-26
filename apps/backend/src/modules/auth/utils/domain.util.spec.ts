import { extractDomainFromEmail, isFreeEmailProvider } from './domain.util';

describe('Domain Utilities', () => {
  describe('extractDomainFromEmail', () => {
    it('should extract domain from email', () => {
      expect(extractDomainFromEmail('user@example.com')).toBe('example.com');
      expect(extractDomainFromEmail('admin@acme.org')).toBe('acme.org');
      expect(extractDomainFromEmail('founder@startup.io')).toBe('startup.io');
    });

    it('should handle subdomains', () => {
      expect(extractDomainFromEmail('user@mail.company.com')).toBe('mail.company.com');
      expect(extractDomainFromEmail('admin@internal.corp.example.com')).toBe('internal.corp.example.com');
    });

    it('should return lowercase domain', () => {
      expect(extractDomainFromEmail('user@EXAMPLE.COM')).toBe('example.com');
      expect(extractDomainFromEmail('user@Example.Com')).toBe('example.com');
    });

    it('should handle edge cases', () => {
      expect(extractDomainFromEmail('user@localhost')).toBe('localhost');
      expect(extractDomainFromEmail('')).toBe('');
      expect(extractDomainFromEmail('invalid-email')).toBe('');
      expect(extractDomainFromEmail('@domain.com')).toBe('domain.com');
    });

    it('should trim whitespace', () => {
      expect(extractDomainFromEmail('user@example.com ')).toBe('example.com');
      expect(extractDomainFromEmail(' user@example.com')).toBe('example.com');
    });
  });

  describe('isFreeEmailProvider', () => {
    it('should identify common free email providers', () => {
      expect(isFreeEmailProvider('gmail.com')).toBe(true);
      expect(isFreeEmailProvider('yahoo.com')).toBe(true);
      expect(isFreeEmailProvider('outlook.com')).toBe(true);
      expect(isFreeEmailProvider('hotmail.com')).toBe(true);
      expect(isFreeEmailProvider('icloud.com')).toBe(true);
      expect(isFreeEmailProvider('protonmail.com')).toBe(true);
    });

    it('should return false for corporate domains', () => {
      expect(isFreeEmailProvider('acme.com')).toBe(false);
      expect(isFreeEmailProvider('company.org')).toBe(false);
      expect(isFreeEmailProvider('corporate.io')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isFreeEmailProvider('GMAIL.COM')).toBe(true);
      expect(isFreeEmailProvider('Gmail.com')).toBe(true);
      expect(isFreeEmailProvider('GmAiL.CoM')).toBe(true);
    });

    it('should handle whitespace', () => {
      expect(isFreeEmailProvider(' gmail.com ')).toBe(true);
      expect(isFreeEmailProvider('gmail.com ')).toBe(true);
    });

    it('should handle empty strings', () => {
      expect(isFreeEmailProvider('')).toBe(false);
    });
  });
});
