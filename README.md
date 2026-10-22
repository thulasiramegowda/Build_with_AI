# CodePulse ⚡
### AI-Powered GitHub Repository Intelligence & Change Impact Platform

CodePulse is a developer intelligence platform that helps software engineers and tech leads navigate unfamiliar codebases, detect frontend/backend API contract bugs before runtime, and explore evidence-backed **Mermaid Change Impact Graphs** during pull request reviews.

> **Central Question:** *"If I change this part of my codebase, what else might break, and why?"*

---

## 🌟 Key Features

1. **Deterministic Static AST & Route Extraction**
   - Ingests multi-tier repositories (React/TypeScript frontend + Express backend).
   - Scans and normalizes route definitions (`router.get`, `app.post`) and client API requests (`axios`, `fetch`).
   - Extracts component dependencies, models, and file hierarchies with line-level citations.

2. **API Contract Intelligence (Signature Feature)**
   - Cross-references frontend HTTP requests against backend route declarations.
   - Detects:
     - **Path Mismatches** (e.g. client requesting `/api/v1/farmer/crops` vs. server registering `/api/crops`).
     - **HTTP Method Incompatibilities** (e.g. client dispatching `POST` vs. server expecting `PUT`).
     - **Missing Query/Body Parameters** (e.g. omitted `?region=` parameter).
     - **Orphan Backend Endpoints** with no detected client consumers.
   - Provides confidence scores, exact line numbers, and expected vs. actual snippets.

3. **Mermaid Change Impact Graph (Signature Feature)**
   - Parses unified git diffs from pull requests (e.g. PR #14 `feature/realtime-bidding`).
   - Maps changed files and symbols through the dependency graph to identify affected endpoints, UI components, and test coverage gaps.
   - Renders interactive Mermaid.js diagrams with zoom/pan and a dedicated **Blast Radius Inspector Drawer**.

4. **Safe Patch & Coding-Agent Prompt Generator**
   - Produces copyable prompts for AI agents (Antigravity, Cursor, Claude Code).
   - Generates non-destructive unified diff patches (`.patch`).
   - **Strict Safety Gate:** Human-in-the-loop review required before any sandbox patch simulation; zero silent repository writes or remote commits.

5. **Dual Operation Mode: Instant Demo & Live GitHub**
   - **Local Demo Mode:** Ships with an authentic full-stack agricultural commerce app (**KrishiSetu**), allowing hackathon judges to test in 5 seconds with zero credentials required.
   - **Live GitHub Mode:** Integrates with GitHub App tokens and OAuth sessions for real repository auditing under least-privilege read scopes.

---

## 🏗️ Architecture & Data Flow

```
[ Developer / Reviewer ]
         │
         ▼
[ React 18 + Vite Frontend ] (Port 5173)
  ├── AppShell & Sidebar (Tailwind CSS, Lucide Icons)
  ├── Overview Dashboard
  ├── Architecture Topology Explorer (Mermaid.js)
  ├── API Contract Auditor
  ├── PR Reviews & Unified Diff Viewer
  ├── Mermaid Change Impact Graph & Blast Radius Inspector
  └── Safe Patch Review Modal
         │  (HTTP / JSON Proxy)
         ▼
[ Express + TypeScript Backend ] (Port 3001)
  ├── Static Analyzer Engine (`engine/staticAnalyzer.ts`)
  ├── API Contract Matcher (`engine/contractMatcher.ts`)
  ├── Unified Diff Parser (`engine/diffParser.ts`)
  ├── Change Impact Graph Builder (`engine/impactBuilder.ts`)
  ├── Gemini LLM Service (`services/llmService.ts`)
  └── Fixture Ingestion Service (`fixtures/krishisetu/`)
```

---

## 🚀 Quickstart & How to Run

### Prerequisites
- Node.js v18 or later
- npm v9 or later
- Git installed on your system

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/your-username/codepulse.git
cd codepulse
npm install
```

### 2. Environment Configuration (Optional)
Copy the example environment file:
```bash
cp .env.example .env
```
*Note: If `GEMINI_API_KEY` is not provided, CodePulse operates seamlessly with its deterministic heuristic engine.*

### 3. Start Development Servers
Run frontend and backend concurrently:
```bash
npm run dev
```
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001/api/health](http://localhost:3001/api/health)

### 4. Run Automated Test Suite
Execute the Vitest suite covering route normalization, static extraction, contract matching, and blast-radius graph construction:
```bash
npm test
```

---

## 🧪 Automated Testing Verification

The test suite in `tests/engine.test.ts` runs without external network dependencies:
- **Route Normalization:** Verifies `/api/crops/:id` & `/api/crops/${id}` normalize to `/api/crops/{param}`.
- **Static Extraction:** Validates route and client call discovery in KrishiSetu.
- **Contract Matching:** Confirms detection of deliberate path mismatches, method errors, and missing parameters.
- **Diff Parsing:** Verifies unified diff hunk extraction and regression risk scoring.
- **Mermaid Graph Construction:** Asserts valid Mermaid flowchart generation linking changed files to downstream components.

---

## 🛡️ Security & Privacy Boundary

- **No Secret Leakage:** Tokens and private keys are loaded strictly in server-side environment variables and never logged or sent to the browser.
- **Least Privilege:** Uses read-only repository permissions (`repo:read`).
- **Zero Silent Mutations:** CodePulse never merges PRs, modifies remote branches, or alters working tree files without explicit user consent.

---

## 📜 Devpost Hackathon Deliverables

- Planning Documentation:
  - `devpost/learner-profile.md`
  - `devpost/scope.md`
  - `devpost/prd.md`
  - `devpost/spec.md`
  - `devpost/checklist.md`
