import crypto from 'crypto';
import { UserProfile } from '../types';
import { config } from '../config';
import { repositoryDao } from '../db/repositoryDao';

export interface SessionData {
  user: UserProfile;
  accessToken: string;
  createdAt: number;
  expiresAt: number;
}

const memorySessions = new Map<string, SessionData>();
const oauthStates = new Map<string, number>();

// Explicit Demo Mode state (only activated when user explicitly chooses it)
let demoModeActive = false;

export const sessionStore = {
  createOAuthState(): string {
    const state = crypto.randomBytes(24).toString('hex');
    oauthStates.set(state, Date.now() + 10 * 60 * 1000); // 10 min TTL
    return state;
  },

  verifyOAuthState(state?: string): boolean {
    if (!state) return false;
    const expires = oauthStates.get(state);
    if (!expires) return false;
    oauthStates.delete(state);
    return Date.now() < expires;
  },

  createSession(user: UserProfile, accessToken: string, ttlMs?: number): string {
    const token = crypto.randomBytes(32).toString('hex');
    const createdAt = Date.now();
    const expiresAt = createdAt + (ttlMs || config.session.ttlMs);

    const session: SessionData = {
      user,
      accessToken,
      createdAt,
      expiresAt,
    };

    memorySessions.set(token, session);
    demoModeActive = false;

    // Asynchronously persist to MySQL if active
    repositoryDao.saveSession({ token, ...session }).catch(err => {
      console.warn('[SessionStore] MySQL session persistence notice:', err.message);
    });

    return token;
  },

  getSession(token?: string): SessionData | null {
    if (!token) return null;

    const inMemory = memorySessions.get(token);
    if (inMemory) {
      if (Date.now() > inMemory.expiresAt) {
        memorySessions.delete(token);
        repositoryDao.deleteSession(token).catch(() => {});
        return null;
      }
      return inMemory;
    }

    return null;
  },

  async getSessionAsync(token?: string): Promise<SessionData | null> {
    if (!token) return null;
    const cached = this.getSession(token);
    if (cached) return cached;

    // Fallback to MySQL if not in memory
    const dbSession = await repositoryDao.getSession(token);
    if (dbSession && Date.now() <= dbSession.expiresAt) {
      const data: SessionData = {
        user: dbSession.user,
        accessToken: dbSession.accessToken,
        createdAt: dbSession.createdAt,
        expiresAt: dbSession.expiresAt,
      };
      memorySessions.set(token, data);
      return data;
    }
    return null;
  },

  destroySession(token?: string): void {
    if (token) {
      memorySessions.delete(token);
      repositoryDao.deleteSession(token).catch(() => {});
    }
    demoModeActive = false;
  },

  isDemoModeActive(): boolean {
    return demoModeActive;
  },

  setDemoModeActive(active: boolean): void {
    demoModeActive = active;
  },

  clearAllSessions(): void {
    memorySessions.clear();
    oauthStates.clear();
    demoModeActive = false;
  }
};
