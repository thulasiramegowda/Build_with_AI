import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { ContractFinding, PullRequestDiff } from '../types';

let genAI: GoogleGenerativeAI | null = null;
if (config.geminiApiKey) {
  try {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  } catch (err) {
    console.warn('Failed to initialize GoogleGenerativeAI, falling back to deterministic engine', err);
  }
}

export async function explainFinding(finding: ContractFinding): Promise<string> {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are CodePulse, a senior staff software architect. Explain this detected API contract bug concisely to an engineering team:
Title: ${finding.title}
Severity: ${finding.severity}
Type: ${finding.type}
Frontend Evidence: ${finding.frontendEvidence ? JSON.stringify(finding.frontendEvidence) : 'None'}
Backend Evidence: ${finding.backendEvidence ? JSON.stringify(finding.backendEvidence) : 'None'}
Baseline Explanation: ${finding.explanation}

Provide a 2-paragraph architectural breakdown:
1. Root cause and runtime impact on end users.
2. Exact recommended remediation and verification steps.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (e) {
      console.warn('Gemini inference error, using deterministic explanation', e);
    }
  }

  // Deterministic high-quality fallback explanation
  return `### Root Cause Analysis & Architectural Impact
${finding.explanation}

When the frontend client triggers this request, the browser or HTTP client encounters an immediate network protocol breakdown. Specifically, requests directed to an unmapped path or with mismatched HTTP semantics will be rejected with an HTTP 404 Not Found or 405 Method Not Allowed status.

### Recommended Remediation & Verification
1. **Source Fix:** ${finding.suggestedFix}
2. **Contract Alignment:** Ensure shared TypeScript request/response contracts are synchronized across both client and server packages.
3. **Automated Verification:** Run the integration test suite or execute \`npm test\` to ensure no regression occurs in downstream components.`;
}

export function generateAgentPrompt(finding: ContractFinding): string {
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
}

export async function generateSafePatch(finding: ContractFinding): Promise<string> {
  if (finding.proposedPatch) {
    return finding.proposedPatch;
  }

  // Fallback unified diff template
  const targetFile = finding.frontendEvidence?.filePath || finding.backendEvidence?.filePath || 'unknown.ts';
  return `--- a/${targetFile}
+++ b/${targetFile}
@@ -10,4 +10,4 @@
-// CodePulse Patch Proposal for ${finding.id}
+// Corrected endpoint contract: ${finding.suggestedFix}
`;
}
