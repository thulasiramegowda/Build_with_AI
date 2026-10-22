export interface RepoMetadata {
  id: string;
  name: string;
  owner: string;
  description: string;
  defaultBranch: string;
  languages: Record<string, number>;
  frameworks: string[];
  totalFiles: number;
  lastAnalyzed: string;
  fileCount?: number;
  detectedRoutesCount?: number;
  detectedApiCallsCount?: number;
  componentsCount?: number;
}

export interface ContractFinding {
  id: string;
  title: string;
  severity: 'error' | 'warning' | 'info';
  type: string;
  confidence: number;
  frontendEvidence?: {
    filePath: string;
    lineNumber: number;
    codeSnippet: string;
    expectedEndpoint: string;
  };
  backendEvidence?: {
    filePath: string;
    lineNumber: number;
    codeSnippet: string;
    actualEndpoint: string;
  };
  explanation: string;
  suggestedFix: string;
  proposedPatch?: string;
}

export interface PRSummary {
  id: string;
  number: number;
  title: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  createdAt: string;
  changedFilesCount: number;
  additions: number;
  deletions: number;
  riskLevel: 'high' | 'medium' | 'low';
}

export interface PRDetail extends PRSummary {
  rawDiff: string;
  riskSummary: string;
  changedFiles: {
    path: string;
    additions: number;
    deletions: number;
    diffHunks: string[];
    changedSymbols: string[];
  }[];
}

export interface ImpactGraphData {
  prId: string;
  prNumber: number;
  mermaidDiagram: string;
  nodes: {
    id: string;
    label: string;
    type: 'changed_file' | 'endpoint' | 'component' | 'model' | 'test';
    status?: string;
    filePath?: string;
  }[];
  edges: {
    source: string;
    target: string;
    relation: string;
    confidence: number;
  }[];
}

const API_BASE = '/api';

export const api = {
  async getAuthStatus() {
    const res = await fetch(`${API_BASE}/auth/status`);
    return res.json();
  },

  async getRepos(): Promise<RepoMetadata[]> {
    const res = await fetch(`${API_BASE}/repos`);
    return res.json();
  },

  async getRepoDetails(repoId: string): Promise<RepoMetadata> {
    const res = await fetch(`${API_BASE}/repos/${repoId}`);
    return res.json();
  },

  async getArchitecture(repoId: string): Promise<{ repoId: string; mermaidDiagram: string; layers: any[] }> {
    const res = await fetch(`${API_BASE}/repos/${repoId}/architecture`);
    return res.json();
  },

  async getContracts(repoId: string): Promise<{
    summary: { totalFindings: number; errorsCount: number; warningsCount: number; infoCount: number; verifiedContracts: number };
    findings: ContractFinding[];
  }> {
    const res = await fetch(`${API_BASE}/contracts/${repoId}`);
    return res.json();
  },

  async getPRs(repoId: string): Promise<PRSummary[]> {
    const res = await fetch(`${API_BASE}/prs/${repoId}`);
    return res.json();
  },

  async getPRDetail(repoId: string, prId: string): Promise<PRDetail> {
    const res = await fetch(`${API_BASE}/prs/${repoId}/${prId}`);
    return res.json();
  },

  async getImpactGraph(repoId: string, prId: string): Promise<ImpactGraphData> {
    const res = await fetch(`${API_BASE}/prs/${repoId}/${prId}/impact-graph`);
    return res.json();
  },

  async explainFinding(finding: ContractFinding): Promise<{ explanation: string }> {
    const res = await fetch(`${API_BASE}/patches/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finding }),
    });
    return res.json();
  },

  async getAgentPrompt(finding: ContractFinding): Promise<{ prompt: string }> {
    const res = await fetch(`${API_BASE}/patches/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finding }),
    });
    return res.json();
  },

  async proposePatch(finding: ContractFinding): Promise<{ patch: string; targetFile: string; safetyCheck: any }> {
    const res = await fetch(`${API_BASE}/patches/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finding }),
    });
    return res.json();
  },

  async applyPatch(patchId: string, userApproved: boolean): Promise<any> {
    const res = await fetch(`${API_BASE}/patches/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patchId, userApproved }),
    });
    return res.json();
  },
};
