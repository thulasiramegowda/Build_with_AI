import express from 'express';
import cors from 'cors';
import { config } from './config';
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
app.use(express.json());

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CodePulse Intelligence Engine',
    timestamp: new Date().toISOString(),
    demoMode: config.isDemoMode,
    geminiEnabled: Boolean(config.geminiApiKey),
  });
});

// Mounted Routes
app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/prs', prRoutes);
app.use('/api/patches', patchRoutes);

const PORT = config.port;

export const server = app.listen(PORT, () => {
  console.log(`[CodePulse Engine] running at http://localhost:${PORT}`);
  console.log(`[Mode] ${config.isDemoMode ? 'Local Demo Mode (KrishiSetu)' : 'Live GitHub Mode'}`);
  console.log(`[AI Provider] ${config.geminiApiKey ? 'Gemini 1.5 Flash Connected' : 'Deterministic Heuristic Fallback'}`);
});

export default app;
