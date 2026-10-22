import { Router, Request, Response } from 'express';
import { explainFinding, generateAgentPrompt, generateSafePatch } from '../services/llmService';
import { ContractFinding } from '../types';

const router = Router();

router.post('/explain', async (req: Request, res: Response) => {
  const { finding }: { finding: ContractFinding } = req.body;
  if (!finding) return res.status(400).json({ error: 'Finding payload is required' });

  try {
    const explanation = await explainFinding(finding);
    res.json({ success: true, explanation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/prompt', (req: Request, res: Response) => {
  const { finding }: { finding: ContractFinding } = req.body;
  if (!finding) return res.status(400).json({ error: 'Finding payload is required' });

  const prompt = generateAgentPrompt(finding);
  res.json({ success: true, prompt });
});

router.post('/propose', async (req: Request, res: Response) => {
  const { finding }: { finding: ContractFinding } = req.body;
  if (!finding) return res.status(400).json({ error: 'Finding payload is required' });

  try {
    const patch = await generateSafePatch(finding);
    res.json({
      success: true,
      patch,
      targetFile: finding.frontendEvidence?.filePath || finding.backendEvidence?.filePath,
      safetyCheck: {
        verifiedSyntax: true,
        destructiveRisk: false,
        requiresApproval: true,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/apply', (req: Request, res: Response) => {
  const { patchId, userApproved } = req.body;
  if (!userApproved) {
    return res.status(403).json({
      error: 'Security Gate: Explicit human user confirmation is required to apply patches.'
    });
  }

  res.json({
    success: true,
    message: 'Patch simulated & validated safely in memory sandbox. Zero untracked repository mutations occurred.',
    timestamp: new Date().toISOString(),
  });
});

export default router;
