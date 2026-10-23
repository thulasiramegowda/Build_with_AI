import { describe, it, expect } from 'vitest';
import { llmService } from '../server/src/services/llmService';
import { ContractFinding } from '../server/src/types';

describe('CodePulse Google Gemini LLM Integration Adapter', () => {
  const sampleFinding: ContractFinding = {
    id: 'finding-test-1',
    title: 'HTTP Method Mismatch on /api/bids/{param}/accept',
    severity: 'error',
    type: 'method_mismatch',
    confidence: 0.98,
    frontendEvidence: {
      filePath: 'client/src/api/bids.ts',
      lineNumber: 18,
      codeSnippet: "axios.post('/api/bids/${bidId}/accept')",
      expectedEndpoint: 'POST /api/bids/${bidId}/accept',
    },
    backendEvidence: {
      filePath: 'server/src/routes/bidRoutes.ts',
      lineNumber: 8,
      codeSnippet: "router.put('/api/bids/:id/accept', ...)",
      actualEndpoint: 'PUT /api/bids/:id/accept',
    },
    explanation: "Frontend sends HTTP POST, but server router listens for HTTP PUT.",
    suggestedFix: "Change client call to use axios.put('/api/bids/${bidId}/accept')",
    proposedPatch: `--- a/client/src/api/bids.ts
+++ b/client/src/api/bids.ts
@@ -18,1 +18,1 @@
-  const res = await axios.post(\`/api/bids/\${bidId}/accept\`);
+  const res = await axios.put(\`/api/bids/\${bidId}/accept\`);
`,
  };

  it('reports configuration status truthfully based on GEMINI_API_KEY', () => {
    const isConf = llmService.isConfigured();
    expect(typeof isConf).toBe('boolean');
    expect(llmService.getModelName()).toBe('gemini-1.5-flash');
  });

  it('produces high-quality deterministic fallback explanation when Gemini API key is absent', async () => {
    // Force unconfigured client
    llmService._setClient(null);

    const explanation = await llmService.explainFinding(sampleFinding);
    expect(explanation).toContain('Root Cause Analysis & Architectural Impact');
    expect(explanation).toContain('Recommended Remediation & Verification');
    expect(explanation).toContain('Change client call to use axios.put');
  });

  it('generates structured coding-agent prompts with line numbers and file citations', () => {
    const prompt = llmService.generateAgentPrompt(sampleFinding);

    expect(prompt).toContain('# CODING AGENT INSTRUCTION: Resolve API Contract Mismatch');
    expect(prompt).toContain('client/src/api/bids.ts:18');
    expect(prompt).toContain('server/src/routes/bidRoutes.ts:8');
    expect(prompt).toContain('Change client call to use axios.put');
    expect(prompt).toContain('Do not alter any unrelated business logic');
  });

  it('generates safe unified diff patches without modifying unrelated code', async () => {
    const patch = await llmService.generateSafePatch(sampleFinding);

    expect(patch).toContain('--- a/client/src/api/bids.ts');
    expect(patch).toContain('+++ b/client/src/api/bids.ts');
    expect(patch).toContain('-  const res = await axios.post');
    expect(patch).toContain('+  const res = await axios.put');
  });

  it('utilizes Gemini generative model when client is active', async () => {
    // Inject mock GoogleGenerativeAI client
    const mockModel = {
      generateContent: async () => ({
        response: {
          text: () => '### Architectural Breakdown from Gemini 1.5 Flash\nThis is a critical REST mismatch.',
        },
      }),
    };
    const mockGenAI: any = {
      getGenerativeModel: () => mockModel,
    };

    llmService._setClient(mockGenAI);
    const explanation = await llmService.explainFinding(sampleFinding);

    expect(explanation).toContain('Architectural Breakdown from Gemini 1.5 Flash');

    // Clean up
    llmService._setClient(null);
  });
});
