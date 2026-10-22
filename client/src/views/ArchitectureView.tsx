import React, { useEffect, useState } from 'react';
import { Layers, RefreshCw, Info } from 'lucide-react';
import { api } from '../api/client';
import { MermaidViewer } from '../components/MermaidViewer';
import { Badge } from '../components/Badge';

interface ArchitectureViewProps {
  repoId: string;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ repoId }) => {
  const [diagram, setDiagram] = useState<string>('');
  const [layers, setLayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getArchitecture(repoId)
      .then(res => {
        setDiagram(res.mermaidDiagram);
        setLayers(res.layers || []);
      })
      .finally(() => setLoading(false));
  }, [repoId]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Architecture Explorer</h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualizing full-stack data flow from client UI down to Express routes and record stores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {layers.map((l, idx) => (
            <Badge key={idx} variant="slate">
              {l.name} ({l.count} nodes)
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Analyzing repository topology...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <MermaidViewer chart={diagram} className="min-h-[500px]" />

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Deterministic Static Extraction:</span>
              <span className="ml-1">
                This diagram is reconstructed from genuine AST imports, Express route handlers, and client Axios requests. Solid lines depict direct module imports and controller bindings; dashed lines depict HTTP network boundaries.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
