import React, { useEffect, useState } from 'react';
import { Layers, RefreshCw, Info, Play, AlertCircle } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repo || repo.analysisStatus === 'unscanned') {
      setDiagram('');
      setLayers([]);
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
          </div>
          <h2 className="text-xl font-bold text-warm-primary tracking-tight">System Architecture Explorer</h2>
          <p className="text-xs text-warm-secondary mt-0.5">
            Full-stack data flow from client UI down to Express routes and database models.
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

          <div className="p-4 bg-warm-sidebar border border-warm-border rounded-xl text-xs text-warm-secondary flex items-start gap-2.5">
            <Info className="w-4 h-4 text-warm-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-warm-primary">Deterministic AST Extraction:</span>
              <span className="ml-1">
                Generated from verified static AST imports, Express route handlers, and client Axios requests. Solid lines depict direct module imports; dashed lines depict HTTP network boundaries.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
