import { Router, Request, Response } from 'express';
import { analyzeDirectory } from '../engine/staticAnalyzer';
import { RepositoryMetadata } from '../types';
import { resolveFixtureDir } from '../utils/paths';

const router = Router();

const sampleRepos: RepositoryMetadata[] = [
  {
    id: 'krishisetu',
    name: 'KrishiSetu',
    owner: 'agritech-collective',
    description: 'Full-stack agricultural marketplace connecting farmers directly with certified buyers and mandi price feeds',
    defaultBranch: 'main',
    languages: { TypeScript: 68, React: 24, SQL: 8 },
    frameworks: ['React', 'Express', 'Axios', 'Tailwind CSS'],
    totalFiles: 24,
    lastAnalyzed: new Date().toISOString(),
  },
  {
    id: 'healthsync-core',
    name: 'HealthSync-Core',
    owner: 'medtech-labs',
    description: 'HIPAA-compliant patient telemetry and vital signs monitoring service',
    defaultBranch: 'main',
    languages: { TypeScript: 82, Python: 18 },
    frameworks: ['FastAPI', 'Express', 'PostgreSQL'],
    totalFiles: 42,
    lastAnalyzed: '2026-10-18T14:20:00Z',
  }
];

router.get('/', (req: Request, res: Response) => {
  res.json(sampleRepos);
});

router.get('/:id', (req: Request, res: Response) => {
  const repo = sampleRepos.find(r => r.id === req.params.id);
  if (!repo) return res.status(404).json({ error: 'Repository not found' });

  const fixtureDir = resolveFixtureDir(repo.id);
  const analysis = analyzeDirectory(fixtureDir);

  res.json({
    ...repo,
    fileCount: analysis.fileCount || repo.totalFiles,
    detectedRoutesCount: analysis.routes.length,
    detectedApiCallsCount: analysis.apiCalls.length,
    componentsCount: analysis.components.length,
    modelsCount: analysis.models.length,
  });
});

router.post('/analyze', (req: Request, res: Response) => {
  const { repoId } = req.body;
  const repo = sampleRepos.find(r => r.id === (repoId || 'krishisetu'));
  if (!repo) return res.status(404).json({ error: 'Repository not found' });

  const fixtureDir = resolveFixtureDir(repo.id);
  const analysis = analyzeDirectory(fixtureDir);

  res.json({
    success: true,
    repoId: repo.id,
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
  });
});

router.get('/:id/architecture', (req: Request, res: Response) => {
  const repo = sampleRepos.find(r => r.id === req.params.id);
  if (!repo) return res.status(404).json({ error: 'Repository not found' });

  const fixtureDir = resolveFixtureDir(repo.id);
  const analysis = analyzeDirectory(fixtureDir);

  // Generate Mermaid architecture diagram
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

  classDef client fill:#f0f9ff,stroke:#0284c7,stroke-width:1.5px;
  classDef server fill:#f8fafc,stroke:#475569,stroke-width:1.5px;
  classDef db fill:#ecfdf5,stroke:#059669,stroke-width:1.5px;

  class UI_Crop,UI_Bid,API_Crops,API_Bids,API_Prices client;
  class R_Crop,R_Bid,R_Prices,C_Crop,C_Bid server;
  class M_Crop,M_Bid db;`;

  res.json({
    repoId: repo.id,
    mermaidDiagram: mermaid,
    layers: [
      { name: 'Frontend Tier', type: 'client', count: analysis.components.length + analysis.apiCalls.length },
      { name: 'Express API Layer', type: 'routing', count: analysis.routes.length },
      { name: 'Controllers & Models', type: 'database', count: analysis.models.length + 2 },
    ]
  });
});

export default router;
