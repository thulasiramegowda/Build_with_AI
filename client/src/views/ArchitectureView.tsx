import React, { useEffect, useState } from 'react';
import { Layers, RefreshCw, Info, Play, AlertCircle, Sparkles, GitCommit, Cpu } from 'lucide-react';
import { api, RepoMetadata } from '../api/client';
import { MermaidViewer } from '../components/MermaidViewer';
import { Badge } from '../components/Badge';

interface ArchitectureViewProps {
  repo: RepoMetadata | null;
  onAnalyzeRepo: () => void;
  isAnalyzing: boolean;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  repo,
  onAnalyzeRepo,
  isAnalyzing,
}) => {
  const [diagram, setDiagram] = useState<string>('');
  const [layers, setLayers] = useState<any[]>([]);
  const [commitSha, setCommitSha] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [provider, setProvider] = useState<'gemini' | 'deterministic_fallback' | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repo || repo.analysisStatus === 'unscanned') {
      setDiagram('');
      setLayers([]);
      setCommitSha(null);
      setExplanation(null);
      setProvider(undefined);
      return;
    }

    setLoading(true);
    setError(null);

    api.getArchitecture(repo.id)
      .then(res => {
        if (res.error) {
          setError(res.error);
        } else {
          setDiagram(res.mermaidDiagram);
          setLayers(res.layers || []);
          setCommitSha((res as any).commitSha || repo.commitSha || null);
          setExplanation((res as any).aiExplanation || repo.aiExplanation || null);
          setProvider((res as any).explanationProvider || repo.explanationProvider || undefined);
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to load architecture diagram');
      })
      .finally(() => setLoading(false));
  }, [repo]);

  if (!repo) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-warm-card border border-warm-border rounded-xl p-8 space-y-3">
        <Layers className="w-10 h-10 text-warm-secondary mx-auto opacity-50" />
        <h3 className="text-base font-bold text-warm-primary">No repository selected</h3>
        <p className="text-xs text-warm-secondary max-w-sm mx-auto">
          Please select a repository from the overview or repository list to view its architecture.
        </p>
      </div>
    );
  }

  if (repo.analysisStatus === 'unscanned') {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-warm-card border border-warm-border rounded-xl p-8 space-y-3">
        <div className="w-12 h-12 rounded-xl bg-warm-accent-light text-warm-accent flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-warm-primary">Architecture not yet extracted</h3>
        <p className="text-xs text-warm-secondary max-w-md mx-auto leading-relaxed">
          The repository <strong>{repo.owner}/{repo.name}</strong> has not been analyzed yet. Run analysis to extract Express route handlers, client API calls, and component hierarchies.
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
                <span>Analyzing Repository...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Static Analysis</span>
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
            <Badge variant="emerald">Extracted</Badge>
            {commitSha && (
              <Badge variant="slate" className="flex items-center gap-1 font-mono">
                <GitCommit className="w-3 h-3" />
                <span>{commitSha.slice(0, 7)}</span>
              </Badge>
            )}
            {provider === 'gemini' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Gemini 2.5 Flash
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700 border border-stone-300">
                <Cpu className="w-3 h-3 text-stone-500" />
                Deterministic AST
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-warm-primary tracking-tight">System Architecture Explorer</h2>
          <p className="text-xs text-warm-secondary mt-0.5">
            Full-stack system boundary and data flow extracted from repository AST and verified code contracts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {layers.map((l, idx) => (
            <Badge key={idx} variant="slate">
              {l.name} ({l.count})
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center bg-warm-card rounded-xl border border-warm-border">
          <div className="flex items-center gap-2 text-warm-secondary text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-warm-accent" />
            <span>Rendering system topology...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-warm-card border border-rose-200 rounded-xl text-center text-xs text-rose-700">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
          <p className="font-bold">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <MermaidViewer chart={diagram} className="min-h-[460px] bg-warm-card border-warm-border" />

          {/* AI Architecture Overview Card */}
          {explanation && (
            <div className="p-4 bg-warm-card border border-warm-border rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-warm-accent" />
                  <h4 className="text-xs font-bold text-warm-primary tracking-wide uppercase">
                    Architectural Intelligence Summary
                  </h4>
                </div>
                {provider === 'gemini' && (
                  <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Generated with Gemini 2.5 Flash
                  </span>
                )}
              </div>
              <div className="text-xs text-warm-primary leading-relaxed whitespace-pre-line font-sans">
                {explanation}
              </div>
            </div>
          )}

          <div className="p-4 bg-warm-sidebar border border-warm-border rounded-xl text-xs text-warm-secondary flex items-start gap-2.5">
            <Info className="w-4 h-4 text-warm-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-warm-primary">Grounded AST Multi-Tier Analysis:</span>
              <span className="ml-1">
                Generated from verified static AST imports, Express routes, client API calls, and smart contract boundaries. Solid lines depict module imports; dashed lines depict HTTP and network boundaries.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
