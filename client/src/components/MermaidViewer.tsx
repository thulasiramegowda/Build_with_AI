import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Code } from 'lucide-react';

interface MermaidViewerProps {
  chart: string;
  className?: string;
  onNodeClick?: (nodeId: string) => void;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
});

export const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart, className = '', onNodeClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        setError(null);
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        console.error('Mermaid render failure', err);
        if (isMounted) {
          setError(err.message || 'Failed to render Mermaid diagram');
        }
      }
    };

    if (chart) {
      renderChart();
    }

    return () => {
      isMounted = false;
    };
  }, [chart]);

  return (
    <div className={`relative bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Controls Bar */}
      <div className="h-10 bg-slate-50 border-b border-slate-200 px-3 flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-600 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Interactive Graph
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale(s => Math.min(s + 0.15, 2.0))}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale(s => Math.max(s - 0.15, 0.5))}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale(1)}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
            title="Reset Scale"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <button
            onClick={() => setShowRaw(!showRaw)}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
              showRaw ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Code className="w-3 h-3" />
            <span>Mermaid Syntax</span>
          </button>
        </div>
      </div>

      {/* Main Diagram Canvas */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-[360px] bg-slate-50/50">
        {error ? (
          <div className="text-center p-6 max-w-md">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">Diagram Rendering Fallback</h4>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
            <pre className="mt-3 p-3 bg-slate-100 text-slate-700 text-[11px] rounded text-left overflow-x-auto font-mono">
              {chart}
            </pre>
          </div>
        ) : showRaw ? (
          <div className="w-full h-full p-4">
            <pre className="w-full h-full p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg overflow-auto">
              {chart}
            </pre>
          </div>
        ) : (
          <div
            ref={containerRef}
            style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
            className="transition-transform duration-150 flex items-center justify-center max-w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
};
