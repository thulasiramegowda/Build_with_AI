import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { db } from '../server/src/db/connection';
import { repositoryDao } from '../server/src/db/repositoryDao';

describe('CodePulse MySQL Database Integration & Graceful Fallback', () => {
  it('confirms schema.sql exists and contains valid DDL definitions', () => {
    const schemaPath = path.resolve(__dirname, '../server/src/db/schema.sql');
    expect(fs.existsSync(schemaPath)).toBe(true);

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    expect(schemaContent).toContain('CREATE TABLE IF NOT EXISTS sessions');
    expect(schemaContent).toContain('CREATE TABLE IF NOT EXISTS repositories');
    expect(schemaContent).toContain('CREATE TABLE IF NOT EXISTS analysis_runs');
    expect(schemaContent).toContain('CREATE TABLE IF NOT EXISTS contract_findings');
    expect(schemaContent).toContain('token VARCHAR(64) PRIMARY KEY');
    expect(schemaContent).toContain('expires_at BIGINT NOT NULL');
  });

  it('runs unit tests independently without requiring live MySQL credentials', async () => {
    // When no MySQL server is running, db pool safely returns null or logs a graceful fallback
    const rows = await db.query('SELECT 1');
    if (db.isConnected()) {
      expect(Array.isArray(rows)).toBe(true);
    } else {
      expect(rows).toBeNull();
    }
  });

  it('ensures repositoryDao safely delegates to in-memory fallback when MySQL is offline', async () => {
    // If not connected to a live MySQL server, Dao functions return false/null gracefully
    if (!db.isConnected()) {
      const getRes = await repositoryDao.getSession('fake-token-123');
      expect(getRes).toBeNull();

      const saveRes = await repositoryDao.saveSession({
        token: 'fake-token-123',
        user: { id: '1', login: 'dev', name: 'Dev', avatarUrl: '', htmlUrl: '' },
        accessToken: 'access',
        createdAt: Date.now(),
        expiresAt: Date.now() + 1000,
      });
      expect(saveRes).toBe(false);

      const delRes = await repositoryDao.deleteSession('fake-token-123');
      expect(delRes).toBe(false);

      const analysisRes = await repositoryDao.getLatestAnalysis('krishisetu');
      expect(analysisRes).toBeNull();

      const findingsRes = await repositoryDao.getFindings('krishisetu');
      expect(findingsRes).toBeNull();
    }
  });
});
