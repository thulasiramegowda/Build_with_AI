import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Terminal, 
  FileDiff, 
  Play, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ContractFinding, RepoMetadata } from '../api/client';
import { Badge } from '../components/Badge';
import { SafePatchModal } from '../components/SafePatchModal';

interface ContractsViewProps {
  repo: RepoMetadata | null;
  findings: ContractFinding[];
  summary: {
    totalFindings: number;
    errorsCount: number;
    warningsCount: number;
    infoCount: number;
    verifiedContracts: number;
  } | null;
  onAnalyzeRepo: () => void;
  isAnalyzing: boolean;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  repo,
  findings,
  summary,
  onAnalyzeRepo,
  isAnalyzing,
}) => {
  const [selectedFinding, setSelectedFinding] = useState<ContractFinding | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  if (!repo) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-warm-card border border-warm-border rounded-xl p-8 space-y-3">
        <ShieldAlert className="w-10 h-10 text-warm-secondary mx-auto opacity-50" />
        <h3 className="text-base font-bold text-warm-primary">No repository selected</h3>
        <p className="text-xs text-warm-secondary max-w-sm mx-auto">
          Please select a repository to audit frontend and backend API contracts.
        </p>
      </div>
    );
  }

  if (repo.analysisStatus === 'unscanned') {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-warm-card border border-warm-border rounded-xl p-8 space-y-3">
        <div className="w-12 h-12 rounded-xl bg-warm-accent-light text-warm-accent flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-warm-primary">API Contracts not yet audited</h3>
        <p className="text-xs text-warm-secondary max-w-md mx-auto leading-relaxed">
          The repository <strong>{repo.owner}/{repo.name}</strong> has not been analyzed yet. Run analysis to detect URL path discrepancies, HTTP method incompatibilities, and missing parameters.
        </p>
        <div className="pt-2">
          <button
            onClick={onAnalyzeRepo}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-warm-accent hover:bg-warm-accent-hover text-white text-xs font-bold shadow-sm transition-all mx-auto"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Auditing Contracts...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Contract Audit</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const filtered = findings.filter(f => {
    if (filterSeverity === 'all') return true;
    return f.severity === filterSeverity;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-warm-secondary">{repo.owner}/{repo.name}</span>
            <Badge variant="emerald">Audited</Badge>
          </div>
          <h2 className="text-xl font-bold text-warm-primary tracking-tight">API Contract Intelligence</h2>
          <p className="text-xs text-warm-secondary mt-0.5">
            Cross-tier contract auditing comparing frontend client calls with backend route implementations.
          </p>
        </div>

        {summary && (
          <div className="flex items-center gap-1.5 bg-warm-sidebar p-1 rounded-lg text-xs font-medium border border-warm-border">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterSeverity === 'all' ? 'bg-warm-card text-warm-primary shadow-xs font-bold' : 'text-warm-secondary hover:text-warm-primary'
              }`}
            >
              All ({summary.totalFindings})
            </button>
            <button
              onClick={() => setFilterSeverity('error')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterSeverity === 'error' ? 'bg-rose-600 text-white shadow-xs font-bold' : 'text-warm-secondary hover:text-warm-primary'
              }`}
            >
              Errors ({summary.errorsCount})
            </button>
          </div>
        )}
      </div>

      {/* Verified Contracts Stat Banner */}
      {summary && summary.verifiedContracts > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900">
                {summary.verifiedContracts} API Contracts Synchronized & Verified
              </h4>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Frontend client requests match backend route verbs, path tokens, and handlers with 100% confidence.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded">
            HEALTHY
          </span>
        </div>
      )}

      {/* Empty State when no findings */}
      {findings.length === 0 ? (
        <div className="bg-warm-card border border-warm-border rounded-xl p-12 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-warm-primary">Zero Contract Mismatches Found</h3>
          <p className="text-xs text-warm-secondary max-w-sm mx-auto">
            All detected frontend API calls cleanly match registered backend controllers.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((finding) => (
            <div
              key={finding.id}
              className="bg-warm-card rounded-xl border border-warm-border shadow-xs overflow-hidden hover:border-warm-accent/70 transition-all"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={finding.severity === 'error' ? 'rose' : 'amber'}>
                        {finding.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="blue">{Math.round(finding.confidence * 100)}% Confidence</Badge>
                      <span className="text-xs font-mono text-warm-secondary">{finding.type}</span>
                    </div>
                    <h3 className="text-base font-bold text-warm-primary">{finding.title}</h3>
                  </div>

                  <button
                    onClick={() => setSelectedFinding(finding)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-accent-light text-warm-accent-hover text-xs font-bold hover:bg-warm-accent/20 transition-colors shrink-0 border border-warm-accent/30"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-warm-accent" />
                    <span>Fix with AI</span>
                  </button>
                </div>

                <p className="text-xs text-warm-secondary leading-relaxed">
                  {finding.explanation}
                </p>

                {/* Evidence Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {finding.frontendEvidence && (
                    <div className="bg-warm-bg rounded-lg p-3 border border-warm-border text-xs font-mono">
                      <span className="text-[10px] font-sans font-bold text-warm-secondary uppercase tracking-wider block mb-1">
                        Frontend Client Call
                      </span>
                      <div className="text-warm-primary font-bold truncate">
                        {finding.frontendEvidence.filePath}:{finding.frontendEvidence.lineNumber}
                      </div>
                      <code className="text-[11px] text-blue-700 mt-1 block bg-warm-card p-1.5 rounded border border-warm-border overflow-x-auto">
                        {finding.frontendEvidence.codeSnippet}
                      </code>
                    </div>
                  )}

                  {finding.backendEvidence && (
                    <div className="bg-warm-bg rounded-lg p-3 border border-warm-border text-xs font-mono">
                      <span className="text-[10px] font-sans font-bold text-warm-secondary uppercase tracking-wider block mb-1">
                        Backend Route Handler
                      </span>
                      <div className="text-warm-primary font-bold truncate">
                        {finding.backendEvidence.filePath}:{finding.backendEvidence.lineNumber}
                      </div>
                      <code className="text-[11px] text-emerald-700 mt-1 block bg-warm-card p-1.5 rounded border border-warm-border overflow-x-auto">
                        {finding.backendEvidence.codeSnippet}
                      </code>
                    </div>
                  )}
                </div>

                {/* Footer Toolbar */}
                <div className="pt-2 flex flex-wrap items-center justify-between border-t border-warm-border/60 gap-2">
                  <span className="text-[11px] text-warm-secondary">
                    Fix: <strong className="text-warm-primary font-mono">{finding.suggestedFix}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedFinding(finding)}
                      className="flex items-center gap-1 text-xs font-bold text-warm-secondary hover:text-warm-primary px-2 py-1 rounded hover:bg-warm-border/40 transition-colors"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Agent Prompt</span>
                    </button>

                    <button
                      onClick={() => setSelectedFinding(finding)}
                      className="flex items-center gap-1 text-xs font-bold text-warm-accent-hover hover:underline px-2 py-1 transition-colors"
                    >
                      <FileDiff className="w-3.5 h-3.5 text-warm-accent" />
                      <span>View Diff Patch</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safe Patch Modal */}
      {selectedFinding && (
        <SafePatchModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      )}
    </div>
  );
};
