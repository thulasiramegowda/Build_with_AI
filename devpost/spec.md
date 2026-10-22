---
doc: spec
status: approved
---

# CodePulse — Technical Spec

## How This Works, In Plain Language
CodePulse is a full-stack developer intelligence platform composed of two collaborating parts:
1. **The Analysis & Intelligence Backend (Node.js/Express/TypeScript):**
   - Ingests repository files either directly from local directories (in Demo Mode) or via GitHub REST API (in Live Mode).
   - Runs a fast, deterministic static analyzer that scans source files for route declarations (e.g. Express `app.get`, `router.post`), client HTTP calls (`fetch`, `axios`), component imports, and data schemas.
   - Normalizes routes, compares frontend requests with backend definitions to catch contract bugs (URL mismatches, wrong HTTP verbs, missing parameters), and computes confidence scores with exact line citations.
   - Given a pull request diff, parses the modified symbols and traverses the dependency graph to construct an interactive Mermaid blast-radius graph.
   - Connects to the Gemini LLM API to generate natural-language explanations, agent prompts, and unified diff patches, falling back to heuristic templates if no API key is supplied.
2. **The High-Craft Frontend (React/Vite/TypeScript/Tailwind CSS):**
   - Provides a responsive, accessible developer dashboard with a collapsible navigation sidebar and topbar context switcher.
   - Features dedicated views for Architecture Exploration, Contract Intelligence, PR Reviews, Change Impact Visualization (rendering live interactive Mermaid.js diagrams), and Settings.
   - Supports 1-click exploration of the bundled *KrishiSetu* full-stack project so anyone can test the system without setup friction.

## The Core Journey Through the System
1. **Context Setup:** User opens CodePulse at `http://localhost:5173`. Frontend queries `GET /api/auth/status`. If unauthenticated, user sees the option to click "Launch Demo Workspace (KrishiSetu)" or "Connect with GitHub".
2. **Repo Ingestion:** User selects *KrishiSetu*. Frontend requests `POST /api/repos/analyze` with `{ repoId: "krishisetu" }`. The backend analyzer parses the frontend directory (`/client`) and backend directory (`/server`), cataloging 18 routes, 14 API calls, and dependencies.
3. **Architecture Mapping:** Frontend renders `GET /api/repos/krishisetu/architecture`, rendering the system tier diagram via Mermaid.js.
4. **Contract Verification:** User clicks "API Contracts". Frontend displays `GET /api/repos/krishisetu/contracts`. Backend highlights 3 critical discrepancies (e.g., client calling `/api/v1/farmer/crops` with missing query params against backend `/api/crops`).
5. **PR Risk Review:** User switches to "PR Reviews" and chooses PR #14 (`feature/realtime-bidding`). Backend parses the diff, identifies changed controller methods, and flags potential regression in farmer notification listeners.
6. **Change Impact Graph:** User clicks "Change Impact". Frontend requests `GET /api/repos/krishisetu/prs/14/impact-graph` and renders the interactive Mermaid dependency tree.
7. **Safe Remediation:** User clicks "Propose Code Patch". Backend generates a clean unified diff (`.patch`). User reviews the line-by-line diff and validation status.

## Stack
- **Frontend:**
  - `react` (^18.3.0) & `react-dom`: Component rendering. [react.dev](https://react.dev)
  - `vite` (^5.4.0): Fast developer build tool. [vitejs.dev](https://vitejs.dev)
  - `typescript` (^5.5.0): Static typing and contract safety. [typescriptlang.org](https://typescriptlang.org)
  - `tailwindcss` (^3.4.0) & `@tailwindcss/typography`: Modern utility styling. [tailwindcss.com](https://tailwindcss.com)
  - `lucide-react`: Crisp developer icons. [lucide.dev](https://lucide.dev)
  - `mermaid` (^10.9.0): Dynamic client-side diagram rendering. [mermaid.js.org](https://mermaid.js.org)
- **Backend:**
  - `express` (^4.19.0): Robust HTTP API routing. [expressjs.com](https://expressjs.com)
  - `cors`: Secure cross-origin requests.
  - `dotenv`: Server-side environment variable management.
  - `@google/genai` or `@google/generative-ai`: Google Gemini API adapter for explanations and patch generation. [ai.google.dev](https://ai.google.dev)
- **Testing & Verification:**
  - `vitest` (^2.0.0): Fast unit and integration test runner for route matching, contract analysis, and graph generation. [vitest.dev](https://vitest.dev)

## Where It Runs and How Someone Tries It
- **Runtime:** Node.js v18+ on Windows/macOS/Linux.
- **Port:** Frontend on `http://localhost:5173`, Backend on `http://localhost:3001`.
- **Environment Setup:**
  - Copy `.env.example` to `.env` (optional: add `GEMINI_API_KEY` for live AI generation; built-in intelligent heuristics activate automatically if omitted).
- **Execution Command:**
  ```bash
  npm run dev
  ```
  (Runs both backend and frontend concurrently).
- **Automated Tests:**
  ```bash
  npm test
  ```

## Look and Feel
- **Theme:** Clean, modern developer light mode.
- **Surfaces:** Pure white (`#ffffff`) main panels, neutral background (`#f8fafc`), subtle borders (`#e2e8f0`).
- **Accents:** Electric deep blue (`#2563eb`), hover state (`#1d4ed8`), emerald (`#10b981`) for passing contracts, amber (`#f59e0b`) for warnings, rose (`#ef4444`) for breaking mismatches.
- **Typography:** `Inter` or system UI font for UI, `ui-monospace` for routes, symbols, and diffs.

## Components

### 1. AppShell & Navigation
Main layout wrapper providing responsive sidebar navigation, topbar context breadcrumbs, active repository selector, and mode status indicator.
PRD ref: `prd.md > Screens and Layout > Application Shell`.

### 2. OverviewWorkspace
Dashboard showcasing repository overview, detected frameworks, key entry points, component counts, and health statistics.
PRD ref: `prd.md > Screens and Layout > 2. Overview & Repository Intelligence Workspace`.

### 3. ArchitectureExplorer
Renders high-level client-server-database topology with interactive filtering by tier.
PRD ref: `prd.md > Screens and Layout > 3. Architecture Explorer`.

### 4. ApiContractIntelligence
Audits frontend API calls against backend route handlers. Surfaces URL mismatches, parameter discrepancies, and orphan endpoints with line citations.
PRD ref: `prd.md > Screens and Layout > 4. API Contract Intelligence`.

### 5. PullRequestReviewer
Inspects PR diffs, highlights modified symbols, identifies regression risks, and flags untested modified paths.
PRD ref: `prd.md > Screens and Layout > 5. Pull Request Reviews`.

### 6. ChangeImpactExplorer
Signature visual component: renders interactive Mermaid graph of modified nodes and downstream dependencies with interactive inspection drawer.
PRD ref: `prd.md > Screens and Layout > 6. Change Impact Explorer (Signature Feature)`.

### 7. SafePatchModal & PromptGenerator
Interactive modal for reviewing generated coding agent prompts and unified code diff patches before any manual approval.
PRD ref: `prd.md > Features and Behavior > Safe Patch & Prompt Generator`.

### 8. SettingsView
Displays GitHub connection status, API keys presence, and local demo cache controls.
PRD ref: `prd.md > Screens and Layout > 7. Settings & Integrations`.

## Data Model

```typescript
export interface RepositoryMetadata {
  id: string;
  name: string;
  owner: string;
  description: string;
  defaultBranch: string;
  languages: Record<string, number>;
  frameworks: string[];
  totalFiles: number;
  lastAnalyzed: string;
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
```

## File Structure

```
Devpost_AI_Project/
├── package.json                   # Root workspace scripts
├── .gitignore                     # Git ignore rules (secrets & profile)
├── .env.example                   # Environment template
├── devpost/                       # Devpost hackathon artifacts
│   ├── learner-profile.md
│   ├── scope.md
│   ├── prd.md
│   ├── spec.md
│   └── checklist.md
├── server/                        # Express Backend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # Server entry point
│       ├── config.ts              # Env & provider config
│       ├── routes/                # API controllers
│       │   ├── auth.ts
│       │   ├── repos.ts
│       │   ├── contracts.ts
│       │   ├── prs.ts
│       │   └── patches.ts
│       ├── engine/                # Core Analysis Pipeline
│       │   ├── staticAnalyzer.ts  # Route & client call regex/AST scanner
│       │   ├── contractMatcher.ts # Cross-tier comparison & confidence scoring
│       │   ├── diffParser.ts      # Unified git diff parser
│       │   └── impactBuilder.ts   # Graph constructor & Mermaid generator
│       ├── services/
│       │   ├── llmService.ts      # Gemini client & heuristic fallback
│       │   └── githubService.ts   # GitHub REST API adapter
│       └── fixtures/              # Bundled realistic repositories
│           └── krishisetu/        # Full-stack agri-commerce app fixture
├── client/                        # React Frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/                   # Typed API client
│       │   └── client.ts
│       ├── components/            # Reusable UI components
│       │   ├── AppShell.tsx
│       │   ├── Sidebar.tsx
│       │   ├── Topbar.tsx
│       │   ├── MermaidViewer.tsx
│       │   ├── DiffViewer.tsx
│       │   ├── SafePatchModal.tsx
│       │   └── Badge.tsx
│       └── views/                 # Top-level screen views
│           ├── OverviewView.tsx
│           ├── ArchitectureView.tsx
│           ├── ContractsView.tsx
│           ├── PRReviewsView.tsx
│           ├── ChangeImpactView.tsx
│           └── SettingsView.tsx
└── tests/                         # Automated Vitest test suite
    ├── contractMatcher.test.ts
    ├── staticAnalyzer.test.ts
    ├── diffParser.test.ts
    └── impactBuilder.test.ts
```

## External Services and Dependencies
- **Google Gemini API:** Optional LLM inference for rich explanations and contextual patch generation. Uses `@google/genai` or `@google/generative-ai`. If `GEMINI_API_KEY` is not present, CodePulse's deterministic rule engine immediately takes over without crashing.
- **GitHub REST API / OAuth:** Optional live repository reading. Uses standard Octokit / fetch requests with read-only scopes (`repo:read`, `read:user`).

## Important Failure Modes
- **Missing or Invalid Gemini API Key:** The system automatically logs a graceful notice and uses deterministic AST-based explanations and patch templates.
- **Malformed Git Diff:** The diff parser detects unparseable hunks, tags the file with a warning badge, and continues analyzing all well-formed files without failing the entire PR review.
- **Complex Dynamic Route Paths:** Routes with dynamic template string interpolation (e.g. `` `/api/items/${type}/${id}` ``) are normalized using wildcard tokens and flagged as `inferred` confidence rather than silently omitted.

## What Was Simplified and Why
- **In-Memory Fixture Repository (KrishiSetu):** Instead of requiring users to authenticate an external GitHub App and install it on an external organization, CodePulse includes a rich, multi-file full-stack project (*KrishiSetu*) directly in the workspace. This ensures 100% reproducible testing in 5 seconds for hackathon judges while keeping the live GitHub API boundary fully wired.
- **Deterministic Static Scanner:** Uses high-precision regex/AST heuristics for Express and React rather than a full heavyweight compiler suite, keeping analysis fast and memory consumption low.

## Decisions and Open Issues
- **Decision:** Dual-mode architecture (Demo Mode + GitHub Live API) ensures instant judge reviewability without credential blockers.
- **Uncertainty Resolved:** Confirmed Mermaid.js can be rendered client-side with SVG pan/zoom fallback without external server dependencies.
