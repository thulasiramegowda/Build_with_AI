import { Router, Request, Response } from 'express';
import { parseUnifiedDiff, evaluateRegressionRisk } from '../engine/diffParser';
import { buildImpactGraph } from '../engine/impactBuilder';
import { analysisCache } from './repos';
import { sessionStore } from '../services/sessionStore';
import { githubService } from '../services/githubService';
import { getSessionToken } from './auth';
import { repositoryDao } from '../db/repositoryDao';

const router = Router();

const samplePR14Diff = `diff --git a/server/src/routes/bidRoutes.ts b/server/src/routes/bidRoutes.ts
index a1b2c3d..e4f5g6h 100644
--- a/server/src/routes/bidRoutes.ts
+++ b/server/src/routes/bidRoutes.ts
@@ -5,3 +5,5 @@ const router = Router();
 router.get('/api/crops/:id/bids', getBidsByCrop);
-router.put('/api/bids/:id/accept', acceptBidHandler);
+router.put('/api/bids/:id/accept', acceptBidHandler);
+router.post('/api/bids/:id/counter-offer', sendCounterOfferHandler);
+router.delete('/api/bids/:id/withdraw', withdrawBidHandler);
diff --git a/server/src/controllers/bidController.ts b/server/src/controllers/bidController.ts
index b2c3d4e..f5g6h7i 100644
--- a/server/src/controllers/bidController.ts
+++ b/server/src/controllers/bidController.ts
@@ -10,4 +10,12 @@ export async function acceptBidHandler(req: Request, res: Response) {
   const updated = await BidModel.updateStatus(req.params.id, 'accepted');
+  // Realtime notification broadcast to farmer dashboard
+  notifyFarmerOfAcceptedBid(req.params.id);
   res.json({ success: true, bid: updated });
 }
+
 export async function sendCounterOfferHandler(req: Request, res: Response) {
   const { counterPrice } = req.body;
   res.json({ success: true, counterPrice });
 }`;

const samplePRs = [
  {
    id: 'pr-14',
    number: 14,
    title: 'feat: Realtime Bidding & Counter-Offer Support',
    author: 'dev-rohit',
    baseBranch: 'main',
    headBranch: 'feature/realtime-bidding',
    createdAt: '2026-10-21T09:30:00Z',
    rawDiff: samplePR14Diff,
    isFixture: true,
  },
  {
    id: 'pr-12',
    number: 12,
    title: 'fix: Farmer Crop Yield Decimal Rounding',
    author: 'priya-agri',
    baseBranch: 'main',
    headBranch: 'fix/crop-rounding',
    createdAt: '2026-10-20T16:15:00Z',
    rawDiff: `diff --git a/server/src/models/Crop.ts b/server/src/models/Crop.ts
index c3d4e5f..g6h7i8j 100644
--- a/server/src/models/Crop.ts
+++ b/server/src/models/Crop.ts
@@ -15,3 +15,3 @@ export const CropModel = {
   create: async (data: Omit<CropRecord, 'id'>) => {
-    const record = { id: \`crop-\${Date.now()}\`, ...data };
+    const record = { id: \`crop-\${Date.now()}\`, ...data, quantityKg: Math.round(data.quantityKg * 100) / 100 };
     cropsStore.push(record);`,
    isFixture: true,
  }
];

// GET /api/prs/:repoId — List PRs for repository
router.get('/:repoId', async (req: Request, res: Response) => {
  const repoIdParam = (Array.isArray(req.params.repoId) ? req.params.repoId[0] : req.params.repoId) || '';
  const token = getSessionToken(req);
  const session = await sessionStore.getSessionAsync(token);

  // If repo is the sample fixture (and analyzed), return sample PRs
  if (repoIdParam === 'krishisetu') {
    if (!sessionStore.isDemoModeActive() && !session) {
      return res.status(401).json({
        error: 'Unauthorized. Enable Demo Mode or sign in with GitHub to view pull requests.',
      });
    }

    let cached = analysisCache.get('krishisetu');
    if (!cached) {
      cached = await repositoryDao.getLatestAnalysis('krishisetu');
      if (cached) analysisCache.set('krishisetu', cached);
    }

    if (!cached) {
      return res.json([]);
    }

    return res.json(samplePRs.map(pr => {
      const parsedFiles = parseUnifiedDiff(pr.rawDiff);
      const risk = evaluateRegressionRisk(parsedFiles, 4);
      return {
        id: pr.id,
        number: pr.number,
        title: pr.title,
        author: pr.author,
        baseBranch: pr.baseBranch,
        headBranch: pr.headBranch,
        createdAt: pr.createdAt,
        changedFilesCount: parsedFiles.length,
        additions: parsedFiles.reduce((acc, f) => acc + f.additions, 0),
        deletions: parsedFiles.reduce((acc, f) => acc + f.deletions, 0),
        riskLevel: risk.riskLevel,
        isFixture: true,
      };
    }));
  }

  // Live GitHub repository PR fetching
  if (session && repoIdParam.includes('/')) {
    const [owner, repo] = repoIdParam.split('/');
    try {
      const livePulls = await githubService.fetchRepositoryPullRequests(session.accessToken, owner, repo);
      return res.json(livePulls.map((p: any) => ({
        id: String(p.id),
        number: p.number,
        title: p.title,
        author: p.user?.login || 'unknown',
        baseBranch: p.base?.ref || 'main',
        headBranch: p.head?.ref || 'feature',
        createdAt: p.created_at,
        changedFilesCount: 0,
        additions: 0,
        deletions: 0,
        riskLevel: 'medium',
        isFixture: false,
      })));
    } catch (err: any) {
      console.error('Failed to fetch PRs from GitHub API:', err);
      return res.status(502).json({ error: 'GitHub PR fetch failed', message: err.message });
    }
  }

  if (!session) {
    return res.status(401).json({ error: 'Authentication required to access pull requests.' });
  }

  return res.json([]);
});

// GET /api/prs/:repoId/:prId — Get detailed PR with diff
router.get('/:repoId/:prId', async (req: Request, res: Response) => {
  const prIdParam = Array.isArray(req.params.prId) ? req.params.prId[0] : req.params.prId;
  const repoIdParam = (Array.isArray(req.params.repoId) ? req.params.repoId[0] : req.params.repoId) || '';
  const token = getSessionToken(req);
  const session = await sessionStore.getSessionAsync(token);

  if (repoIdParam === 'krishisetu' || prIdParam.startsWith('pr-')) {
    if (!sessionStore.isDemoModeActive() && !session) {
      return res.status(401).json({ error: 'Unauthorized. Enable Demo Mode to view pull request details.' });
    }

    const pr = samplePRs.find(p => p.id === prIdParam || p.number.toString() === prIdParam);
    if (!pr) return res.status(404).json({ error: 'Pull request not found' });

    const parsedFiles = parseUnifiedDiff(pr.rawDiff);
    const risk = evaluateRegressionRisk(parsedFiles, 4);

    return res.json({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      author: pr.author,
      baseBranch: pr.baseBranch,
      headBranch: pr.headBranch,
      rawDiff: pr.rawDiff,
      changedFiles: parsedFiles,
      riskLevel: risk.riskLevel,
      riskSummary: risk.riskSummary,
      isFixture: true,
    });
  }

  // Live GitHub PR diff
  if (session && repoIdParam.includes('/')) {
    const [owner, repo] = repoIdParam.split('/');
    const prNum = parseInt(prIdParam, 10);
    try {
      const rawDiff = await githubService.fetchPullRequestDiff(session.accessToken, owner, repo, prNum);
      const parsedFiles = parseUnifiedDiff(rawDiff);
      const risk = evaluateRegressionRisk(parsedFiles, 4);

      return res.json({
        id: String(prNum),
        number: prNum,
        title: `Pull Request #${prNum}`,
        author: 'Contributor',
        baseBranch: 'main',
        headBranch: 'feature',
        rawDiff,
        changedFiles: parsedFiles,
        riskLevel: risk.riskLevel,
        riskSummary: risk.riskSummary,
        isFixture: false,
      });
    } catch (err: any) {
      return res.status(502).json({ error: 'Failed to fetch PR diff from GitHub', message: err.message });
    }
  }

  return res.status(401).json({ error: 'Authentication required' });
});

// GET /api/prs/:repoId/:prId/impact-graph — Signature Mermaid Change Impact Graph
router.get('/:repoId/:prId/impact-graph', async (req: Request, res: Response) => {
  const repoIdParam = (Array.isArray(req.params.repoId) ? req.params.repoId[0] : req.params.repoId) || 'krishisetu';
  const prIdParam = Array.isArray(req.params.prId) ? req.params.prId[0] : req.params.prId;
  const token = getSessionToken(req);
  const session = await sessionStore.getSessionAsync(token);

  if (repoIdParam === 'krishisetu') {
    if (!sessionStore.isDemoModeActive() && !session) {
      return res.status(401).json({ error: 'Unauthorized. Enable Demo Mode to view impact graph.' });
    }
  } else if (!session) {
    return res.status(401).json({ error: 'Authentication required to view impact graph.' });
  }

  let cached = analysisCache.get(repoIdParam);
  if (!cached) {
    cached = await repositoryDao.getLatestAnalysis(repoIdParam);
    if (cached) analysisCache.set(repoIdParam, cached);
  }

  if (!cached) {
    return res.status(400).json({
      error: 'Repository has not been analyzed yet. Run analysis first to build the impact graph.',
      analysisStatus: 'unscanned',
    });
  }

  const pr = samplePRs.find(p => p.id === prIdParam || p.number.toString() === prIdParam) || samplePRs[0];
  const parsedFiles = parseUnifiedDiff(pr.rawDiff);

  const graphData = buildImpactGraph(
    parsedFiles,
    cached.routes,
    cached.apiCalls,
    cached.components
  );

  res.json({
    prId: pr.id,
    prNumber: pr.number,
    ...graphData,
  });
});

export default router;
