import { describe, it, expect } from 'vitest';
import path from 'path';
import { analyzeDirectory, normalizePath } from '../server/src/engine/staticAnalyzer';
import { matchContracts } from '../server/src/engine/contractMatcher';
import { parseUnifiedDiff, evaluateRegressionRisk } from '../server/src/engine/diffParser';
import { buildImpactGraph } from '../server/src/engine/impactBuilder';

describe('CodePulse Repository Intelligence Engine', () => {
  const fixtureDir = path.resolve(__dirname, '../server/src/fixtures/krishisetu');

  it('normalizes Express and client routes accurately', () => {
    expect(normalizePath('/api/crops/:id')).toBe('/api/crops/{param}');
    expect(normalizePath('/api/crops/${cropId}')).toBe('/api/crops/{param}');
    expect(normalizePath('/api/crops/')).toBe('/api/crops');
    expect(normalizePath('//api//v1//crops/')).toBe('/api/v1/crops');
  });

  it('statically extracts routes, client calls, components, and models from KrishiSetu', () => {
    const analysis = analyzeDirectory(fixtureDir);

    expect(analysis.fileCount).toBeGreaterThan(5);
    expect(analysis.routes.length).toBeGreaterThanOrEqual(4);
    expect(analysis.apiCalls.length).toBeGreaterThanOrEqual(3);

    const routePaths = analysis.routes.map(r => r.path);
    expect(routePaths).toContain('/api/crops');
    expect(routePaths).toContain('/api/crops/:id/bids');
    expect(routePaths).toContain('/api/market-prices');

    const clientUrls = analysis.apiCalls.map(c => c.url);
    expect(clientUrls).toContain('/api/v1/farmer/crops');
    expect(clientUrls).toContain('/api/market-prices');
  });

  it('detects contract mismatches with evidence and line numbers', () => {
    const analysis = analyzeDirectory(fixtureDir);
    const findings = matchContracts(analysis.routes, analysis.apiCalls);

    expect(findings.length).toBeGreaterThan(0);

    // 1. Path discrepancy: /api/v1/farmer/crops vs /api/crops
    const pathMismatch = findings.find(f => f.type === 'path_mismatch');
    expect(pathMismatch).toBeDefined();
    expect(pathMismatch?.frontendEvidence?.filePath).toContain('crops.ts');
    expect(pathMismatch?.backendEvidence?.filePath).toContain('cropRoutes.ts');

    // 2. HTTP Method mismatch: POST vs PUT for /api/bids/{param}/accept
    const methodMismatch = findings.find(f => f.type === 'method_mismatch');
    expect(methodMismatch).toBeDefined();
    expect(methodMismatch?.frontendEvidence?.codeSnippet).toContain('post');
    expect(methodMismatch?.backendEvidence?.codeSnippet).toContain('put');

    // 3. Missing query parameter on /api/market-prices
    const paramMismatch = findings.find(f => f.type === 'missing_param');
    expect(paramMismatch).toBeDefined();
    expect(paramMismatch?.title).toContain('region');
  });

  it('parses unified git diffs and calculates regression risks', () => {
    const rawDiff = `diff --git a/server/src/routes/bidRoutes.ts b/server/src/routes/bidRoutes.ts
index a1b2c3d..e4f5g6h 100644
--- a/server/src/routes/bidRoutes.ts
+++ b/server/src/routes/bidRoutes.ts
@@ -5,3 +5,5 @@ const router = Router();
 router.get('/api/crops/:id/bids', getBidsByCrop);
+router.post('/api/bids/:id/counter', counterHandler);
`;
    const parsed = parseUnifiedDiff(rawDiff);
    expect(parsed.length).toBe(1);
    expect(parsed[0].path).toBe('server/src/routes/bidRoutes.ts');
    expect(parsed[0].additions).toBe(1);

    const risk = evaluateRegressionRisk(parsed, 4);
    expect(['high', 'medium', 'low']).toContain(risk.riskLevel);
  });

  it('constructs Mermaid Change Impact Graph linking changed routes to UI components', () => {
    const analysis = analyzeDirectory(fixtureDir);
    const rawDiff = `diff --git a/server/src/routes/cropRoutes.ts b/server/src/routes/cropRoutes.ts
index a1b2c3d..e4f5g6h 100644
--- a/server/src/routes/cropRoutes.ts
+++ b/server/src/routes/cropRoutes.ts
@@ -5,2 +5,3 @@ const router = Router();
 router.get('/api/crops', getCrops);
+router.get('/api/crops/featured', getFeaturedCrops);
`;
    const parsed = parseUnifiedDiff(rawDiff);
    const graph = buildImpactGraph(parsed, analysis.routes, analysis.apiCalls, analysis.components);

    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.mermaidDiagram).toContain('graph TD');
    expect(graph.mermaidDiagram).toContain('classDef modified');
  });
});
