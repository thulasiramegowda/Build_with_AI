import { Router, Request, Response } from 'express';
import { analyzeDirectory } from '../engine/staticAnalyzer';
import { RepositoryMetadata } from '../types';
import { resolveFixtureDir } from '../utils/paths';
import { sessionStore } from '../services/sessionStore';
import { githubService } from '../services/githubService';
import { getSessionToken } from './auth';
import { repositoryDao } from '../db/repositoryDao';
import { buildArchitectureDiagram } from '../engine/architectureBuilder';
import { llmService } from '../services/llmService';

const router = Router();

export interface CachedAnalysis {
  analyzedAt: string;
  commitSha?: string;
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
  topLevelFolders?: string[];
  frameworks?: string[];
  allFilePaths?: string[];
  mermaidDiagram?: string;
  layers?: any[];
  aiExplanation?: string | null;
  explanationProvider?: 'gemini' | 'deterministic_fallback';
}

// In-memory cache for fast lookup (mirrored to MySQL when connected)
export const analysisCache = new Map<string, CachedAnalysis>();

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
          commitSha: cached?.commitSha || null,
          topLevelFolders: cached?.topLevelFolders || [],
          frameworks: (cached?.frameworks && cached.frameworks.length > 0) ? cached.frameworks : r.frameworks,
          aiExplanation: cached?.aiExplanation || null,
          explanationProvider: cached?.explanationProvider || undefined,
          totalFiles: cached?.metrics.fileCount,
          detectedRoutesCount: cached?.metrics.routesCount,
          detectedApiCallsCount: cached?.metrics.apiCallsCount,
          componentsCount: cached?.metrics.componentsCount,
          modelsCount: cached?.metrics.modelsCount,
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
      commitSha: cached.commitSha || null,
      topLevelFolders: cached.topLevelFolders || [],
      frameworks: (cached.frameworks && cached.frameworks.length > 0) ? cached.frameworks : repo.frameworks,
      aiExplanation: cached.aiExplanation || null,
      explanationProvider: cached.explanationProvider || undefined,
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

  // If analyzing local fixture (KrishiSetu)
  if (repoId === 'krishisetu') {
    if (!sessionStore.isDemoModeActive() && !session) {
      return res.status(401).json({
        error: 'Demo Mode must be active or user must be authenticated to analyze KrishiSetu fixture.',
      });
    }

    const fixtureDir = resolveFixtureDir('krishisetu');
    const analysis = analyzeDirectory(fixtureDir);

    const { mermaidDiagram, layers } = buildArchitectureDiagram(
      'krishisetu',
      analysis,
      ['CropDashboard.tsx', 'BidHistory.tsx', 'crops.ts', 'bids.ts', 'cropRoutes.ts', 'bidRoutes.ts', 'Crop.ts', 'Bid.ts'],
      true
    );

    const aiExplanationRes = await llmService.explainArchitecture({
      name: 'KrishiSetu',
      owner: 'agritech-collective',
      frameworks: fixtureRepo.frameworks,
      fileCount: analysis.fileCount,
      routesCount: analysis.routes.length,
      folders: ['client', 'server'],
    });

    const result: CachedAnalysis = {
      analyzedAt: new Date().toISOString(),
      commitSha: 'sample-sha-7a8b9c',
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
      topLevelFolders: ['client', 'server'],
      frameworks: fixtureRepo.frameworks,
      allFilePaths: [],
      mermaidDiagram,
      layers,
      aiExplanation: aiExplanationRes.text,
      explanationProvider: aiExplanationRes.source,
    };

    analysisCache.set('krishisetu', result);
    // Mirror to MySQL
    repositoryDao.saveAnalysis('krishisetu', result).catch(() => {});

    return res.json({
      success: true,
      repoId: 'krishisetu',
      analysisStatus: 'analyzed',
      analyzedAt: result.analyzedAt,
      commitSha: result.commitSha,
      metrics: result.metrics,
      frameworks: result.frameworks,
      aiExplanation: result.aiExplanation,
      explanationProvider: result.explanationProvider,
    });
  }

  // If analyzing live GitHub repo
  if (session) {
    // Verify user authorization for this repo
    const userRepos = await githubService.fetchUserRepositories(session.accessToken);
    const targetRepo = userRepos.find(
      r => r.id === repoId || r.fullName.toLowerCase() === repoId.toLowerCase() || r.name.toLowerCase() === repoId.toLowerCase()
    );

    if (!targetRepo) {
      return res.status(403).json({
        error: 'Forbidden. The authenticated user does not have permission to analyze this repository.',
      });
    }

    try {
      // Ingest real repository files through authenticated GitHub REST API
      const ingestion = await githubService.ingestAndAnalyzeRepository(
        session.accessToken,
        targetRepo.owner,
        targetRepo.name,
        targetRepo.defaultBranch || 'main'
      );

      // Build dynamic Mermaid architecture diagram from discovered files and verified tiers
      const { mermaidDiagram, layers } = buildArchitectureDiagram(
        targetRepo.name,
        {
          routes: ingestion.routes,
          apiCalls: ingestion.apiCalls,
          components: ingestion.components,
          models: ingestion.models,
          topLevelFolders: ingestion.topLevelFolders,
        },
        ingestion.allFilePaths,
        false
      );

      // Generate AI explanation via Gemini 2.5 Flash with deterministic fallback
      const aiExplanationRes = await llmService.explainArchitecture({
        name: targetRepo.name,
        owner: targetRepo.owner,
        frameworks: ingestion.frameworks.length > 0 ? ingestion.frameworks : targetRepo.frameworks,
        fileCount: ingestion.totalFiles,
        routesCount: ingestion.routes.length,
        folders: ingestion.topLevelFolders,
      });

      const result: CachedAnalysis = {
        analyzedAt: new Date().toISOString(),
        commitSha: ingestion.commitSha,
        metrics: {
          routesCount: ingestion.routes.length,
          apiCallsCount: ingestion.apiCalls.length,
          componentsCount: ingestion.components.length,
          modelsCount: ingestion.models.length,
          fileCount: ingestion.totalFiles,
        },
        routes: ingestion.routes,
        apiCalls: ingestion.apiCalls,
        components: ingestion.components,
        models: ingestion.models,
        topLevelFolders: ingestion.topLevelFolders,
        frameworks: ingestion.frameworks,
        allFilePaths: ingestion.allFilePaths,
        mermaidDiagram,
        layers,
        aiExplanation: aiExplanationRes.text,
        explanationProvider: aiExplanationRes.source,
      };

      // Cache by ID and FullName for immediate lookup across endpoints
      analysisCache.set(targetRepo.id, result);
      analysisCache.set(targetRepo.fullName, result);
      repositoryDao.saveAnalysis(targetRepo.id, result).catch(() => {});

      return res.json({
        success: true,
        repoId: targetRepo.id,
        fullName: targetRepo.fullName,
        analysisStatus: 'analyzed',
        analyzedAt: result.analyzedAt,
        commitSha: result.commitSha,
        metrics: result.metrics,
        frameworks: result.frameworks,
        topLevelFolders: result.topLevelFolders,
        aiExplanation: result.aiExplanation,
        explanationProvider: result.explanationProvider,
        notice: `Successfully scanned ${result.metrics.fileCount} source files at commit ${(result.commitSha || 'HEAD').slice(0, 7)}.`,
      });
    } catch (err: any) {
      console.error('[Live Repo Ingestion Error]:', err);
      return res.status(502).json({
        error: 'Repository ingestion failed',
        message: err.message || 'Unable to fetch file tree and source code from GitHub.',
      });
    }
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

  let mermaidDiagram = cached.mermaidDiagram;
  let layers = cached.layers;

  if (!mermaidDiagram) {
    const isKrishi = repoId === 'krishisetu';
    const built = buildArchitectureDiagram(
      repoId,
      {
        routes: cached.routes || [],
        apiCalls: cached.apiCalls || [],
        components: cached.components || [],
        models: cached.models || [],
        topLevelFolders: cached.topLevelFolders,
      },
      cached.allFilePaths || [],
      isKrishi
    );
    mermaidDiagram = built.mermaidDiagram;
    layers = built.layers;
  }

  res.json({
    repoId,
    mermaidDiagram,
    layers: layers || [
      { name: 'Frontend Tier', type: 'client', count: (cached.components?.length || 0) + (cached.apiCalls?.length || 0) },
      { name: 'API Layer', type: 'routing', count: cached.routes?.length || 0 },
      { name: 'Controllers & Models', type: 'database', count: (cached.models?.length || 0) + 2 },
    ],
    commitSha: cached.commitSha || null,
    aiExplanation: cached.aiExplanation || null,
    explanationProvider: cached.explanationProvider || 'deterministic_fallback',
  });
});

export default router;
