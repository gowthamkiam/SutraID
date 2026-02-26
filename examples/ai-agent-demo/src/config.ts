import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  baseUrl: process.env.SUTRAID_BASE_URL || 'http://localhost:3000',
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
};

export function validateConfig() {
  if (!config.clientId || !config.clientSecret) {
    console.error('Error: CLIENT_ID and CLIENT_SECRET must be set in .env file');
    console.error('Please copy .env.example to .env and configure your credentials');
    process.exit(1);
  }
}
