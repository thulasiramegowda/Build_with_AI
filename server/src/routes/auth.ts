import { Router, Request, Response } from 'express';
import { config } from '../config';

const router = Router();

router.get('/status', (req: Request, res: Response) => {
  res.json({
    authenticated: false,
    mode: config.isDemoMode ? 'demo' : 'github',
    user: config.isDemoMode ? {
      login: 'demo-contributor',
      name: 'Hackathon Reviewer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    } : null,
    githubConfigured: Boolean(config.github.clientId && config.github.clientSecret),
    geminiConfigured: Boolean(config.geminiApiKey),
    permissions: [
      'repo:read (Static analysis)',
      'pull_requests:read (PR diff reviews)',
      'contracts:audit (In-memory contract checking)'
    ],
  });
});

router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Signed out of session' });
});

export default router;
