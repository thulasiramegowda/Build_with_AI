import React, { useState, useEffect } from 'react';
import { 
  Network, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Info,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { ImpactGraphData, api, RepoMetadata } from '../api/client';
import { MermaidViewer } from '../components/MermaidViewer';
import { Badge } from '../components/Badge';

interface ChangeImpactViewProps {
  repo: RepoMetadata | null;
  prId?: string;
  onAnalyzeRepo: () => void;
  isAnalyzing: boolean;
}

export const ChangeImpactView: React.FC<ChangeImpactViewProps> = ({
  repo,
  prId = 'pr-14',
  onAnalyzeRepo,
  isAnalyzing,
}) => {
  const [graphData, setGraphData] = useState<ImpactGraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    if (!repo || repo.analysisStatus === 'unscanned') {
      setGraphData(null);
      setSelectedNode(null);
      return;
    }

    setLoading(true);
    setError(null);

    api.getImpactGraph(repo.id, prId)
      .then((data) => {
        setGraphData(data);
        if (data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to generate impact graph');
      })
      .finally(() => setLoading(false));
  }, [repo, prId]);

  if (!repo) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-warm-card border border-warm-border rounded-xl p-8 space-y-3">
        <Network className="w-10 h-10 text-warm-secondary mx-auto opacity-50" />
        <h3 className="text-base font-bold text-warm-primary">No repository selected</h3>
        <p className="text-xs text-warm-secondary max-w-sm mx-auto">
          Please select a repository to explore change impact dependencies.
        </p>
      </div>
    );
  }

  if (repo.analysisStatus === 'unscanned') {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-warm-card border border-warm-border rounded-xl p-8 space-y-3">
        <div className="w-12 h-12 rounded-xl bg-warm-accent-light text-warm-accent flex items-center justify-center mx-auto">
          <Network className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-warm-primary">Change impact not yet computed</h3>
        <p className="text-xs text-warm-secondary max-w-md mx-auto leading-relaxed">
          The repository <strong>{repo.owner}/{repo.name}</strong> has not been analyzed yet. Run analysis to trace modified lines to downstream API routes, components, and missing test suites.
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
                <span>Computing Blast Radius...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Impact Analysis</span>
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
            <Badge variant="amber">Signature Feature</Badge>
          </div>
          <h2 className="text-xl font-bold text-warm-primary tracking-tight">
            Mermaid Change Impact Graph
          </h2>
          <p className="text-xs text-warm-secondary mt-0.5">
            Answering: <em>"If I change this part of my codebase, what else might break, and why?"</em>
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Changed File
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            Affected Endpoint
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            UI Component
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-warm-accent-light text-warm-accent-hover border border-warm-accent/40 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-warm-accent" />
            Missing Test Gap
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center bg-warm-card rounded-xl border border-warm-border">
          <div className="flex items-center gap-2 text-warm-secondary text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-warm-accent" />
            <span>Constructing AST blast-radius graph...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-warm-card border border-rose-200 rounded-xl text-center text-xs text-rose-700 space-y-2">
          <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="font-bold">{error}</p>
        </div>
      ) : graphData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Graph */}
          <div className="lg:col-span-2 space-y-3">
            <MermaidViewer chart={graphData.mermaidDiagram} className="min-h-[460px] bg-warm-card border-warm-border" />
            <p className="text-[11px] text-warm-secondary font-mono">
              Graph rendered via Mermaid.js &bull; Relationships derived from AST imports, Express routes, and Axios calls.
            </p>
          </div>

          {/* Interactive Blast Radius Node Inspector */}
          <div className="space-y-4">
            <div className="bg-warm-card rounded-xl border border-warm-border p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-warm-border">
                <h3 className="text-xs font-bold text-warm-primary uppercase tracking-wider">
                  Blast Radius Node Inspector
                </h3>
                <span className="text-[11px] font-mono text-warm-secondary">
                  {graphData.nodes.length} Nodes &bull; {graphData.edges.length} Edges
                </span>
              </div>

              {/* Node Selector List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {graphData.nodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  let badgeVariant: any = 'slate';
                  if (node.type === 'changed_file') badgeVariant = 'rose';
                  if (node.type === 'endpoint') badgeVariant = 'blue';
                  if (node.type === 'component') badgeVariant = 'slate';
                  if (node.type === 'test') badgeVariant = 'amber';

                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'bg-warm-highlight border-warm-accent ring-1 ring-warm-accent/40 font-bold'
                          : 'bg-warm-bg border-warm-border hover:bg-warm-highlight'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <Badge variant={badgeVariant}>{node.type.toUpperCase()}</Badge>
                        {node.status && (
                          <span className="text-[10px] text-warm-secondary uppercase font-mono">
                            {node.status}
                          </span>
                        )}
                      </div>
                      <div className="text-warm-primary line-clamp-1 font-mono">{node.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Node Details */}
              {selectedNode && (
                <div className="pt-3 border-t border-warm-border space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-warm-secondary uppercase tracking-wider block">
                      Entity Details
                    </span>
                    <h4 className="text-sm font-bold text-warm-primary mt-0.5">{selectedNode.label}</h4>
                    {selectedNode.filePath && (
                      <p className="text-[11px] font-mono text-warm-secondary mt-1 break-all">
                        {selectedNode.filePath}
                      </p>
                    )}
                  </div>

                  {/* Impact Reason */}
                  <div className="p-3 bg-warm-bg border border-warm-border rounded-lg space-y-1">
                    <span className="text-[11px] font-bold text-warm-primary block">Why is this included?</span>
                    <p className="text-xs text-warm-secondary leading-relaxed">
                      {selectedNode.type === 'changed_file' &&
                        'Directly modified in the pull request diff hunks. Root trigger of potential downstream regressions.'}
                      {selectedNode.type === 'endpoint' &&
                        'Controller logic for this route was updated in PR diff hunks.'}
                      {selectedNode.type === 'component' &&
                        'Client UI component calls this route and relies on its response schema.'}
                      {selectedNode.type === 'test' &&
                        'Automated unit or integration tests are missing for this modified endpoint! High risk of undetected regression.'}
                    </p>
                  </div>

                  {/* Connected Relationships */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-warm-secondary uppercase tracking-wider block">
                      Connected Relationships
                    </span>
                    {graphData.edges
                      .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                      .map((edge, idx) => (
                        <div key={idx} className="p-1.5 rounded bg-warm-bg font-mono text-[11px] text-warm-primary flex items-center justify-between border border-warm-border">
                          <span>
                            {edge.source === selectedNode.id ? 'Outbound &rarr;' : '&larr; Inbound'} {edge.relation}
                          </span>
                          <span className="text-warm-secondary">{Math.round(edge.confidence * 100)}% Conf.</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
