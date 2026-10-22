import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback to local server/.env

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  github: {
    appId: process.env.GITHUB_APP_ID || '',
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    privateKey: process.env.GITHUB_PRIVATE_KEY || '',
  },
  isDemoMode: !process.env.GITHUB_CLIENT_ID,
};
