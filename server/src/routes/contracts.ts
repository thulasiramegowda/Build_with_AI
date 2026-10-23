import { Router, Request, Response } from 'express';
import { matchContracts } from '../engine/contractMatcher';
import { analysisCache } from './repos';
import { sessionStore } from '../services/sessionStore';
import { getSessionToken } from './auth';
import { repositoryDao } from '../db/repositoryDao';

const router = Router();

router.get('/:repoId', async (req: Request, res: Response) => {
  const repoId = (Array.isArray(req.params.repoId) ? req.params.repoId[0] : req.params.repoId) || '';
  const token = getSessionToken(req);
  const session = await sessionStore.getSessionAsync(token);

  // Protected route access check
  if (repoId === 'krishisetu') {
    if (!sessionStore.isDemoModeActive() && !session) {
      return res.status(401).json({
        error: 'Unauthorized. Enable Demo Mode or sign in with GitHub to view contract analysis.',
      });
    }
  } else if (!session) {
    return res.status(401).json({
      error: 'Authentication required to inspect repository API contracts.',
    });
  }

  let cached = analysisCache.get(repoId);
  if (!cached) {
    cached = await repositoryDao.getLatestAnalysis(repoId);
    if (cached) analysisCache.set(repoId, cached);
  }

  if (!cached) {
    return res.json({
      repoId,
      analysisStatus: 'unscanned',
      summary: null,
      findings: [],
      message: 'Repository has not been analyzed yet. Run analysis to detect API contract mismatches.',
    });
  }

  const findings = matchContracts(cached.routes, cached.apiCalls);
  const errorsCount = findings.filter(f => f.severity === 'error').length;
  const warningsCount = findings.filter(f => f.severity === 'warning').length;
  const infoCount = findings.filter(f => f.severity === 'info').length;

  // Persist findings to MySQL if active
  repositoryDao.saveFindings(repoId, findings).catch(() => {});

  res.json({
    repoId,
    analysisStatus: 'analyzed',
    timestamp: cached.analyzedAt,
    summary: {
      totalFindings: findings.length,
      errorsCount,
      warningsCount,
      infoCount,
      verifiedContracts: Math.max(0, cached.routes.length - errorsCount),
    },
    findings,
  });
});

export default router;
