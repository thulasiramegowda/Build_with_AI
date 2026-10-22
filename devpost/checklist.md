---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [ ] **1. Bootstrap application shell with KrishiSetu repository fixture**
  Becomes usable: Running full-stack application (React frontend + Express backend) with CodePulse sidebar, topbar, repository selector, and active KrishiSetu repository workspace with overview metrics.
  Why now: Boots both client and server, establishing the end-to-end communication backbone and UI design system so all subsequent analysis features have a live canvas.
  PRD ref: `prd.md > Screens and Layout > Application Shell`, `prd.md > Screens and Layout > 2. Overview & Repository Intelligence Workspace`
  Spec ref: `spec.md > Stack`, `spec.md > Components > 1. AppShell & Navigation`, `spec.md > File Structure`
  Build: Root and workspace setup, Express backend with repository endpoints and KrishiSetu fixture, Vite React frontend with Tailwind CSS, AppShell, Sidebar, Topbar, and Overview dashboard.
  Verify (mechanical): Automated healthcheck endpoint responds; frontend builds and renders repository overview and stats.
  Learner check: Open http://localhost:5173, see the clean light-theme dashboard, verify KrishiSetu repository card, detected tech badges, and file list.
  Commit: `Bootstrap application shell with KrishiSetu repository fixture`

- [ ] **2. Implement static analyzer and architecture topology explorer**
  Becomes usable: The backend parses frontend and backend source files to extract Express routes, client API calls, components, and models, and renders an interactive system topology Mermaid diagram in the Architecture Explorer.
  Why now: The repository intelligence engine is the foundational data provider for contract matching and blast radius calculations.
  PRD ref: `prd.md > Features and Behavior > Repository Analysis Pipeline`, `prd.md > Screens and Layout > 3. Architecture Explorer`
  Spec ref: `spec.md > Components > 2. ArchitectureExplorer`, `spec.md > Data Model`
  Build: Static analyzer engine (`staticAnalyzer.ts`) scanning routes, HTTP calls, imports, and models; architecture topology builder; frontend Architecture Explorer view with MermaidViewer.
  Verify (mechanical): Unit tests pass for static route extraction and component mapping; API returns valid JSON graph and Mermaid syntax.
  Learner check: Click "Architecture Explorer", view the system topology diagram showing Client, API Gateway, Routes, and DB layers, and filter by tier.
  Commit: `Implement static analyzer and architecture topology explorer`

- [ ] **3. Add API contract intelligence and mismatch detector**
  Becomes usable: Automatic cross-tier comparison flagging path discrepancies, HTTP method mismatches, and parameter mismatches between client calls and backend controllers with confidence scores, line citations, and inspection drawer.
  Why now: This is the core kernel of CodePulse—detecting integration bugs between frontend and backend before they hit production.
  PRD ref: `prd.md > Screens and Layout > 4. API Contract Intelligence`, `prd.md > Features and Behavior > API Contract Matching Engine`
  Spec ref: `spec.md > Components > 4. ApiContractIntelligence`, `spec.md > Data Model`
  Build: Contract matching engine (`contractMatcher.ts`) with route path normalization and fuzzy/wildcard parameter matching; contract audit API endpoint; frontend API Contracts view with severity badges, filters, and line citation drawer.
  Verify (mechanical): Automated unit tests verify detection of 3 deliberate mismatches in KrishiSetu (path mismatch on `/api/crops`, method mismatch on `/api/bids`, missing parameter on `/api/market-prices`).
  Learner check: Click "API Contracts", view flagged contract errors, click on the `/api/v1/farmer/crops` mismatch to inspect expected vs. actual code locations.
  Commit: `Add API contract intelligence and mismatch detector`

- [ ] **4. Add PR diff parser and regression risk reviewer**
  Becomes usable: Select and review pull requests (e.g. PR #14 `feature/realtime-bidding`), view unified diffs with line additions/deletions, and inspect AI-assisted regression risk summaries with detected symbol changes.
  Why now: Bridges static codebase analysis to active code review workflows where developers make consequential decisions.
  PRD ref: `prd.md > Screens and Layout > 5. Pull Request Reviews`
  Spec ref: `spec.md > Components > 5. PullRequestReviewer`
  Build: Unified git diff parser (`diffParser.ts`), PR review API route, DiffViewer component with syntax highlighting, regression risk evaluator.
  Verify (mechanical): Unit tests pass for parsing multi-file diff hunks and extracting changed function/route symbols; PR review endpoint returns structured diff and risks.
  Learner check: Click "PR Reviews", select PR #14, view the unified diff and regression risk score explaining which backend routes were modified.
  Commit: `Add PR diff parser and regression risk reviewer`

- [ ] **5. Build interactive Mermaid Change Impact Graph**
  Becomes usable: Interactive Change Impact visualizer that maps PR diff changes to downstream endpoints, UI components, and test files with blast-radius Mermaid diagrams and node inspection.
  Why now: Delivers the primary product answer: "If I change this part of my codebase, what else might break, and why?"
  PRD ref: `prd.md > Screens and Layout > 6. Change Impact Explorer (Signature Feature)`
  Spec ref: `spec.md > Components > 6. ChangeImpactExplorer`
  Build: Impact graph builder (`impactBuilder.ts`) traversing entity relationships; blast-radius calculation; dynamic Mermaid flowchart generation with color-coded nodes; frontend Change Impact view with node click-to-inspect drawer.
  Verify (mechanical): Unit tests verify that modifying a controller in PR #14 accurately traces downstream impacts to the farmer dashboard component and missing test suite; Mermaid diagram syntax is valid.
  Learner check: Click "Change Impact", explore the blast radius graph, click an affected node to see incoming/outgoing edges and confidence reasons.
  Commit: `Build interactive Mermaid Change Impact Graph`

- [ ] **6. Add safe patch generation, agent prompts, and settings**
  Becomes usable: Generate evidence-backed unified diff patches and reusable coding-agent prompts for any contract bug or PR risk, complete with safety modal, diff preview, validation status, and GitHub/Gemini configuration settings.
  Why now: Completes the loop from detection to remediation while enforcing the strict human-in-the-loop safety boundary (no silent code modification).
  PRD ref: `prd.md > Features and Behavior > Safe Patch & Prompt Generator`, `prd.md > Screens and Layout > 7. Settings & Integrations`
  Spec ref: `spec.md > Components > 7. SafePatchModal & PromptGenerator`, `spec.md > Components > 8. SettingsView`
  Build: Patch generator service with Gemini LLM integration and deterministic fallback templates; SafePatchModal with copyable agent prompt and patch preview; Settings view with GitHub connection status and API key configuration.
  Verify (mechanical): Patch generation endpoint outputs valid `.patch` diff format; Vitest test suite runs end-to-end and passes.
  Learner check: On any contract mismatch, click "Propose Code Patch", review the diff preview, copy the agent prompt, and verify that no files are modified without approval.
  Commit: `Add safe patch generation, agent prompts, and settings`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — Slice 3 (API Contract Intelligence & Mismatch Detection)
- [ ] Final kick-the-tires exploration and feedback completed — Slice 6 (Full Change Impact & Safe Patch Workflow)

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to be recorded upon completion]
Route and stops: [to be recorded upon completion]
Edit outcome: [to be recorded upon completion]
Reflection: [to be recorded upon completion]
Activity mode: [to be recorded upon completion]

## Revisions
