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

6. **Relational Database & Enterprise Security**
   - **MySQL Persistence:** Relational schema for user sessions, repository metadata, AST metrics, and contract audits with automatic in-memory test fallback.
   - **HttpOnly Cookie Sessions:** Strict session security preventing XSS and eliminating URL token exposure.

---

## 🏗️ Architecture & Data Flow

```
[ Developer / Reviewer ]
         │
         ▼
[ React 18 + Vite Frontend ] (Port 5173)
  ├── Warm Developer Theme & Responsive Hamburger Drawer
  ├── Overview Dashboard (4-Stage Truthful Lifecycle)
  ├── Architecture Topology Explorer (Mermaid.js)
  ├── API Contract Auditor
  ├── PR Reviews & Unified Diff Viewer
  ├── Mermaid Change Impact Graph & Blast Radius Inspector
  └── Safe Patch Review Modal
         │  (HTTP / JSON Proxy with HttpOnly Cookies)
         ▼
[ Express + TypeScript Backend ] (Port 3001)
  ├── Static Analyzer Engine (`engine/staticAnalyzer.ts`)
  ├── API Contract Matcher (`engine/contractMatcher.ts`)
  ├── Unified Diff Parser (`engine/diffParser.ts`)
  ├── Change Impact Graph Builder (`engine/impactBuilder.ts`)
  ├── Gemini LLM Service (`services/llmService.ts`)
  ├── MySQL Repository Persistence (`db/connection.ts` & `db/repositoryDao.ts`)
  └── Fixture Ingestion Service (`fixtures/krishisetu/`)
```

---

## 🚀 Quickstart & How to Run

### Prerequisites
- Node.js v18 or later
- npm v9 or later
- Git installed on your system
- (Optional) MySQL 8.0+

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/thulasiramegowda/Build_with_AI.git
cd Build_with_AI
npm install
```

### 2. Environment Configuration (Optional)
Copy the example environment file:
```bash
cp .env.example .env
```
*Note: If `GEMINI_API_KEY` or `MYSQL_*` are not configured, CodePulse operates seamlessly with its deterministic heuristic engine and in-memory test fallback.*

### 3. Start Development Servers
Run frontend and backend concurrently:
```bash
npm run dev
```
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001/api/health](http://localhost:3001/api/health)

### 4. Run Automated Test Suite
Execute the 22-test Vitest suite covering static extraction, diff parsing, blast-radius graph generation, MySQL fallback, and HttpOnly auth:
```bash
npm test
```

---

## 🧪 Automated Testing Verification

The test suite in `tests/` runs with 100% pass rate without external network dependencies:
- **`tests/engine.test.ts`:** Route normalization, static extraction, contract mismatches, diff parsing, and blast-radius graph.
- **`tests/auth_and_lifecycle.test.ts`:** OAuth CSRF state validation, single-use nonces, session TTL expiration, and HttpOnly cookies.
- **`tests/protected_routes.test.ts`:** 401/403 access control, unauthorized repository isolation, and logout session invalidation.
- **`tests/mysql_database.test.ts`:** Schema validation, connection error handling, and in-memory fallback.
- **`tests/llm_gemini.test.ts`:** Gemini prompt generation, safe patch generation, and deterministic rule engine fallback.

---

## 🛡️ Security & Privacy Boundary

- **HttpOnly Cookies:** Session tokens are stored in secure `HttpOnly`, `SameSite=Lax` cookies, preventing XSS and eliminating URL parameter leaks.
- **No Secret Leakage:** Tokens and private keys are loaded strictly in server-side environment variables and never logged or sent to the browser.
- **Least Privilege:** Uses read-only repository permissions (`repo:read`).
- **Zero Silent Mutations:** CodePulse never merges PRs, modifies remote branches, or alters working tree files without explicit user consent.
