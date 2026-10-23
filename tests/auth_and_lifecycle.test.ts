import { describe, it, expect, beforeEach } from 'vitest';
import { sessionStore } from '../server/src/services/sessionStore';
import { getSessionToken } from '../server/src/routes/auth';
import { UserProfile } from '../server/src/types';
import app from '../server/src/index';

describe('CodePulse Authentication & Repository Lifecycle', () => {
  const mockUser: UserProfile = {
    id: 'gh-12345',
    login: 'test-developer',
    name: 'Test Developer',
    avatarUrl: 'https://avatars.githubusercontent.com/u/12345?v=4',
    email: 'test@example.com',
    htmlUrl: 'https://github.com/test-developer',
  };

  beforeEach(() => {
    sessionStore.clearAllSessions();
  });

  it('generates single-use cryptographically secure OAuth CSRF state nonces', () => {
    const state = sessionStore.createOAuthState();
    expect(state).toBeDefined();
    expect(state.length).toBe(48); // 24 bytes hex

    // Verification succeeds on first attempt
    const isValid = sessionStore.verifyOAuthState(state);
    expect(isValid).toBe(true);

    // Replay attack / second verification must fail
    const isReplayValid = sessionStore.verifyOAuthState(state);
    expect(isReplayValid).toBe(false);
  });

  it('manages authenticated in-memory sessions truthfully', () => {
    const sessionToken = sessionStore.createSession(mockUser, 'gho_mock_access_token');
    expect(sessionToken).toBeDefined();
    expect(sessionToken.length).toBe(64); // 32 bytes hex

    // Retrieve active session
    const session = sessionStore.getSession(sessionToken);
    expect(session).toBeDefined();
    expect(session?.user.login).toBe('test-developer');
    expect(session?.accessToken).toBe('gho_mock_access_token');
    expect(session?.expiresAt).toBeGreaterThan(Date.now());

    // Destroy session upon logout
    sessionStore.destroySession(sessionToken);
    const destroyedSession = sessionStore.getSession(sessionToken);
    expect(destroyedSession).toBeNull();
  });

  it('enforces TTL expiration on sessions', async () => {
    // Create session with 2ms TTL
    const sessionToken = sessionStore.createSession(mockUser, 'gho_mock_access_token', 2);
    expect(sessionStore.getSession(sessionToken)).toBeDefined();

    // Wait 15ms for expiration
    await new Promise(resolve => setTimeout(resolve, 15));

    expect(sessionStore.getSession(sessionToken)).toBeNull();
  });

  it('extracts session token from HttpOnly cookie and rejects query parameter leaks', () => {
    // 1. From HttpOnly cookie
    const reqWithCookie: any = {
      cookies: { codepulse_session: 'token-from-secure-cookie' },
      headers: {},
      query: {},
    };
    expect(getSessionToken(reqWithCookie)).toBe('token-from-secure-cookie');

    // 2. From Authorization Bearer header
    const reqWithHeader: any = {
      cookies: {},
      headers: { authorization: 'Bearer token-from-bearer' },
      query: {},
    };
    expect(getSessionToken(reqWithHeader)).toBe('token-from-bearer');

    // 3. Rejects token passed via query parameter (prevents referer/history leaks)
    const reqWithQueryToken: any = {
      cookies: {},
      headers: {},
      query: { token: 'leaked-token-in-url' },
    };
    expect(getSessionToken(reqWithQueryToken)).toBeUndefined();
  });

  it('enforces strict demo mode isolation (never active by default)', () => {
    expect(sessionStore.isDemoModeActive()).toBe(false);

    sessionStore.setDemoModeActive(true);
    expect(sessionStore.isDemoModeActive()).toBe(true);

    sessionStore.setDemoModeActive(false);
    expect(sessionStore.isDemoModeActive()).toBe(false);
  });

  it('rejects invalid or expired session tokens', () => {
    expect(sessionStore.getSession(undefined)).toBeNull();
    expect(sessionStore.getSession('non-existent-token-xyz')).toBeNull();
  });
});
