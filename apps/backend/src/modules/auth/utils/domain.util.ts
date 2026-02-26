const FREE_EMAIL_PROVIDERS = [
  // Google
  'gmail.com',
  'googlemail.com',

  // Microsoft
  'outlook.com',
  'hotmail.com',
  'live.com',

  // Apple
  'icloud.com',
  'me.com',
  'mac.com',

  // Yahoo
  'yahoo.com',
  'yahoo.co.uk',
  'ymail.com',
  'rocketmail.com',

  // Others
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'mail.com',
  'gmx.com',
  'yandex.com',
];

/**
 * Extract domain from email address
 * @param email - Email address
 * @returns Lowercase domain part of email
 */
export function extractDomainFromEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '';
  }

  const parts = email.split('@');
  return parts[1].toLowerCase().trim();
}

/**
 * Check if domain is a free email provider
 * @param domain - Email domain to check
 * @returns True if domain is a free email provider
 */
export function isFreeEmailProvider(domain: string): boolean {
  const normalizedDomain = domain.toLowerCase().trim();
  return FREE_EMAIL_PROVIDERS.includes(normalizedDomain);
}
