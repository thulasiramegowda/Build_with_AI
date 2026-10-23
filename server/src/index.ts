import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { db } from './db/connection';
import { githubService } from './services/githubService';
import { sessionStore } from './services/sessionStore';
import authRoutes from './routes/auth';
import repoRoutes from './routes/repos';
import contractRoutes from './routes/contracts';
import prRoutes from './routes/prs';
import patchRoutes from './routes/patches';

const app = express();

app.use(cors({
  origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CodePulse Intelligence Engine',
    timestamp: new Date().toISOString(),
    githubConfigured: githubService.isConfigured(),
    demoModeActive: sessionStore.isDemoModeActive(),
    geminiEnabled: Boolean(config.geminiApiKey),
    geminiModel: config.geminiModel,
    database: {
      driver: db.isConnected() ? 'mysql' : 'memory-fallback',
      configured: db.isConfigured(),
      connected: db.isConnected(),
      error: db.getConnectionError(),
    },
  });
});

// Mounted Routes
app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/prs', prRoutes);
app.use('/api/patches', patchRoutes);

const PORT = config.port;

// Initialize database pool asynchronously on startup
db.getPool().catch(err => {
  console.warn('[Database] Async pool startup notice:', err.message);
});

export let server: any = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`[CodePulse Engine] running at http://localhost:${PORT}`);
    console.log(`[GitHub Integration] ${githubService.isConfigured() ? 'OAuth Configured' : 'Setup Required (Set GITHUB_CLIENT_ID in .env)'}`);
    console.log(`[Database] ${db.isConfigured() ? 'MySQL Configured' : 'In-Memory Fallback'}`);
    console.log(`[AI Provider] ${config.geminiApiKey ? `Gemini Active (${config.geminiModel})` : 'Deterministic Heuristic Fallback'}`);
  });
}

export default app;
