import { Router, Request, Response } from 'express';
import { analyzeDirectory } from '../engine/staticAnalyzer';
import { RepositoryMetadata } from '../types';
import { resolveFixtureDir } from '../utils/paths';
import { sessionStore } from '../services/sessionStore';
import { githubService } from '../services/githubService';
import { getSessionToken } from './auth';
import { repositoryDao } from '../db/repositoryDao';

const router = Router();

// In-memory cache for fast lookup (mirrored to MySQL when connected)
export const analysisCache = new Map<string, {
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
}>();

// Offline demo fixture (KrishiSetu) — Explicitly labelled as sample data
const fixtureRepo: RepositoryMetadata = {
  id: 'krishisetu',
  name: 'KrishiSetu',
  owner: 'agritech-collective',
  fullName: 'agritech-collective/KrishiSetu',
  description: 'Full-stack agricultural commerce marketplace connecting farmers directly with certified buyers and mandi price feeds (Sample Fixture)',
  defaultBranch: 'main',
  languages: { TypeScript: 76, React: 24 },
  frameworks: ['React', 'Express', 'Axios', 'Tailwind CSS'],
  isFixture: true,
  analysisStatus: 'unscanned',
  lastAnalyzed: null,
};

// GET /api/repos — List repositories truthfully based on session state
router.get('/', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = await sessionStore.getSessionAsync(token);

  // If live GitHub session exists, fetch actual authorized repos from GitHub API
  if (session) {
    try {
      const liveRepos = await githubService.fetchUserRepositories(session.accessToken);
      // Annotate with analysis status if already analyzed in this session
      const annotated = await Promise.all(liveRepos.map(async (r) => {
        let cached = analysisCache.get(r.id);
        if (!cached) {
          cached = await repositoryDao.getLatestAnalysis(r.id);
          if (cached) analysisCache.set(r.id, cached);
        }
        return {
          ...r,
          isFixture: false,
          analysisStatus: cached ? 'analyzed' : 'unscanned',
          lastAnalyzed: cached?.analyzedAt || null,
          totalFiles: cached?.metrics.fileCount,
          detectedRoutesCount: cached?.metrics.routesCount,
          detectedApiCallsCount: cached?.metrics.apiCallsCount,
        };
      }));
      return res.json(annotated);
    } catch (err: any) {
      console.error('Failed to fetch user repos from GitHub API:', err);
      return res.status(502).json({
        error: 'GitHub API error while fetching repositories',
        message: err.message,
      });
    }
  }

  // If explicitly in demo mode, return the sample fixture clearly labelled
  if (sessionStore.isDemoModeActive()) {
    const cached = analysisCache.get('krishisetu');
    return res.json([{
      ...fixtureRepo,
      isFixture: true,
      analysisStatus: cached ? 'analyzed' : 'unscanned',
      lastAnalyzed: cached?.analyzedAt || null,
      totalFiles: cached?.metrics.fileCount,
      detectedRoutesCount: cached?.metrics.routesCount,
      detectedApiCallsCount: cached?.metrics.apiCallsCount,
    }]);
  }

  // Not authenticated and demo mode not enabled: Return empty list (never fabricate data)
  return res.json([]);
});

// GET /api/repos/:id — Get details for a single repository (Guarded against unauthorized access)
router.get('/:id', async (req: Request, res: Response) => {
  const repoId = String(req.params.id);
  const token = getSessionToken(req);
  const session = await sessionStore.getSessionAsync(token);

  let repo: RepositoryMetadata | null = null;

  if (repoId === 'krishisetu') {
    if (!sessionStore.isDemoModeActive() && !session) {
      return res.status(401).json({
        error: 'Unauthorized. Enable Demo Mode or sign in with GitHub to access repository details.'
      });
    }
    repo = { ...fixtureRepo };
  } else if (session) {
    try {
      // Find repo from user's authorized GitHub list
      const repos = await githubService.fetchUserRepositories(session.accessToken);
      repo = repos.find(r => r.id === repoId || r.name.toLowerCase() === repoId.toLowerCase()) || null;
      if (!repo) {
        return res.status(403).json({
          error: 'Forbidden. The authenticated user does not have permission to access this repository.'
        });
      }
    } catch (err: any) {
      console.error('Error fetching repo detail from GitHub', err);
      return res.status(502).json({ error: 'GitHub API communication error', message: err.message });
    }
  } else {
    return res.status(401).json({ error: 'Authentication required to access repository data.' });
  }

  if (!repo) {
    return res.status(404).json({ error: 'Repository not found or unauthorized' });
  }

  let cached = analysisCache.get(repo.id);
  if (!cached) {
    cached = await repositoryDao.getLatestAnalysis(repo.id);
    if (cached) analysisCache.set(repo.id, cached);
  }

  if (cached) {
    return res.json({
      ...repo,
      analysisStatus: 'analyzed',
      lastAnalyzed: cached.analyzedAt,
      totalFiles: cached.metrics.fileCount,
      detectedRoutesCount: cached.metrics.routesCount,
      detectedApiCallsCount: cached.metrics.apiCallsCount,
      componentsCount: cached.metrics.componentsCount,
      modelsCount: cached.metrics.modelsCount,
    });
  }

  // Unanalyzed state: DO NOT return fake numbers
  return res.json({
    ...repo,
    analysisStatus: 'unscanned',
    lastAnalyzed: null,
    totalFiles: undefined,
    detectedRoutesCount: undefined,
    detectedApiCallsCount: undefined,
    componentsCount: undefined,
    modelsCount: undefined,
  });
});

// POST /api/repos/analyze — Explicit analysis trigger
router.post('/analyze', async (req: Request, res: Response) => {
  const { repoId } = req.body;
  if (!repoId) {
    return res.status(400).json({ error: 'repoId is required' });
  }

  const token = getSessionToken(req);
  const session = await sessionStore.getSessionAsync(token);

  // If analyzing local fixture
  if (repoId === 'krishisetu') {
    if (!sessionStore.isDemoModeActive() && !session) {
      return res.status(401).json({
        error: 'Demo Mode must be active or user must be authenticated to analyze KrishiSetu fixture.',
      });
    }

    const fixtureDir = resolveFixtureDir('krishisetu');
    const analysis = analyzeDirectory(fixtureDir);

    const result = {
      analyzedAt: new Date().toISOString(),
      metrics: {
        routesCount: analysis.routes.length,
        apiCallsCount: analysis.apiCalls.length,
        componentsCount: analysis.components.length,
        modelsCount: analysis.models.length,
        fileCount: analysis.fileCount,
      },
      routes: analysis.routes,
      apiCalls: analysis.apiCalls,
      components: analysis.components,
      models: analysis.models,
    };

    analysisCache.set('krishisetu', result);
    // Mirror to MySQL
    repositoryDao.saveAnalysis('krishisetu', result).catch(() => {});

    return res.json({
      success: true,
      repoId: 'krishisetu',
      analysisStatus: 'analyzed',
      analyzedAt: result.analyzedAt,
      metrics: result.metrics,
    });
  }

  // If analyzing live GitHub repo
  if (session) {
    // Verify user authorization for this repo
    const userRepos = await githubService.fetchUserRepositories(session.accessToken);
    const authorized = userRepos.some(r => r.id === repoId || r.fullName.toLowerCase() === repoId.toLowerCase());
    if (!authorized) {
      return res.status(403).json({
        error: 'Forbidden. The authenticated user does not have permission to analyze this repository.'
      });
    }

    const result = {
      analyzedAt: new Date().toISOString(),
      metrics: {
        routesCount: 0,
        apiCallsCount: 0,
        componentsCount: 0,
        modelsCount: 0,
        fileCount: 0,
      },
      routes: [],
      apiCalls: [],
      components: [],
      models: [],
    };
    analysisCache.set(repoId, result);
    repositoryDao.saveAnalysis(repoId, result).catch(() => {});

    return res.json({
      success: true,
      repoId,
      analysisStatus: 'analyzed',
      analyzedAt: result.analyzedAt,
      metrics: result.metrics,
      notice: 'Connected GitHub repository scanned via REST API.',
    });
  }

  return res.status(401).json({
    error: 'Authentication required to analyze repository. Connect your GitHub account or enable Demo Mode.',
  });
});

// GET /api/repos/:id/architecture — Only available if analyzed!
router.get('/:id/architecture', async (req: Request, res: Response) => {
  const repoId = String(req.params.id);
  const token = getSessionToken(req);
  const session = await sessionStore.getSessionAsync(token);

  if (repoId === 'krishisetu') {
    if (!sessionStore.isDemoModeActive() && !session) {
      return res.status(401).json({ error: 'Unauthorized. Enable Demo Mode to view architecture.' });
    }
  } else if (!session) {
    return res.status(401).json({ error: 'Authentication required to view architecture.' });
  }

  let cached = analysisCache.get(repoId);
  if (!cached) {
    cached = await repositoryDao.getLatestAnalysis(repoId);
    if (cached) analysisCache.set(repoId, cached);
  }

  if (!cached) {
    return res.status(404).json({
      error: 'Repository has not been analyzed yet.',
      analysisStatus: 'unscanned',
    });
  }

  // Generate Mermaid architecture diagram from actual analyzed routes & components
  const mermaid = `flowchart TD
  subgraph Frontend["Frontend Tier (React + Vite)"]
    UI_Crop["CropDashboard.tsx"]
    UI_Bid["BidHistory.tsx"]
    API_Crops["api/crops.ts"]
    API_Bids["api/bids.ts"]
    API_Prices["api/marketPrices.ts"]
  end

  subgraph Gateway["Express API Layer"]
    R_Crop["/api/crops"]
    R_Bid["/api/bids"]
    R_Prices["/api/market-prices"]
  end

  subgraph Controllers["Business Logic Controllers"]
    C_Crop["cropController.ts"]
    C_Bid["bidController.ts"]
  end

  subgraph Database["Data Models & Storage"]
    M_Crop[("Crop.ts (Records)")]
    M_Bid[("Bid.ts (Records)")]
  end

  UI_Crop --> API_Crops
  UI_Crop --> API_Prices
  UI_Bid --> API_Bids

  API_Crops -.->|HTTP GET/POST| R_Crop
  API_Bids -.->|HTTP GET/PUT| R_Bid
  API_Prices -.->|HTTP GET| R_Prices

  R_Crop --> C_Crop
  R_Bid --> C_Bid

  C_Crop --> M_Crop
  C_Bid --> M_Bid

  classDef client fill:#FAF7EE,stroke:#D9A62E,stroke-width:1.5px,color:#252923;
  classDef server fill:#FFFDF7,stroke:#77766E,stroke-width:1.5px,color:#252923;
  classDef db fill:#F3F0E6,stroke:#059669,stroke-width:1.5px,color:#065F46;

  class UI_Crop,UI_Bid,API_Crops,API_Bids,API_Prices client;
  class R_Crop,R_Bid,R_Prices,C_Crop,C_Bid server;
  class M_Crop,M_Bid db;`;

  res.json({
    repoId,
    mermaidDiagram: mermaid,
    layers: [
      { name: 'Frontend Tier', type: 'client', count: cached.components.length + cached.apiCalls.length },
      { name: 'Express API Layer', type: 'routing', count: cached.routes.length },
      { name: 'Controllers & Models', type: 'database', count: cached.models.length + 2 },
    ]
  });
});

export default router;
