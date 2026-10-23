export interface UserProfile {
  id: string;
  login: string;
  name: string;
  avatarUrl: string;
  email?: string | null;
  htmlUrl: string;
}

export interface RepositoryMetadata {
  id: string;
  name: string;
  owner: string;
  fullName: string;
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

export interface RouteDefinition {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  normalizedPath: string;
  filePath: string;
  lineNumber: number;
  parameters: string[];
  handlerName: string;
}

export interface ApiClientCall {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  normalizedPath: string;
  filePath: string;
  lineNumber: number;
  payloadFields?: string[];
  callerComponent: string;
}

export interface ContractFinding {
  id: string;
  title: string;
  severity: 'error' | 'warning' | 'info';
  type: 'path_mismatch' | 'method_mismatch' | 'missing_param' | 'orphan_backend' | 'unimplemented_frontend';
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
  confidence: number; // 0.0 - 1.0
  explanation: string;
  suggestedFix: string;
  proposedPatch?: string;
}

export interface PullRequestDiff {
  id: string;
  number: number;
  title: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  changedFiles: {
    path: string;
    additions: number;
    deletions: number;
    diffHunks: string[];
  }[];
  riskLevel: 'high' | 'medium' | 'low';
  riskSummary: string;
  affectedComponents: string[];
  affectedEndpoints: string[];
  missingTests: string[];
}

export interface ImpactGraphNode {
  id: string;
  label: string;
  type: 'changed_file' | 'endpoint' | 'component' | 'model' | 'test';
  status?: 'modified' | 'affected' | 'verified';
  filePath?: string;
}

export interface ImpactGraphEdge {
  source: string;
  target: string;
  relation: 'imports' | 'calls' | 'renders' | 'tests' | 'writes_to';
  confidence: number;
}

export interface ImpactGraphData {
  nodes: ImpactGraphNode[];
  edges: ImpactGraphEdge[];
  mermaidDiagram: string;
}
