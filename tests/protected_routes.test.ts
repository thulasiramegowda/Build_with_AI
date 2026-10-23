import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { sessionStore } from '../server/src/services/sessionStore';
import { UserProfile } from '../server/src/types';

describe('CodePulse Protected Routes & Access Control', () => {
  const mockUser: UserProfile = {
    id: 'gh-456',
    login: 'security-tester',
    name: 'Security Tester',
    avatarUrl: 'https://avatars.githubusercontent.com/u/456',
    email: 'sec@test.org',
    htmlUrl: 'https://github.com/security-tester',
  };

  beforeEach(() => {
    sessionStore.clearAllSessions();
  });

  it('strictly protects repository data from unauthenticated users when Demo Mode is false', async () => {
    // 1. Repos list returns empty array
    const reposRes = await request(app).get('/api/repos');
    expect(reposRes.status).toBe(200);
    expect(reposRes.body).toEqual([]);

    // 2. Repo details returns 401 Unauthorized
    const detailRes = await request(app).get('/api/repos/krishisetu');
    expect(detailRes.status).toBe(401);
    expect(detailRes.body.error).toContain('Unauthorized');

    // 3. Contracts audit returns 401 Unauthorized
    const contractsRes = await request(app).get('/api/contracts/krishisetu');
    expect(contractsRes.status).toBe(401);
    expect(contractsRes.body.error).toContain('Unauthorized');

    // 4. Pull requests returns 401 Unauthorized
    const prsRes = await request(app).get('/api/prs/krishisetu');
    expect(prsRes.status).toBe(401);
    expect(prsRes.body.error).toContain('Unauthorized');

    // 5. Analysis execution returns 401 Unauthorized
    const analyzeRes = await request(app)
      .post('/api/repos/analyze')
      .send({ repoId: 'krishisetu' });
    expect(analyzeRes.status).toBe(401);
  });

  it('allows access to sample fixture when Demo Mode is explicitly enabled', async () => {
    sessionStore.setDemoModeActive(true);

    // 1. Repos list returns KrishiSetu visibly labelled as sample data
    const reposRes = await request(app).get('/api/repos');
    expect(reposRes.status).toBe(200);
    expect(reposRes.body.length).toBe(1);
    expect(reposRes.body[0].id).toBe('krishisetu');
    expect(reposRes.body[0].isFixture).toBe(true);
    expect(reposRes.body[0].description).toContain('Sample Fixture');

    // 2. Details accessible
    const detailRes = await request(app).get('/api/repos/krishisetu');
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.isFixture).toBe(true);

    // 3. Analysis succeeds deterministically
    const analyzeRes = await request(app)
      .post('/api/repos/analyze')
      .send({ repoId: 'krishisetu' });
    expect(analyzeRes.status).toBe(200);
    expect(analyzeRes.body.success).toBe(true);
    expect(analyzeRes.body.analysisStatus).toBe('analyzed');
    expect(analyzeRes.body.metrics.routesCount).toBeGreaterThan(0);
  }, 10000);

  it('authenticates via HttpOnly cookie and invalidates session on logout', async () => {
    // Create an authenticated session
    const sessionToken = sessionStore.createSession(mockUser, 'mock_access_token');

    // Make request sending cookie
    const authStatusRes = await request(app)
      .get('/api/auth/status')
      .set('Cookie', [`codepulse_session=${sessionToken}`]);

    expect(authStatusRes.status).toBe(200);
    expect(authStatusRes.body.authenticated).toBe(true);
    expect(authStatusRes.body.user.login).toBe('security-tester');

    // Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`codepulse_session=${sessionToken}`]);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Verify session is invalidated
    const verifyRes = await request(app)
      .get('/api/auth/status')
      .set('Cookie', [`codepulse_session=${sessionToken}`]);

    expect(verifyRes.body.authenticated).toBe(false);
  });
});
