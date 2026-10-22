import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Terminal, 
  FileDiff, 
  ArrowRight,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';
import { ContractFinding } from '../api/client';
import { Badge } from '../components/Badge';
import { SafePatchModal } from '../components/SafePatchModal';

interface ContractsViewProps {
  findings: ContractFinding[];
  summary: {
    totalFindings: number;
    errorsCount: number;
    warningsCount: number;
    infoCount: number;
    verifiedContracts: number;
  };
}

export const ContractsView: React.FC<ContractsViewProps> = ({ findings, summary }) => {
  const [selectedFinding, setSelectedFinding] = useState<ContractFinding | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const filtered = findings.filter(f => {
    if (filterSeverity === 'all') return true;
    return f.severity === filterSeverity;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header & Metric Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">API Contract Intelligence</h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated cross-tier contract auditing comparing frontend client calls with backend route implementations.
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterSeverity === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({summary.totalFindings})
          </button>
          <button
            onClick={() => setFilterSeverity('error')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterSeverity === 'error' ? 'bg-rose-600 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Errors ({summary.errorsCount})
          </button>
          <button
            onClick={() => setFilterSeverity('info')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterSeverity === 'info' ? 'bg-slate-700 text-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Info ({summary.infoCount})
          </button>
        </div>
      </div>

      {/* Verified Contracts Stat Banner */}
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-emerald-900">
              {summary.verifiedContracts} API Contracts Synchronized & Verified
            </h4>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Frontend HTTP calls match backend route verbs, path tokens, and handlers with 100% confidence.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded">
          STATUS: HEALTHY
        </span>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filtered.map((finding) => (
          <div
            key={finding.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-colors"
          >
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={finding.severity === 'error' ? 'rose' : 'amber'}>
                      {finding.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="blue">{Math.round(finding.confidence * 100)}% Confidence</Badge>
                    <span className="text-xs font-mono text-slate-500">{finding.type}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{finding.title}</h3>
                </div>

                <button
                  onClick={() => setSelectedFinding(finding)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fix with AI</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {finding.explanation}
              </p>

              {/* Side-by-side Evidence Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {finding.frontendEvidence && (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs font-mono">
                    <span className="text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Frontend Client Call
                    </span>
                    <div className="text-slate-800 font-semibold truncate">
                      {finding.frontendEvidence.filePath}:{finding.frontendEvidence.lineNumber}
                    </div>
                    <code className="text-[11px] text-blue-700 mt-1 block bg-white p-1.5 rounded border border-slate-200">
                      {finding.frontendEvidence.codeSnippet}
                    </code>
                  </div>
                )}

                {finding.backendEvidence && (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs font-mono">
                    <span className="text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Backend Route Handler
                    </span>
                    <div className="text-slate-800 font-semibold truncate">
                      {finding.backendEvidence.filePath}:{finding.backendEvidence.lineNumber}
                    </div>
                    <code className="text-[11px] text-emerald-700 mt-1 block bg-white p-1.5 rounded border border-slate-200">
                      {finding.backendEvidence.codeSnippet}
                    </code>
                  </div>
                )}
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-2 flex flex-wrap items-center justify-between border-t border-slate-100 gap-2">
                <span className="text-[11px] text-slate-500 font-medium">
                  Suggested Fix: <span className="text-slate-800">{finding.suggestedFix}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFinding(finding)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    <span>Agent Prompt</span>
                  </button>

                  <button
                    onClick={() => setSelectedFinding(finding)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    <FileDiff className="w-3.5 h-3.5" />
                    <span>View Diff Patch</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Safe Patch & Explanation Modal */}
      {selectedFinding && (
        <SafePatchModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      )}
    </div>
  );
};
