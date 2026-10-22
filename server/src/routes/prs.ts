import { Router, Request, Response } from 'express';
import { parseUnifiedDiff, evaluateRegressionRisk } from '../engine/diffParser';
import { buildImpactGraph } from '../engine/impactBuilder';
import { analyzeDirectory } from '../engine/staticAnalyzer';
import { resolveFixtureDir } from '../utils/paths';

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
  }
];

router.get('/:repoId', (req: Request, res: Response) => {
  res.json(samplePRs.map(pr => {
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
    };
  }));
});

router.get('/:repoId/:prId', (req: Request, res: Response) => {
  const prIdParam = Array.isArray(req.params.prId) ? req.params.prId[0] : req.params.prId;
  const pr = samplePRs.find(p => p.id === prIdParam || p.number.toString() === prIdParam);
  if (!pr) return res.status(404).json({ error: 'Pull request not found' });

  const parsedFiles = parseUnifiedDiff(pr.rawDiff);
  const risk = evaluateRegressionRisk(parsedFiles, 4);

  res.json({
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
  });
});

router.get('/:repoId/:prId/impact-graph', (req: Request, res: Response) => {
  const repoIdParam = (Array.isArray(req.params.repoId) ? req.params.repoId[0] : req.params.repoId) || 'krishisetu';
  const prIdParam = Array.isArray(req.params.prId) ? req.params.prId[0] : req.params.prId;
  const pr = samplePRs.find(p => p.id === prIdParam || p.number.toString() === prIdParam);
  if (!pr) return res.status(404).json({ error: 'Pull request not found' });

  const fixtureDir = resolveFixtureDir(repoIdParam);
  const analysis = analyzeDirectory(fixtureDir);
  const parsedFiles = parseUnifiedDiff(pr.rawDiff);

  const graphData = buildImpactGraph(
    parsedFiles,
    analysis.routes,
    analysis.apiCalls,
    analysis.components
  );

  res.json({
    prId: pr.id,
    prNumber: pr.number,
    ...graphData,
  });
});

export default router;
