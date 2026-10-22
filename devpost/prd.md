---
doc: prd
status: approved
---

# CodePulse — Product Requirements

AI-powered GitHub repository intelligence and code collaboration platform helping developers understand unfamiliar codebases, discover frontend/backend contract bugs, review PRs, and explore evidence-backed Change Impact Graphs.
Source: `scope.md > The Unique Kernel` and `scope.md > The Core Loop`.

## The Core Journey
1. **Arrival & Context Setup:** The user opens CodePulse. They can connect via GitHub or instantly explore via Local Demo Mode with pre-indexed real-world repositories (e.g. *KrishiSetu*, an agri-commerce full-stack app).
2. **Repository Selection:** The user selects a repository from their authorized list or sample catalog.
3. **Architecture Exploration:** The user views the system overview: detected languages, frameworks (React, Express, etc.), entry points, key components, and a generated architecture topology.
4. **API Contract Intelligence:** The user inspects the API Contracts view. Confirmed mismatches between frontend client calls (e.g. `apiClient.get('/api/v1/crops')`) and backend controllers (e.g. `router.get('/api/crops')`) are clearly flagged with severity, file paths, line numbers, and confidence levels.
5. **Pull Request Review:** The user selects an open PR (or sample feature branch diff). CodePulse displays changed files, unified diffs, plain-English change explanations, and risk assessments.
6. **Change Impact Exploration:** The user opens the Change Impact tab. CodePulse renders an interactive Mermaid graph linking changed files to affected controllers, client components, and downstream test suites.
7. **Safe Action & Remediation:** For any contract finding or PR risk, the user can inspect detailed explanations, generate an optimized agent prompt, or view a proposed code patch with a diff preview and validation checks before approval.

## Screens and Layout

### Application Shell
- **Left Sidebar:**
  - CodePulse Brand & Logo
  - Navigation Items: Overview, Repositories, Architecture Explorer, API Contracts, Pull Requests, Change Impact, Settings
  - Connection indicator (Live GitHub vs Local Demo)
- **Top Bar:**
  - Active Repository Breadcrumb & Switcher
  - Branch Selector (`main`, `feature/add-market-prices`, etc.)
  - Mode Badge (Demo Mode vs Authenticated GitHub)
  - Account Profile / Sign-in trigger

### 1. Landing & Connection Screen
- Hero explaining repository intelligence and impact prediction.
- "Continue with GitHub" button (initiates OAuth / App flow).
- "Explore Sample Repositories (Instant Demo)" button for zero-credential exploration.
- Privacy & security notice detailing read-only repository permissions.

### 2. Overview & Repository Intelligence Workspace
- Header with repo metadata: owner, description, language breakdown, commit hash, analysis timestamp.
- High-level architecture summary: Frontend tier, Backend services, Database/ORM models.
- Quick Stats: Detected routes, API client calls, contract findings, open PRs analyzed.
- Key files and directory structure preview.

### 3. Architecture Explorer
- Interactive system topology rendered via Mermaid.js showing data flow between client components, API gateways, route controllers, and models.
- Layer filter (Frontend, Backend, Database, Shared Types).
- Entity details panel on click.

### 4. API Contract Intelligence
- Tabular and card-based contract auditor.
- Grouping: "Mismatches & Errors", "Orphan Endpoints", "Verified Contracts".
- Detailed Drawer: Expected vs. Actual URL path, HTTP method, query/body schema, headers, and exact code citations with line numbers.
- One-click actions: "Explain Finding", "Generate Agent Prompt", "Propose Code Patch".

### 5. Pull Request Reviews
- Pull Request selector with status, author, and branch targets.
- Side-by-side or unified diff viewer.
- AI Risk Summary: High/Medium/Low regression risk assessment with deterministic evidence bullets.
- Test Coverage Impact: Missing tests for newly modified routes/components.

### 6. Change Impact Explorer (Signature Feature)
- Dynamic Mermaid graph displaying change propagation.
- Node types: Changed File (Red/Amber), Affected Endpoint (Blue), Dependent UI Component (Purple), Test Suite (Green).
- Interactive node inspector: click any node to view upstream triggers, downstream consumers, and confidence rating.
- Graph controls: Zoom, fit to screen, filter by node type, export diagram.

### 7. Settings & Integrations
- GitHub App connection status, granted scopes, and token expiration.
- LLM Provider configuration (Gemini API key status, model selection: Gemini 2.0 Flash / 1.5 Pro).
- Safe disconnect button that clears session cookies and local cache.

## Look and Feel
- **Color Palette:** Crisp white (`#ffffff`) and cool gray surfaces (`#f8fafc`, `#f1f5f9`), subtle slate borders (`#e2e8f0`), deep blue primary accents (`#2563eb`), slate text (`#0f172a`, `#475569`), emerald green for verified contracts, and rose red for breaking mismatches.
- **Typography:** Modern clean sans-serif (Inter / system font stack), monospace for code symbols and paths (`JetBrains Mono` / `ui-monospace`).
- **Density & Tone:** Spacious, purposeful, responsive, and high-signal; avoids dark-mode neon gimmicks and decorative non-functional charts.

## Features and Behavior

### Repository Analysis Pipeline
- Parses repository file trees, filtering out `node_modules`, `.git`, and build artifacts.
- Deterministic regex & AST pattern matching for Express routes (`app.get`, `router.post`), Next.js App/Pages routes, client HTTP calls (`fetch`, `axios.get`), and model schemas.
- Generates a normalized graph of entities: Routes, Endpoints, Components, Models, Tests.
- Produces an evidence-backed manifest with line-numbered citations.

### API Contract Matching Engine
- Normalizes path parameters (e.g. `/api/crops/:id` matching `/api/crops/${cropId}`).
- Cross-references frontend requests against registered backend endpoints.
- Flags:
  - **Path Discrepancies:** Frontend calls `/api/v1/farmer/crops`, backend only serves `/api/crops`.
  - **Method Mismatches:** Frontend performs `POST`, backend expects `PUT`.
  - **Missing Parameters:** Required query or body parameters omitted in client call.
  - **Orphan Endpoints:** Backend routes with no detected frontend callers.

### Change Impact Engine & Mermaid Graph
- Maps modified files and symbols in a PR to the entity relationship graph.
- Traces 1-hop and 2-hop downstream dependencies.
- Generates valid Mermaid `graph TD` diagrams representing the blast radius.
- Categorizes relationships: `imports`, `calls_endpoint`, `renders`, `tested_by`.

### Safe Patch & Prompt Generator
- Generates targeted minimal unified diff patches to resolve contract bugs.
- Displays full preview before application.
- Provides copyable coding-agent prompts with precise file locations and instructions.
- Requires explicit user confirmation; never commits or pushes automatically.

## States and Boundaries
- **First Use:** Shows clean onboarding state with options to sign in with GitHub or launch the Demo Workspace immediately.
- **Local Demo Mode:** Fully functional offline or without GitHub credentials using authentic full-stack fixtures (`KrishiSetu` repo).
- **Live GitHub Mode:** Uses secure HTTP-only session cookies and server-side GitHub App tokens; displays authenticated user avatar and accessible repos.
- **Error States:** Graceful fallbacks for rate limits, repository clone failures, or invalid diffs with actionable guidance.

## Product Decisions
- **Dual Mode (Demo + GitHub):** Solves the hackathon evaluation hurdle so judges and reviewers can test immediately without creating a custom GitHub App.
- **Evidence-First Over Pure LLM:** Static analysis extracts hard facts (routes, lines, diffs); the LLM interprets consequences and crafts fixes.
- **Zero Silent Modifying Actions:** Humans must review and confirm any patch.

## What We're Building
A complete, production-grade web application featuring:
1. Fast, responsive React + Vite frontend with Tailwind CSS and Lucide icons.
2. Robust Express + TypeScript backend providing analysis endpoints, contract intelligence, PR diff parser, and graph generation.
3. Realistic embedded repository fixtures (KrishiSetu) enabling immediate exploration.
4. Gemini LLM integration for contextual explanations, risk scoring, and patch generation with graceful deterministic fallbacks.
5. Interactive Mermaid.js visualization for architecture and change impact.
6. Automated Vitest suite covering route matching, contract analysis, and graph generation.

## Deferred From the POC
- Multi-repo cross-dependency tracing (monorepo packages across different repositories).
- Automated GitHub Action workflow integration.

## Non-Goals
- Automatic repository mutations or auto-merging pull requests.
- Full IDE code editing inside the browser.
- Universal AST parsing for every programming language in existence (focus on JS/TS/Node/Python).

## Open Questions
- None blocking specification. All core interactions, views, and data flows are defined.
