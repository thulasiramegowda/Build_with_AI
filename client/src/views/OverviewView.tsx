import React from 'react';
import { 
  FolderGit2, 
  Layers, 
  ShieldAlert, 
  GitPullRequest, 
  FileCode, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Cpu,
  Github,
  Play,
  RefreshCw,
  AlertTriangle,
  Lock,
  Search,
  Network
} from 'lucide-react';
import { RepoMetadata, UserProfile } from '../api/client';
import { Badge } from '../components/Badge';
import { NavTab } from '../components/NavigationDrawer';

interface OverviewViewProps {
  authenticated: boolean;
  user: UserProfile | null;
  isDemoMode: boolean;
  githubConfigured: boolean;
  repo: RepoMetadata | null;
  availableRepos: RepoMetadata[];
  onSelectRepo: (repo: RepoMetadata) => void;
  onConnectGitHub: () => void;
  onToggleDemoMode: () => void;
  onAnalyzeRepo: () => void;
  isAnalyzing: boolean;
  onNavigate: (tab: NavTab) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  authenticated,
  user,
  isDemoMode,
  githubConfigured,
  repo,
  availableRepos,
  onSelectRepo,
  onConnectGitHub,
  onToggleDemoMode,
  onAnalyzeRepo,
  isAnalyzing,
  onNavigate,
}) => {
  // =========================================================================
  // STATE 1: UNCONNECTED & NO DEMO MODE ACTIVE
  // =========================================================================
  if (!authenticated && !isDemoMode) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto py-4">
        {/* Hero Section */}
        <div className="bg-warm-card border border-warm-border rounded-2xl p-8 sm:p-10 shadow-sm text-center sm:text-left">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warm-accent-light text-warm-accent-hover border border-warm-accent/30 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-warm-accent" />
              Developer Intelligence Platform
            </span>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-warm-primary tracking-tight leading-tight">
              Understand your codebase with confidence.
            </h1>

            <p className="text-sm sm:text-base text-warm-secondary mt-3 leading-relaxed">
              CodePulse helps developers understand an unfamiliar codebase, discover frontend/backend integration problems before runtime, review pull requests, and understand the impact of proposed code changes with an evidence-backed Mermaid Change Impact Graph.
            </p>

            {/* Action Bar */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={onConnectGitHub}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-warm-primary hover:bg-black text-warm-card text-sm font-bold shadow-sm transition-all"
              >
                <Github className="w-4 h-4" />
                <span>Connect with GitHub</span>
              </button>

              <button
                onClick={onToggleDemoMode}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-warm-bg hover:bg-warm-border/60 text-warm-primary border border-warm-border text-sm font-semibold transition-all"
              >
                <Sparkles className="w-4 h-4 text-warm-accent" />
                <span>Explore with Sample Fixture (KrishiSetu)</span>
              </button>
            </div>

            <p className="text-xs text-warm-secondary mt-3">
              Read-only repository access &bull; Zero silent code modifications &bull; Human-approved fixes
            </p>
          </div>
        </div>

        {/* 3 Main Capabilities Preview (Without Fake Results) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Capability 1 */}
          <div className="bg-warm-card border border-warm-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-warm-accent-light text-warm-accent flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-warm-primary">Repository Architecture</h3>
              <p className="text-xs text-warm-secondary mt-2 leading-relaxed">
                Automatically scans source code files to extract Express routes, client API requests, components, and data models into an interactive system topology diagram.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-warm-border/60">
              <span className="text-[11px] font-mono text-warm-secondary flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Deterministic AST Extraction
              </span>
            </div>
          </div>

          {/* Capability 2 */}
          <div className="bg-warm-card border border-warm-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-warm-primary">API Contract Intelligence</h3>
              <p className="text-xs text-warm-secondary mt-2 leading-relaxed">
                Cross-references frontend HTTP calls against backend route handlers to catch path discrepancies, method mismatches, and missing parameters before they cause 404 or 400 errors.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-warm-border/60">
              <span className="text-[11px] font-mono text-warm-secondary flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Line-numbered Citations
              </span>
            </div>
          </div>

          {/* Capability 3 */}
          <div className="bg-warm-card border border-warm-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-warm-primary">Change Impact Explorer</h3>
              <p className="text-xs text-warm-secondary mt-2 leading-relaxed">
                Answering: <em>"If I change this part of my codebase, what else might break, and why?"</em> Traces PR diff hunks directly to dependent UI components and untested routes.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-warm-border/60">
              <span className="text-[11px] font-mono text-warm-secondary flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Mermaid.js Blast Radius Graph
              </span>
            </div>
          </div>
        </div>

        {/* Empty State Banner */}
        <div className="bg-warm-sidebar border border-warm-border rounded-xl p-6 text-center">
          <FolderGit2 className="w-8 h-8 text-warm-secondary mx-auto mb-2 opacity-60" />
          <h4 className="text-sm font-bold text-warm-primary">No repository selected or analyzed yet</h4>
          <p className="text-xs text-warm-secondary max-w-md mx-auto mt-1">
            Connect your GitHub account or enable the offline sample fixture to explore repository intelligence.
          </p>
        </div>

        {/* GitHub OAuth Setup Guidance (shown if not configured) */}
        {!githubConfigured && (
          <div className="bg-warm-card border border-warm-border rounded-xl p-5 text-xs text-warm-secondary space-y-2">
            <div className="flex items-center gap-2 font-bold text-warm-primary">
              <Lock className="w-4 h-4 text-warm-accent" />
              <span>GitHub OAuth Configuration Guide</span>
            </div>
            <p>
              To enable live GitHub authentication for all users, register a GitHub OAuth application at{' '}
              <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                GitHub Developer Settings
              </a>{' '}
              and set the Authorization callback URL to:
            </p>
            <code className="block bg-warm-bg p-2 rounded border border-warm-border font-mono text-[11px] text-warm-primary">
              http://localhost:3001/api/auth/github/callback
            </code>
            <p>
              Then populate <code className="bg-warm-bg px-1 py-0.5 rounded font-mono">GITHUB_CLIENT_ID</code> and{' '}
              <code className="bg-warm-bg px-1 py-0.5 rounded font-mono">GITHUB_CLIENT_SECRET</code> in your server's <code className="bg-warm-bg px-1 py-0.5 rounded font-mono">.env</code> file.
            </p>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // STATE 2: CONNECTED / DEMO ACTIVE, BUT NO REPOSITORY SELECTED
  // =========================================================================
  if (!repo) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        {/* Connection Header */}
        <div className="bg-warm-card border border-warm-border rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {authenticated ? (
                <Badge variant="emerald">GitHub Connected</Badge>
              ) : (
                <Badge variant="amber">Demo Fixture Mode</Badge>
              )}
            </div>
            <h2 className="text-xl font-bold text-warm-primary mt-2">
              Select a repository to analyze
            </h2>
            <p className="text-xs text-warm-secondary mt-1">
              Choose an authorized codebase to explore its architecture and audit API contracts.
            </p>
          </div>

          {authenticated && user && (
            <div className="flex items-center gap-3 bg-warm-bg px-3 py-2 rounded-lg border border-warm-border text-xs">
              <img src={user.avatarUrl} alt={user.login} className="w-7 h-7 rounded-full" />
              <div>
                <span className="font-bold text-warm-primary block">{user.name}</span>
                <span className="text-[11px] text-warm-secondary font-mono">@{user.login}</span>
              </div>
            </div>
          )}
        </div>

        {/* Repository Selection List */}
        <div className="bg-warm-card border border-warm-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-warm-border">
            <span className="text-xs font-bold text-warm-primary uppercase tracking-wider">
              Available Repositories ({availableRepos.length})
            </span>
          </div>

          {availableRepos.length === 0 ? (
            <div className="py-12 text-center text-xs text-warm-secondary">
              <FolderGit2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No authorized repositories found.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {availableRepos.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onSelectRepo(r)}
                  className="p-4 rounded-xl border border-warm-border bg-warm-bg hover:border-warm-accent hover:bg-warm-highlight cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-warm-secondary">{r.owner} /</span>
                      <h4 className="text-sm font-bold text-warm-primary group-hover:text-warm-accent-hover transition-colors">
                        {r.name}
                      </h4>
                      {r.isFixture && <Badge variant="amber">Sample Fixture</Badge>}
                    </div>
                    {r.description && (
                      <p className="text-xs text-warm-secondary line-clamp-1 max-w-xl">
                        {r.description}
                      </p>
                    )}
                  </div>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-accent hover:bg-warm-accent-hover text-white text-xs font-bold transition-all shrink-0">
                    <span>Select & View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 3: REPOSITORY SELECTED, BUT NOT ANALYZED YET
  // =========================================================================
  if (repo.analysisStatus === 'unscanned') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4">
        {/* Repo Header */}
        <div className="bg-warm-card border border-warm-border rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-warm-border">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono text-warm-secondary">{repo.owner} /</span>
                <h2 className="text-xl font-bold text-warm-primary">{repo.name}</h2>
                <Badge variant="amber">Not Yet Analyzed</Badge>
                {repo.isFixture && <Badge variant="slate">Offline Fixture</Badge>}
              </div>
              <p className="text-xs text-warm-secondary max-w-2xl mt-1 leading-relaxed">
                {repo.description || 'No description provided.'}
              </p>
            </div>

            <button
              onClick={onAnalyzeRepo}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-warm-accent hover:bg-warm-accent-hover text-white text-xs font-bold shadow-sm transition-all shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Repository...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Static & Contract Analysis</span>
                </>
              )}
            </button>
          </div>

          {/* Truthful Empty Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            <div className="bg-warm-bg p-4 rounded-lg border border-warm-border">
              <span className="text-xs font-medium text-warm-secondary block mb-1">Scanned Files</span>
              <span className="text-2xl font-bold text-warm-secondary">&mdash;</span>
              <span className="text-[11px] text-warm-secondary block mt-1">Pending scan</span>
            </div>

            <div className="bg-warm-bg p-4 rounded-lg border border-warm-border">
              <span className="text-xs font-medium text-warm-secondary block mb-1">Backend Routes</span>
              <span className="text-2xl font-bold text-warm-secondary">&mdash;</span>
              <span className="text-[11px] text-warm-secondary block mt-1">Pending scan</span>
            </div>

            <div className="bg-warm-bg p-4 rounded-lg border border-warm-border">
              <span className="text-xs font-medium text-warm-secondary block mb-1">Contract Bugs</span>
              <span className="text-2xl font-bold text-warm-secondary">&mdash;</span>
              <span className="text-[11px] text-warm-secondary block mt-1">Pending scan</span>
            </div>

            <div className="bg-warm-bg p-4 rounded-lg border border-warm-border">
              <span className="text-xs font-medium text-warm-secondary block mb-1">Monitored PRs</span>
              <span className="text-2xl font-bold text-warm-secondary">&mdash;</span>
              <span className="text-[11px] text-warm-secondary block mt-1">Pending scan</span>
            </div>
          </div>
        </div>

        {/* Prompt to Run Analysis */}
        <div className="bg-warm-card border border-warm-border rounded-xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-warm-accent-light text-warm-accent flex items-center justify-center mx-auto">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
          <h3 className="text-base font-bold text-warm-primary">Ready to extract repository intelligence</h3>
          <p className="text-xs text-warm-secondary max-w-lg mx-auto leading-relaxed">
            Click <strong>"Run Static & Contract Analysis"</strong> to scan this codebase for Express routes, client Axios requests, cross-tier contract mismatches, and pull request regression risks.
          </p>
          <div className="pt-2">
            <button
              onClick={onAnalyzeRepo}
              disabled={isAnalyzing}
              className="px-6 py-2.5 rounded-xl bg-warm-accent hover:bg-warm-accent-hover text-white text-xs font-bold shadow-sm transition-all"
            >
              {isAnalyzing ? 'Analyzing...' : 'Begin Analysis Now'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 4: REPOSITORY ANALYZED (REAL RESULTS DISPLAYED)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* Hero Repo Header */}
      <div className="bg-warm-card border border-warm-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-warm-border">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-warm-secondary">{repo.owner} /</span>
              <h2 className="text-xl font-bold text-warm-primary tracking-tight">{repo.name}</h2>
              <Badge variant="emerald">Analysis Complete</Badge>
              {repo.isFixture && <Badge variant="slate">Offline Fixture</Badge>}
            </div>
            <p className="text-xs text-warm-secondary max-w-2xl mt-1 leading-relaxed">
              {repo.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {repo.frameworks.map((fw) => (
              <Badge key={fw} variant="slate">
                {fw}
              </Badge>
            ))}
          </div>
        </div>

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="bg-warm-bg p-4 rounded-lg border border-warm-border">
            <div className="flex items-center justify-between text-warm-secondary mb-1">
              <span className="text-xs font-medium">Scanned Files</span>
              <FileCode className="w-4 h-4 text-warm-secondary" />
            </div>
            <div className="text-2xl font-bold text-warm-primary">{repo.totalFiles || 0}</div>
            <span className="text-[11px] text-warm-secondary">Verified source files</span>
          </div>

          <div className="bg-warm-bg p-4 rounded-lg border border-warm-border">
            <div className="flex items-center justify-between text-warm-secondary mb-1">
              <span className="text-xs font-medium">Backend Routes</span>
              <Layers className="w-4 h-4 text-warm-accent" />
            </div>
            <div className="text-2xl font-bold text-warm-primary">{repo.detectedRoutesCount || 0}</div>
            <span className="text-[11px] text-warm-secondary">Discovered REST endpoints</span>
          </div>

          <div 
            onClick={() => onNavigate('contracts')}
            className="bg-rose-50/70 p-4 rounded-lg border border-rose-200/80 cursor-pointer hover:bg-rose-50 transition-colors"
          >
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-xs font-bold">Contract Bugs</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700">{repo.contractErrorsCount || 0}</div>
            <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-0.5">
              <span>Inspect Mismatches</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div 
            onClick={() => onNavigate('prs')}
            className="bg-blue-50/70 p-4 rounded-lg border border-blue-200/80 cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-xs font-bold">Monitored PRs</span>
              <GitPullRequest className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{repo.openPRsCount || 0}</div>
            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
              <span>View Diff Audits</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Contract Alert Banner (only if real contract errors found) */}
      {repo.contractErrorsCount !== undefined && repo.contractErrorsCount > 0 && (
        <div className="bg-rose-600 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-white shrink-0" />
            <div>
              <h3 className="font-bold text-sm">
                {repo.contractErrorsCount} Integration Contract Mismatches Detected
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                Frontend client requests do not match backend Express handlers. View file and line locations.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('contracts')}
            className="bg-white text-rose-700 font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors shadow-sm shrink-0"
          >
            Resolve Contracts
          </button>
        </div>
      )}

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-warm-card border border-warm-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-warm-accent-light text-warm-accent flex items-center justify-center mb-3">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-warm-primary">Architecture Explorer</h3>
            <p className="text-xs text-warm-secondary mt-1 leading-relaxed">
              Explore the system topology diagram from React UI components through Express API gateways down to data models.
            </p>
          </div>
          <div className="pt-6">
            <button
              onClick={() => onNavigate('architecture')}
              className="text-xs font-bold text-warm-accent-hover hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Open Architecture Diagram</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-warm-card border border-warm-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-warm-primary">Mermaid Change Impact Graph</h3>
            <p className="text-xs text-warm-secondary mt-1 leading-relaxed">
              Trace the blast radius of pull request code diffs to downstream routes, client components, and missing test suites.
            </p>
          </div>
          <div className="pt-6">
            <button
              onClick={() => onNavigate('impact')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Explore Change Impact Graph</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
