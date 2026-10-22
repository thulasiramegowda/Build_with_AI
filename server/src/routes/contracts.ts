import { Router, Request, Response } from 'express';
import { analyzeDirectory } from '../engine/staticAnalyzer';
import { matchContracts } from '../engine/contractMatcher';
import { resolveFixtureDir } from '../utils/paths';

const router = Router();

router.get('/:repoId', (req: Request, res: Response) => {
  const repoId = (Array.isArray(req.params.repoId) ? req.params.repoId[0] : req.params.repoId) || 'krishisetu';
  const fixtureDir = resolveFixtureDir(repoId);
  const analysis = analyzeDirectory(fixtureDir);
  const findings = matchContracts(analysis.routes, analysis.apiCalls);

  const errorsCount = findings.filter(f => f.severity === 'error').length;
  const warningsCount = findings.filter(f => f.severity === 'warning').length;
  const infoCount = findings.filter(f => f.severity === 'info').length;

  res.json({
    repoId,
    timestamp: new Date().toISOString(),
    summary: {
      totalFindings: findings.length,
      errorsCount,
      warningsCount,
      infoCount,
      verifiedContracts: Math.max(0, analysis.routes.length - errorsCount),
    },
    findings,
  });
});

export default router;
