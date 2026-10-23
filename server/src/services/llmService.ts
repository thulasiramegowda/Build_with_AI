import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { ContractFinding } from '../types';

let genAI: GoogleGenerativeAI | null = null;
let mockClientOverridden = false;

// Supported models in priority order
const SUPPORTED_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-pro',
  'gemini-1.5-flash',
];

function getClient(): GoogleGenerativeAI | null {
  if (mockClientOverridden) return genAI;
  if (genAI) return genAI;
  if (config.geminiApiKey && config.geminiApiKey.trim().length > 0) {
    try {
      genAI = new GoogleGenerativeAI(config.geminiApiKey.trim());
      return genAI;
    } catch (err: any) {
      console.warn('[Gemini Service] Initialization failed, using deterministic engine:', err.message);
      return null;
    }
  }
  return null;
}

export const llmService = {
  isConfigured(): boolean {
    return Boolean(config.geminiApiKey && config.geminiApiKey.trim().length > 0);
  },

  getModelName(): string {
    const configured = config.geminiModel?.trim();
    if (configured && configured.length > 0) {
      return configured;
    }
    return 'gemini-2.5-flash';
  },

  // Test helper to allow injecting a mock generative AI client in unit tests
  _setClient(mockClient: GoogleGenerativeAI | null): void {
    genAI = mockClient;
    mockClientOverridden = true;
  },

  _resetClient(): void {
    genAI = null;
    mockClientOverridden = false;
  },

  /**
   * Safe test connection without exposing or logging the API key
   */
  async testConnection(): Promise<{ success: boolean; model: string; usingFallback: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        model: this.getModelName(),
        usingFallback: true,
        error: 'GEMINI_API_KEY is not configured in server .env',
      };
    }

    const client = getClient();
    if (!client) {
      return {
        success: false,
        model: this.getModelName(),
        usingFallback: true,
        error: 'Could not create Gemini client',
      };
    }

    const candidateModels = [this.getModelName(), ...SUPPORTED_MODELS.filter(m => m !== this.getModelName())];

    for (const modelName of candidateModels) {
      try {
        const model = client.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: 'Respond with OK.' }] }],
        });
        const resText = result.response.text();
        if (resText) {
          return {
            success: true,
            model: modelName,
            usingFallback: false,
          };
        }
      } catch (err: any) {
        // Continue to try next candidate model if 404
        if (!err.message?.includes('404')) {
          return {
            success: false,
            model: modelName,
            usingFallback: true,
            error: err.message?.replace(/key=[^&\s]+/g, 'key=[REDACTED]'),
          };
        }
      }
    }

    return {
      success: false,
      model: this.getModelName(),
      usingFallback: true,
      error: 'None of the candidate Gemini models were reachable',
    };
  },

  /**
   * Explain an API contract mismatch using Gemini, with deterministic fallback
   */
  async explainFindingDetailed(finding: ContractFinding): Promise<{ explanation: string; source: 'gemini' | 'deterministic_fallback'; model?: string }> {
    const client = getClient();
    if (client) {
      const candidateModels = [this.getModelName(), ...SUPPORTED_MODELS.filter(m => m !== this.getModelName())];
      for (const modelName of candidateModels) {
        try {
          const model = client.getGenerativeModel({ model: modelName });
          const prompt = `You are CodePulse, a senior staff software architect. Explain this verified API contract mismatch concisely to an engineering team:
Title: ${finding.title}
Severity: ${finding.severity.toUpperCase()}
Type: ${finding.type}
Frontend Evidence: ${finding.frontendEvidence ? `${finding.frontendEvidence.filePath}:${finding.frontendEvidence.lineNumber} -> ${finding.frontendEvidence.expectedEndpoint}` : 'None'}
Backend Evidence: ${finding.backendEvidence ? `${finding.backendEvidence.filePath}:${finding.backendEvidence.lineNumber} -> ${finding.backendEvidence.actualEndpoint}` : 'None'}
Baseline Diagnosis: ${finding.explanation}

Provide a 2-paragraph architectural breakdown:
1. Root cause and runtime impact on end users.
2. Exact recommended remediation and verification steps.
Do not invent any endpoints, parameters, or files outside the provided evidence.`;

          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API call timed out')), 3000)
          );
          const result = (await Promise.race([model.generateContent(prompt), timeout])) as any;
          const text = result.response.text();
          if (text && text.trim().length > 0) {
            return {
              explanation: text.trim(),
              source: 'gemini',
              model: modelName,
            };
          }
        } catch (e: any) {
          // If error is not a 404 model mismatch, stop and fallback
          if (!e.message?.includes('404')) {
            break;
          }
        }
      }
    }

    // Deterministic high-quality fallback explanation
    const fallbackText = `### Root Cause Analysis & Architectural Impact
${finding.explanation}

When the frontend client triggers this request, the browser or HTTP client encounters an immediate network protocol breakdown. Specifically, requests directed to an unmapped path or with mismatched HTTP semantics will be rejected with an HTTP 404 Not Found or 405 Method Not Allowed status.

### Recommended Remediation & Verification
1. **Source Fix:** ${finding.suggestedFix}
2. **Contract Alignment:** Ensure shared TypeScript request/response contracts are synchronized across both client and server packages.
3. **Automated Verification:** Run the integration test suite or execute \`npm test\` to ensure no regression occurs in downstream components.`;

    return {
      explanation: fallbackText,
      source: 'deterministic_fallback',
    };
  },

  async explainFinding(finding: ContractFinding): Promise<string> {
    const res = await this.explainFindingDetailed(finding);
    return res.explanation;
  },

  /**
   * Explain discovered repository architecture based purely on real discovered files
   */
  async explainArchitecture(
    repoInfo: { name: string; owner: string; frameworks: string[]; fileCount: number; routesCount: number; folders: string[] }
  ): Promise<{ text: string; source: 'gemini' | 'deterministic_fallback'; model?: string }> {
    const client = getClient();
    if (client) {
      try {
        const model = client.getGenerativeModel({ model: this.getModelName() });
        const prompt = `You are CodePulse, a software architecture intelligence system. Provide a concise architectural overview for the repository "${repoInfo.owner}/${repoInfo.name}".
Discovered Context (grounded strictly in AST static analysis):
- Detected Tiers / Folders: ${repoInfo.folders.join(', ') || 'Root structure'}
- Discovered Frameworks: ${repoInfo.frameworks.join(', ') || 'Custom stack'}
- Total Scanned Source Files: ${repoInfo.fileCount}
- Detected REST Route Handlers: ${repoInfo.routesCount}

Rules:
- Write exactly 2 brief paragraphs.
- Paragraph 1: Describe the multi-tier organization and how data flows across tiers (e.g. frontend -> backend API -> data/blockchain/probes).
- Paragraph 2: Highlight key architectural strengths or integration surfaces to monitor.
- Strictly adhere to the discovered folders; do not hallucinate components or technologies not mentioned.`;

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API call timed out')), 2500)
        );
        const result = (await Promise.race([model.generateContent(prompt), timeout])) as any;
        const text = result.response.text();
        if (text && text.trim().length > 0) {
          return {
            text: text.trim(),
            source: 'gemini',
            model: this.getModelName(),
          };
        }
      } catch (err: any) {
        // Fallback
      }
    }

    const fallback = `### System Architecture Analysis for ${repoInfo.name}
The repository is organized across ${repoInfo.folders.length > 0 ? repoInfo.folders.join(', ') : 'integrated tiers'}, incorporating ${repoInfo.frameworks.join(', ') || 'standard web technologies'}. Static AST extraction mapped ${repoInfo.fileCount} verified source files and identified ${repoInfo.routesCount} active route interfaces.

Data flows from the client interfaces through API gateway handlers down into data models and backend subsystems. CodePulse tracks these boundaries to verify contract alignment across tiers and prevent breaking changes.`;

    return {
      text: fallback,
      source: 'deterministic_fallback',
    };
  },

  /**
   * Synthesize safe coding agent prompt
   */
  generateAgentPrompt(finding: ContractFinding): string {
    return `# CODING AGENT INSTRUCTION: Resolve API Contract Mismatch

## Context & Finding
Issue: ${finding.title}
Severity: ${finding.severity.toUpperCase()}
Confidence: ${Math.round(finding.confidence * 100)}%

## Code Evidence
${finding.frontendEvidence ? `- Frontend Location: \`${finding.frontendEvidence.filePath}:${finding.frontendEvidence.lineNumber}\`
  Calling Code: \`${finding.frontendEvidence.codeSnippet}\`
  Expected: \`${finding.frontendEvidence.expectedEndpoint}\`` : ''}

${finding.backendEvidence ? `- Backend Location: \`${finding.backendEvidence.filePath}:${finding.backendEvidence.lineNumber}\`
  Route Definition: \`${finding.backendEvidence.codeSnippet}\`
  Implemented: \`${finding.backendEvidence.actualEndpoint}\`` : ''}

## Task
1. Inspect the source file at \`${finding.frontendEvidence?.filePath || finding.backendEvidence?.filePath}\`.
2. Apply the following correction:
   ${finding.suggestedFix}
3. Maintain TypeScript types and ensure all caller components continue compiling cleanly.
4. Do not alter any unrelated business logic or exported signatures.`;
  },

  /**
   * Generate safe unified diff patch
   */
  async generateSafePatchDetailed(finding: ContractFinding): Promise<{ patch: string; source: 'gemini' | 'deterministic_template' }> {
    if (finding.proposedPatch) {
      return { patch: finding.proposedPatch, source: 'deterministic_template' };
    }

    const targetFile = finding.frontendEvidence?.filePath || finding.backendEvidence?.filePath || 'unknown.ts';
    const client = getClient();
    if (client) {
      try {
        const model = client.getGenerativeModel({ model: this.getModelName() });
        const prompt = `Generate a non-destructive unified diff patch (.patch) to resolve this API contract mismatch:
Target File: ${targetFile}
Issue: ${finding.title}
Evidence Snippet: ${finding.frontendEvidence?.codeSnippet || finding.backendEvidence?.codeSnippet || ''}
Remediation: ${finding.suggestedFix}

Rules:
- Output ONLY the unified diff block beginning with --- a/${targetFile} and +++ b/${targetFile}.
- Modify ONLY the specific mismatched line.
- Do not add markdown backticks around the output.`;

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API call timed out')), 2500)
        );
        const result = (await Promise.race([model.generateContent(prompt), timeout])) as any;
        const text = result.response.text();
        if (text && text.includes('--- a/')) {
          return { patch: text.trim(), source: 'gemini' };
        }
      } catch (e) {
        // Fallback to template
      }
    }

    const fallbackPatch = `--- a/${targetFile}
+++ b/${targetFile}
@@ -10,4 +10,4 @@
-// CodePulse Patch Proposal for ${finding.id}
+// Corrected endpoint contract: ${finding.suggestedFix}
`;
    return { patch: fallbackPatch, source: 'deterministic_template' };
  },

  async generateSafePatch(finding: ContractFinding): Promise<string> {
    const res = await this.generateSafePatchDetailed(finding);
    return res.patch;
  }
};

// Backward compatible functional exports
export const explainFinding = async (finding: ContractFinding) => {
  return llmService.explainFinding(finding);
};
export const generateAgentPrompt = (finding: ContractFinding) => llmService.generateAgentPrompt(finding);
export const generateSafePatch = async (finding: ContractFinding) => {
  return llmService.generateSafePatch(finding);
};
