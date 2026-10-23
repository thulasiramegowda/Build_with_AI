export interface UserProfile {
  id: string;
  login: string;
  name: string;
  avatarUrl: string;
  email?: string | null;
  htmlUrl: string;
}

export interface RepoMetadata {
  id: string;
  name: string;
  owner: string;
  fullName?: string;
  description: string | null;
  defaultBranch: string;
  languages: Record<string, number>;
  frameworks: string[];
  totalFiles?: number;
  lastAnalyzed?: string | null;
  isFixture?: boolean;
  analysisStatus?: 'unscanned' | 'analyzing' | 'analyzed' | 'failed';
  detectedRoutesCount?: number;
  detectedApiCallsCount?: number;
  componentsCount?: number;
  modelsCount?: number;
  contractErrorsCount?: number;
  openPRsCount?: number;
  commitSha?: string | null;
  topLevelFolders?: string[];
  aiExplanation?: string | null;
  explanationProvider?: 'gemini' | 'deterministic_fallback';
  url?: string;
  isPrivate?: boolean;
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
  isFixture?: boolean;
}

export interface PRDetail extends PRSummary {
  rawDiff: string;
  riskSummary: string;
  changedFiles: {
    path: string;
    additions: number;
    deletions: number;
    diffHunks: string[];
    changedSymbols?: string[];
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

export interface AuthStatusResponse {
  authenticated: boolean;
  mode: 'github' | 'demo' | 'unauthenticated';
  user: UserProfile | null;
  githubConfigured: boolean;
  geminiConfigured: boolean;
  isDemoModeActive?: boolean;
  setupRequired?: {
    message: string;
    requiredEnvVars: string[];
    callbackUrl: string;
  } | null;
  permissions?: string[];
}

const API_BASE = '/api';

async function fetchJson<T = any>(endpoint: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...init,
    credentials: 'include', // Automatically send and receive HttpOnly session cookies
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  async getAuthStatus(): Promise<AuthStatusResponse> {
    return fetchJson<AuthStatusResponse>('/auth/status');
  },

  async toggleDemoMode(enable?: boolean): Promise<{ success: boolean; isDemoModeActive: boolean }> {
    return fetchJson('/auth/demo-toggle', {
      method: 'POST',
      body: JSON.stringify(enable !== undefined ? { enable } : {}),
    });
  },

  async logout(): Promise<void> {
    await fetchJson('/auth/logout', {
      method: 'POST',
    });
  },

  async getRepos(): Promise<RepoMetadata[]> {
    return fetchJson<RepoMetadata[]>('/repos');
  },

  async getRepoDetails(repoId: string): Promise<RepoMetadata> {
    return fetchJson<RepoMetadata>(`/repos/${encodeURIComponent(repoId)}`);
  },

  async analyzeRepo(repoId: string): Promise<{ success: boolean; metrics: any; analysisStatus: string }> {
    return fetchJson('/repos/analyze', {
      method: 'POST',
      body: JSON.stringify({ repoId }),
    });
  },

  async getArchitecture(repoId: string): Promise<{ repoId: string; mermaidDiagram: string; layers: any[]; error?: string }> {
    return fetchJson(`/repos/${encodeURIComponent(repoId)}/architecture`);
  },

  async getContracts(repoId: string): Promise<{
    analysisStatus?: string;
    summary: { totalFindings: number; errorsCount: number; warningsCount: number; infoCount: number; verifiedContracts: number } | null;
    findings: ContractFinding[];
    message?: string;
  }> {
    return fetchJson(`/contracts/${encodeURIComponent(repoId)}`);
  },

  async getPRs(repoId: string): Promise<PRSummary[]> {
    return fetchJson<PRSummary[]>(`/prs/${encodeURIComponent(repoId)}`);
  },

  async getPRDetail(repoId: string, prId: string): Promise<PRDetail> {
    return fetchJson<PRDetail>(`/prs/${encodeURIComponent(repoId)}/${encodeURIComponent(prId)}`);
  },

  async getImpactGraph(repoId: string, prId: string): Promise<ImpactGraphData> {
    return fetchJson<ImpactGraphData>(`/prs/${encodeURIComponent(repoId)}/${encodeURIComponent(prId)}/impact-graph`);
  },

  async explainFinding(finding: ContractFinding): Promise<{ explanation: string }> {
    return fetchJson('/patches/explain', {
      method: 'POST',
      body: JSON.stringify({ finding }),
    });
  },

  async getAgentPrompt(finding: ContractFinding): Promise<{ prompt: string }> {
    return fetchJson('/patches/prompt', {
      method: 'POST',
      body: JSON.stringify({ finding }),
    });
  },

  async proposePatch(finding: ContractFinding): Promise<{ patch: string; targetFile: string; safetyCheck: any }> {
    return fetchJson('/patches/propose', {
      method: 'POST',
      body: JSON.stringify({ finding }),
    });
  },

  async applyPatch(patchId: string, userApproved: boolean): Promise<any> {
    return fetchJson('/patches/apply', {
      method: 'POST',
      body: JSON.stringify({ patchId, userApproved }),
    });
  },
};
