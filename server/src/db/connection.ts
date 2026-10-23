import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { config } from '../config';
import { UserProfile, RepositoryMetadata, ContractFinding } from '../types';

let pool: Pool | null = null;
let isConnected = false;
let connectionError: string | null = null;

export const db = {
  isConfigured(): boolean {
    return Boolean(config.mysql.host && config.mysql.database && config.mysql.user);
  },

  isConnected(): boolean {
    return isConnected;
  },

  getConnectionError(): string | null {
    return connectionError;
  },

  async getPool(): Promise<Pool | null> {
    if (pool) return pool;
    if (!this.isConfigured()) return null;

    try {
      pool = mysql.createPool({
        host: config.mysql.host,
        port: config.mysql.port,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database,
        waitForConnections: true,
        connectionLimit: config.mysql.connectionLimit,
        queueLimit: 0,
        enableKeepAlive: true,
      });

      // Test connection
      const conn = await pool.getConnection();
      conn.release();
      isConnected = true;
      connectionError = null;
      console.log(`[MySQL Database] Successfully connected to ${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`);
      await this.runMigrations();
      return pool;
    } catch (err: any) {
      isConnected = false;
      connectionError = err.message || 'Failed to connect to MySQL';
      console.warn(`[MySQL Database] Warning: Could not connect to MySQL (${connectionError}). Falling back to in-memory state.`);
      pool = null;
      return null;
    }
  },

  async runMigrations(): Promise<void> {
    if (!pool) return;
    try {
      const conn = await pool.getConnection();
      try {
        await conn.query(`
          CREATE TABLE IF NOT EXISTS sessions (
            token VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL,
            login VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            avatar_url TEXT NOT NULL,
            email VARCHAR(255) DEFAULT NULL,
            html_url TEXT NOT NULL,
            access_token TEXT NOT NULL,
            created_at BIGINT NOT NULL,
            expires_at BIGINT NOT NULL,
            INDEX idx_sessions_expires (expires_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await conn.query(`
          CREATE TABLE IF NOT EXISTS repositories (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            owner VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            description TEXT DEFAULT NULL,
            default_branch VARCHAR(64) NOT NULL,
            languages JSON DEFAULT NULL,
            frameworks JSON DEFAULT NULL,
            is_fixture BOOLEAN DEFAULT FALSE,
            analysis_status ENUM('unscanned', 'analyzing', 'analyzed', 'failed') DEFAULT 'unscanned',
            last_analyzed TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await conn.query(`
          CREATE TABLE IF NOT EXISTS analysis_runs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            repo_id VARCHAR(255) NOT NULL,
            analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            file_count INT NOT NULL DEFAULT 0,
            routes_count INT NOT NULL DEFAULT 0,
            api_calls_count INT NOT NULL DEFAULT 0,
            components_count INT NOT NULL DEFAULT 0,
            models_count INT NOT NULL DEFAULT 0,
            routes_data JSON DEFAULT NULL,
            api_calls_data JSON DEFAULT NULL,
            components_data JSON DEFAULT NULL,
            models_data JSON DEFAULT NULL,
            INDEX idx_analysis_repo (repo_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await conn.query(`
          CREATE TABLE IF NOT EXISTS contract_findings (
            id VARCHAR(64) PRIMARY KEY,
            repo_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            severity ENUM('error', 'warning', 'info') NOT NULL,
            finding_type VARCHAR(64) NOT NULL,
            confidence FLOAT NOT NULL,
            frontend_evidence JSON DEFAULT NULL,
            backend_evidence JSON DEFAULT NULL,
            explanation TEXT NOT NULL,
            suggested_fix TEXT NOT NULL,
            proposed_patch TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_findings_repo (repo_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
      } finally {
        conn.release();
      }
    } catch (err: any) {
      console.warn('[MySQL Database] Schema initialization notice:', err.message);
    }
  },

  async query<T = any>(sql: string, params: any[] = []): Promise<T[] | null> {
    const p = await this.getPool();
    if (!p) return null;
    try {
      const [rows] = await p.query(sql, params);
      return rows as T[];
    } catch (err: any) {
      console.error('[MySQL Query Error]:', err.message);
      return null;
    }
  },

  async close(): Promise<void> {
    if (pool) {
      await pool.end();
      pool = null;
      isConnected = false;
    }
  }
};
