---
doc: scope
status: approved
---

# CodePulse

AI-powered GitHub repository intelligence and code collaboration platform.

## The Unique Kernel
Deterministic static code relationship and API contract extraction paired with LLM-powered regression reasoning and an interactive Mermaid Change Impact Graph — definitively answering: *"If I change this part of my codebase, what else might break, and why?"*

## Who It's For
Software engineers, tech leads, and pull request reviewers navigating unfamiliar codebases or reviewing multi-file changes who need to verify frontend-backend contract consistency and prevent cascading regressions before merging.

## The Core Loop
Select or connect a repository → Analyze code structure, routes, API calls, and dependencies → Inspect detected API contract mismatches and architecture topology → Review a pull request or code change → Explore the Mermaid Change Impact Graph to trace affected components, routes, and tests → Generate an evidence-backed patch or agent prompt with manual approval.

## Inspiration & Identity
- **Aesthetic:** Modern, high-craft developer tool inspired by Linear, GitHub Next, and Vercel.
- **Visuals:** Light-theme default with crisp white surfaces (`#ffffff`), cool zinc/slate borders (`#e2e8f0`), restrained shadows, and deep blue primary accents (`#2563eb` / `#1d4ed8`).
- **Tone:** Professional, evidence-focused, zero fluff, deterministic clarity over vague chatbot conversation.

## Why This Matters to the Learner
Solves the real-world friction of developer onboarding and PR reviews: catching silent integration bugs between client requests and server endpoints, and visualizing downstream ripple effects before breaking production.

## What "Working" Looks Like
A developer opens CodePulse, selects a repository (such as the full-stack *KrishiSetu* app), immediately explores the architecture and detected API contract mismatches (e.g. client calling `/api/crops` with missing query params vs backend expecting `category`), selects an open PR diff, views an interactive Mermaid Change Impact Graph highlighting affected components and missing test coverage, and inspects a proposed patch with diff preview and safety checks.

## The POC Boundary
- **Included (In-Scope):**
  - Full modern web application shell (Sidebar, Topbar, Repository Selector, Status Indicators).
  - Dual Mode: Live GitHub App/Token integration AND a zero-friction Local Demo Mode featuring realistic multi-tier repositories (including KrishiSetu).
  - Real Repository Analysis Pipeline: Static parsing of routes, client API calls, components, and imports with deterministic evidence gathering.
  - API Contract Intelligence: Automated cross-tier comparison flagging path mismatches, method errors, and payload discrepancies with confidence ratings and file/line locations.
  - PR Review & Diff Inspector: Parses unified git diffs, maps changed lines to affected system entities.
  - Interactive Mermaid Change Impact Graph: Node selection, incoming/outgoing edge inspection, risk categorization, and test gap identification.
  - Finding Details & Safe Fix Workflow: Explanation, coding agent prompt generator, and diff-based patch proposal with explicit human approval.
  - Comprehensive automated unit and integration tests (Vitest) validating analysis, matching, graph construction, and security boundaries.

## Later
- Real-time GitHub Webhook event streaming and automated PR comment bots.
- Multi-user team workspace permissions with PostgreSQL persistence.
- AST-level symbol call graph resolution for additional languages (Go, Java, Rust).

## Explicitly Cut
- **Automated PR Merging / Silent Remote Pushes:** Strict security boundary — CodePulse never merges PRs or modifies remote repositories without human action.
- **Unbounded Repository LLM Ingestion:** Avoids hallucination and token waste; only retrieves relevant AST-extracted context and diff hunks.
- **Fake Metrics & Mock Buttons:** Every button and metric in the UI connects to real data or honest state indicators.
