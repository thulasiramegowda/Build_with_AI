import { Router, Request, Response } from 'express';
import { config } from '../config';
import { githubService } from '../services/githubService';
import { sessionStore } from '../services/sessionStore';

const router = Router();

export function getSessionToken(req: Request): string | undefined {
  // 1. Primary: Server-managed secure HttpOnly cookie
  if (req.cookies && req.cookies[config.session.cookieName]) {
    return req.cookies[config.session.cookieName];
  }

  // 2. Secondary: Authorization: Bearer <token> (for programmatic API requests/unit tests)
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }

  // Tokens via query parameters are explicitly disallowed to prevent token leakage via referer/history
  return undefined;
}

// GET /api/auth/status — Truthful auth status
router.get('/status', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = await sessionStore.getSessionAsync(token);

  if (session) {
    return res.json({
      authenticated: true,
      mode: 'github',
      user: session.user,
      githubConfigured: true,
      geminiConfigured: Boolean(config.geminiApiKey),
      permissions: [
        'repo:read (Repository code and AST tree ingestion)',
        'pull_requests:read (Pull request unified diff review)',
      ],
    });
  }

  // Not authenticated
  res.json({
    authenticated: false,
    mode: sessionStore.isDemoModeActive() ? 'demo' : 'unauthenticated',
    user: null,
    githubConfigured: githubService.isConfigured(),
    geminiConfigured: Boolean(config.geminiApiKey),
    isDemoModeActive: sessionStore.isDemoModeActive(),
    setupRequired: !githubService.isConfigured() ? {
      message: 'GitHub App / OAuth App credentials not yet configured.',
      requiredEnvVars: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
      callbackUrl: config.github.callbackUrl,
    } : null,
  });
});

// GET /api/auth/github — Start GitHub OAuth
router.get('/github', (req: Request, res: Response) => {
  if (!githubService.isConfigured()) {
    return res.status(400).json({
      error: 'GitHub OAuth is not configured on the server.',
      message: 'To enable live GitHub authentication, register an OAuth App on GitHub and add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to your .env file.',
      setupHelp: {
        step1: 'Visit https://github.com/settings/developers',
        step2: 'Click "New OAuth App"',
        step3: `Set Authorization callback URL to: ${config.github.callbackUrl}`,
        step4: 'Copy Client ID and Client Secret into .env',
      }
    });
  }

  const state = sessionStore.createOAuthState();
  const url = githubService.getAuthorizationUrl(state);
  res.redirect(url);
});

// GET /api/auth/github/callback — OAuth Callback (Secure HttpOnly cookie, no URL token leak)
router.get('/github/callback', async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.redirect(`${config.clientUrl}/?auth_error=${encodeURIComponent(String(error_description || error))}`);
  }

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    return res.redirect(`${config.clientUrl}/?auth_error=missing_code_or_state`);
  }

  if (!sessionStore.verifyOAuthState(state)) {
    return res.redirect(`${config.clientUrl}/?auth_error=invalid_or_expired_state`);
  }

  try {
    const accessToken = await githubService.exchangeCodeForToken(code);
    const user = await githubService.fetchUserProfile(accessToken);
    const sessionToken = sessionStore.createSession(user, accessToken);

    // Set secure server-managed HttpOnly cookie
    res.cookie(config.session.cookieName, sessionToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: config.session.ttlMs,
      path: '/',
    });

    // Clean redirection without passing session token in query string
    res.redirect(`${config.clientUrl}/?auth=success`);
  } catch (err: any) {
    console.error('GitHub authentication failed:', err);
    res.redirect(`${config.clientUrl}/?auth_error=${encodeURIComponent(err.message || 'auth_failed')}`);
  }
});

// POST /api/auth/logout — Invalidates session and clears HttpOnly cookie
router.post('/logout', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  sessionStore.destroySession(token);

  res.clearCookie(config.session.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
  });

  res.json({ success: true, message: 'Signed out successfully' });
});

// POST /api/auth/demo-toggle — Explicit demo fixture exploration
router.post('/demo-toggle', (req: Request, res: Response) => {
  const { enable } = req.body;
  const newStatus = enable !== undefined ? Boolean(enable) : !sessionStore.isDemoModeActive();
  sessionStore.setDemoModeActive(newStatus);
  res.json({
    success: true,
    isDemoModeActive: sessionStore.isDemoModeActive(),
    message: newStatus 
      ? 'Demo Mode enabled. Offline sample fixture (KrishiSetu) is now available for evaluation.'
      : 'Demo Mode disabled.'
  });
});

export default router;
