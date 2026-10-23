import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  AlertTriangle, 
  Network, 
  ArrowRight,
  GitBranch,
  User,
  Plus,
  Minus,
  Play,
  RefreshCw
} from 'lucide-react';
import { PRSummary, PRDetail, api, RepoMetadata } from '../api/client';
import { Badge } from '../components/Badge';
import { DiffViewer } from '../components/DiffViewer';

interface PRReviewsViewProps {
  repo: RepoMetadata | null;
  onNavigateToImpact: (prId: string) => void;
  onAnalyzeRepo: () => void;
  isAnalyzing: boolean;
}

export const PRReviewsView: React.FC<PRReviewsViewProps> = ({
  repo,
  onNavigateToImpact,
  onAnalyzeRepo,
  isAnalyzing,
}) => {
  const [prs, setPrs] = useState<PRSummary[]>([]);
  const [selectedPrId, setSelectedPrId] = useState<string>('');
  const [prDetail, setPrDetail] = useState<PRDetail | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!repo || repo.analysisStatus === 'unscanned') {
      setPrs([]);
      setSelectedPrId('');
      setPrDetail(null);
      return;
    }

    setLoadingList(true);
    api.getPRs(repo.id)
      .then((res) => {
        setPrs(res);
        if (res.length > 0) {
          setSelectedPrId(res[0].id);
        }
      })
      .catch(err => {
        console.error('Failed to load PRs:', err);
      })
      .finally(() => setLoadingList(false));
  }, [repo]);

  useEffect(() => {
    if (!repo || !selectedPrId) {
      setPrDetail(null);
      return;
    }

    setLoadingDetail(true);
    api.getPRDetail(repo.id, selectedPrId)
      .then(setPrDetail)
      .catch(err => console.error('Failed to load PR detail:', err))
      .finally(() => setLoadingDetail(false));
  }, [repo, selectedPrId]);

  if (!repo) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-warm-card border border-warm-border rounded-xl p-8 space-y-3">
        <GitPullRequest className="w-10 h-10 text-warm-secondary mx-auto opacity-50" />
        <h3 className="text-base font-bold text-warm-primary">No repository selected</h3>
        <p className="text-xs text-warm-secondary max-w-sm mx-auto">
          Please select a repository to review open pull requests.
        </p>
      </div>
    );
  }

  if (repo.analysisStatus === 'unscanned') {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-warm-card border border-warm-border rounded-xl p-8 space-y-3">
        <div className="w-12 h-12 rounded-xl bg-warm-accent-light text-warm-accent flex items-center justify-center mx-auto">
          <GitPullRequest className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-warm-primary">Pull requests not yet analyzed</h3>
        <p className="text-xs text-warm-secondary max-w-md mx-auto leading-relaxed">
          The repository <strong>{repo.owner}/{repo.name}</strong> has not been analyzed yet. Run analysis to extract pull request diffs and evaluate regression risks.
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
                <span>Scanning Repository...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run PR Risk Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-warm-secondary">{repo.owner}/{repo.name}</span>
            <Badge variant="emerald">Monitored</Badge>
          </div>
          <h2 className="text-xl font-bold text-warm-primary tracking-tight">Pull Request Reviews</h2>
          <p className="text-xs text-warm-secondary mt-0.5">
            Unified diff inspection, modified symbol mapping, and automated regression risk assessment.
          </p>
        </div>
      </div>

      {loadingList ? (
        <div className="h-48 flex items-center justify-center bg-warm-card rounded-xl border border-warm-border">
          <RefreshCw className="w-5 h-5 animate-spin text-warm-accent" />
        </div>
      ) : prs.length === 0 ? (
        <div className="bg-warm-card border border-warm-border rounded-xl p-12 text-center space-y-2">
          <GitPullRequest className="w-10 h-10 text-warm-secondary mx-auto opacity-50" />
          <h3 className="text-base font-bold text-warm-primary">No open pull requests found</h3>
          <p className="text-xs text-warm-secondary max-w-sm mx-auto">
            This repository currently has no open pull requests to analyze.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* PR Selection Pills */}
          <div className="flex flex-wrap gap-3">
            {prs.map((pr) => {
              const isSelected = selectedPrId === pr.id;
              return (
                <button
                  key={pr.id}
                  onClick={() => setSelectedPrId(pr.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-warm-card border-warm-accent shadow-xs ring-2 ring-warm-accent/20'
                      : 'bg-warm-sidebar border-warm-border hover:border-warm-accent/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    pr.riskLevel === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-warm-accent-light text-warm-accent'
                  }`}>
                    <GitPullRequest className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-warm-primary">#{pr.number}</span>
                      <Badge variant={pr.riskLevel === 'high' ? 'rose' : 'amber'}>
                        {pr.riskLevel.toUpperCase()} RISK
                      </Badge>
                      {pr.isFixture && <Badge variant="slate">Fixture</Badge>}
                    </div>
                    <h4 className="text-xs font-bold text-warm-primary line-clamp-1 mt-0.5">
                      {pr.title}
                    </h4>
                  </div>
                </button>
              );
            })}
          </div>

          {/* PR Details */}
          {loadingDetail ? (
            <div className="h-64 flex items-center justify-center bg-warm-card rounded-xl border border-warm-border">
              <RefreshCw className="w-5 h-5 animate-spin text-warm-accent" />
            </div>
          ) : prDetail ? (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-warm-card rounded-xl border border-warm-border p-6 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-warm-border">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-warm-accent-hover">#{prDetail.number}</span>
                      <h3 className="text-lg font-bold text-warm-primary">{prDetail.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-warm-secondary mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{prDetail.author}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>{prDetail.headBranch} &rarr; {prDetail.baseBranch}</span>
                      </span>
                    </div>
                  </div>

                  {/* Jump to Signature Change Impact Graph */}
                  <button
                    onClick={() => onNavigateToImpact(prDetail.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warm-accent hover:bg-warm-accent-hover text-white font-bold text-xs shadow-xs transition-all shrink-0"
                  >
                    <Network className="w-4 h-4" />
                    <span>Trace Change Impact Graph</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Risk Callout */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  prDetail.riskLevel === 'high' 
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900' 
                    : 'bg-warm-accent-light/60 border-warm-accent/30 text-warm-primary'
                }`}>
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                    prDetail.riskLevel === 'high' ? 'text-rose-600' : 'text-warm-accent'
                  }`} />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Regression Risk Assessment: {prDetail.riskLevel.toUpperCase()}
                    </h4>
                    <p className="text-xs leading-relaxed text-warm-secondary">
                      {prDetail.riskSummary}
                    </p>
                  </div>
                </div>

                {/* Changed Files */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-warm-primary">
                    Modified Files ({prDetail.changedFiles.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {prDetail.changedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-warm-bg border border-warm-border text-xs font-mono">
                        <span className="truncate text-warm-primary">{file.path}</span>
                        <div className="flex items-center gap-2 shrink-0 font-bold">
                          <span className="text-emerald-700 flex items-center gap-0.5">
                            <Plus className="w-3 h-3" />
                            {file.additions}
                          </span>
                          <span className="text-rose-600 flex items-center gap-0.5">
                            <Minus className="w-3 h-3" />
                            {file.deletions}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Diff Viewer */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-warm-primary">Unified Pull Request Diff</h4>
                <DiffViewer diffText={prDetail.rawDiff} filePath={`PR #${prDetail.number} Unified Diff`} />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
