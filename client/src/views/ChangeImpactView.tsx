import React, { useState, useEffect } from 'react';
import { 
  Network, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  Info,
  GitPullRequest,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ImpactGraphData, api } from '../api/client';
import { MermaidViewer } from '../components/MermaidViewer';
import { Badge } from '../components/Badge';

interface ChangeImpactViewProps {
  repoId: string;
  prId?: string;
}

export const ChangeImpactView: React.FC<ChangeImpactViewProps> = ({ repoId, prId = 'pr-14' }) => {
  const [graphData, setGraphData] = useState<ImpactGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    api.getImpactGraph(repoId, prId)
      .then((data) => {
        setGraphData(data);
        if (data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [repoId, prId]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-slate-500">Signature Feature</span>
            <Badge variant="purple">Evidence-Backed Graph</Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Mermaid Change Impact Graph
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Answering: <em>"If I change this part of my codebase, what else might break, and why?"</em>
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Changed File
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            Affected Endpoint
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            UI Component
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Test Gap / Suite
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Constructing AST blast-radius graph...</span>
          </div>
        </div>
      ) : graphData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Graph (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <MermaidViewer chart={graphData.mermaidDiagram} className="min-h-[480px]" />
            <p className="text-[11px] text-slate-400 font-mono">
              Graph rendered via Mermaid.js &bull; Relationships derived from AST imports, Express routes, and Axios calls.
            </p>
          </div>

          {/* Interactive Blast Radius Inspector (1 col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Blast Radius Node Inspector</h3>
                <span className="text-[11px] font-mono text-slate-400">
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
                  if (node.type === 'component') badgeVariant = 'purple';
                  if (node.type === 'test') badgeVariant = 'amber';

                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500 font-semibold'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <Badge variant={badgeVariant}>{node.type.toUpperCase()}</Badge>
                        {node.status && (
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {node.status}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-800 line-clamp-1 font-mono">{node.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Node Deep Dive */}
              {selectedNode && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Entity Details
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{selectedNode.label}</h4>
                    {selectedNode.filePath && (
                      <p className="text-[11px] font-mono text-slate-500 mt-1 break-all">
                        {selectedNode.filePath}
                      </p>
                    )}
                  </div>

                  {/* Impact Reason */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 block">Why is this included?</span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedNode.type === 'changed_file' &&
                        'Directly modified in the pull request diff. Origin node of potential regressions.'}
                      {selectedNode.type === 'endpoint' &&
                        'Controller logic for this route was updated in PR diff hunks.'}
                      {selectedNode.type === 'component' &&
                        'Client UI component calls this route and relies on its response schema.'}
                      {selectedNode.type === 'test' &&
                        'Automated unit or integration tests are missing for this modified endpoint! High risk of undetected regression.'}
                    </p>
                  </div>

                  {/* Incoming & Outgoing Relations */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Connected Relationships
                    </span>
                    {graphData.edges
                      .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                      .map((edge, idx) => (
                        <div key={idx} className="p-1.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700 flex items-center justify-between">
                          <span>
                            {edge.source === selectedNode.id ? 'Outbound &rarr;' : '&larr; Inbound'} {edge.relation}
                          </span>
                          <span className="text-slate-400">{Math.round(edge.confidence * 100)}% Conf.</span>
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
