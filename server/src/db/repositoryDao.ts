import { db } from './connection';
import { UserProfile, RepositoryMetadata, ContractFinding } from '../types';

export interface PersistedSession {
  token: string;
  user: UserProfile;
  accessToken: string;
  createdAt: number;
  expiresAt: number;
}

export const repositoryDao = {
  async saveSession(session: PersistedSession): Promise<boolean> {
    if (!db.isConnected()) return false;
    const sql = `
      INSERT INTO sessions (token, user_id, login, name, avatar_url, email, html_url, access_token, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        access_token = VALUES(access_token),
        expires_at = VALUES(expires_at)
    `;
    const params = [
      session.token,
      session.user.id,
      session.user.login,
      session.user.name,
      session.user.avatarUrl,
      session.user.email || null,
      session.user.htmlUrl,
      session.accessToken,
      session.createdAt,
      session.expiresAt,
    ];
    const res = await db.query(sql, params);
    return res !== null;
  },

  async getSession(token: string): Promise<PersistedSession | null> {
    if (!db.isConnected()) return null;
    const now = Date.now();
    const rows = await db.query<any>(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > ? LIMIT 1',
      [token, now]
    );
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      token: r.token,
      user: {
        id: r.user_id,
        login: r.login,
        name: r.name,
        avatarUrl: r.avatar_url,
        email: r.email,
        htmlUrl: r.html_url,
      },
      accessToken: r.access_token,
      createdAt: Number(r.created_at),
      expiresAt: Number(r.expires_at),
    };
  },

  async deleteSession(token: string): Promise<boolean> {
    if (!db.isConnected()) return false;
    const res = await db.query('DELETE FROM sessions WHERE token = ?', [token]);
    return res !== null;
  },

  async saveAnalysis(
    repoId: string,
    result: {
      analyzedAt: string;
      metrics: {
        routesCount: number;
        apiCallsCount: number;
        componentsCount: number;
        modelsCount: number;
        fileCount: number;
      };
      routes: any[];
      apiCalls: any[];
      components: any[];
      models: any[];
    }
  ): Promise<boolean> {
    if (!db.isConnected()) return false;
    const sql = `
      INSERT INTO analysis_runs 
        (repo_id, analyzed_at, file_count, routes_count, api_calls_count, components_count, models_count, routes_data, api_calls_data, components_data, models_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      repoId,
      new Date(result.analyzedAt),
      result.metrics.fileCount,
      result.metrics.routesCount,
      result.metrics.apiCallsCount,
      result.metrics.componentsCount,
      result.metrics.modelsCount,
      JSON.stringify(result.routes),
      JSON.stringify(result.apiCalls),
      JSON.stringify(result.components),
      JSON.stringify(result.models),
    ];
    const res = await db.query(sql, params);
    return res !== null;
  },

  async getLatestAnalysis(repoId: string): Promise<any | null> {
    if (!db.isConnected()) return null;
    const rows = await db.query<any>(
      'SELECT * FROM analysis_runs WHERE repo_id = ? ORDER BY id DESC LIMIT 1',
      [repoId]
    );
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      analyzedAt: new Date(r.analyzed_at).toISOString(),
      metrics: {
        routesCount: r.routes_count,
        apiCallsCount: r.api_calls_count,
        componentsCount: r.components_count,
        modelsCount: r.models_count,
        fileCount: r.file_count,
      },
      routes: typeof r.routes_data === 'string' ? JSON.parse(r.routes_data) : r.routes_data || [],
      apiCalls: typeof r.api_calls_data === 'string' ? JSON.parse(r.api_calls_data) : r.api_calls_data || [],
      components: typeof r.components_data === 'string' ? JSON.parse(r.components_data) : r.components_data || [],
      models: typeof r.models_data === 'string' ? JSON.parse(r.models_data) : r.models_data || [],
    };
  },

  async saveFindings(repoId: string, findings: ContractFinding[]): Promise<boolean> {
    if (!db.isConnected() || findings.length === 0) return false;
    // Clear previous findings for this repo
    await db.query('DELETE FROM contract_findings WHERE repo_id = ?', [repoId]);

    for (const f of findings) {
      const sql = `
        INSERT INTO contract_findings (id, repo_id, title, severity, finding_type, confidence, frontend_evidence, backend_evidence, explanation, suggested_fix, proposed_patch)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await db.query(sql, [
        f.id,
        repoId,
        f.title,
        f.severity,
        f.type,
        f.confidence,
        f.frontendEvidence ? JSON.stringify(f.frontendEvidence) : null,
        f.backendEvidence ? JSON.stringify(f.backendEvidence) : null,
        f.explanation,
        f.suggestedFix,
        f.proposedPatch || null,
      ]);
    }
    return true;
  },

  async getFindings(repoId: string): Promise<ContractFinding[] | null> {
    if (!db.isConnected()) return null;
    const rows = await db.query<any>(
      'SELECT * FROM contract_findings WHERE repo_id = ?',
      [repoId]
    );
    if (!rows) return null;
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      severity: r.severity,
      type: r.finding_type,
      confidence: r.confidence,
      frontendEvidence: typeof r.frontend_evidence === 'string' ? JSON.parse(r.frontend_evidence) : r.frontend_evidence,
      backendEvidence: typeof r.backend_evidence === 'string' ? JSON.parse(r.backend_evidence) : r.backend_evidence,
      explanation: r.explanation,
      suggestedFix: r.suggested_fix,
      proposedPatch: r.proposed_patch,
    }));
  }
};
