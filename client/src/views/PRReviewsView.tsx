import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  AlertTriangle, 
  CheckCircle2, 
  FileCode, 
  Network, 
  ArrowRight,
  GitBranch,
  Calendar,
  User,
  Plus,
  Minus
} from 'lucide-react';
import { PRSummary, PRDetail, api } from '../api/client';
import { Badge } from '../components/Badge';
import { DiffViewer } from '../components/DiffViewer';
import { NavTab } from '../components/Sidebar';

interface PRReviewsViewProps {
  repoId: string;
  onNavigateToImpact: (prId: string) => void;
}

export const PRReviewsView: React.FC<PRReviewsViewProps> = ({ repoId, onNavigateToImpact }) => {
  const [prs, setPrs] = useState<PRSummary[]>([]);
  const [selectedPrId, setSelectedPrId] = useState<string>('pr-14');
  const [prDetail, setPrDetail] = useState<PRDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    api.getPRs(repoId).then((res) => {
      setPrs(res);
      if (res.length > 0 && !selectedPrId) {
        setSelectedPrId(res[0].id);
      }
    });
  }, [repoId]);

  useEffect(() => {
    if (!selectedPrId) return;
    setLoadingDetail(true);
    api.getPRDetail(repoId, selectedPrId)
      .then(setPrDetail)
      .finally(() => setLoadingDetail(false));
  }, [repoId, selectedPrId]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pull Request Reviews</h2>
        <p className="text-xs text-slate-500 mt-1">
          Unified diff inspection, symbol extraction, and automated regression risk assessment.
        </p>
      </div>

      {/* PR Selection Tabs */}
      <div className="flex flex-wrap gap-3">
        {prs.map((pr) => {
          const isSelected = selectedPrId === pr.id;
          return (
            <button
              key={pr.id}
              onClick={() => setSelectedPrId(pr.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-white border-blue-600 shadow-sm ring-1 ring-blue-600'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                pr.riskLevel === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
              }`}>
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">#{pr.number}</span>
                  <Badge variant={pr.riskLevel === 'high' ? 'rose' : 'blue'}>
                    {pr.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
                <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 mt-0.5">
                  {pr.title}
                </h4>
              </div>
            </button>
          );
        })}
      </div>

      {/* PR Detail Container */}
      {loadingDetail ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Loading pull request diff and risk metrics...</p>
        </div>
      ) : prDetail ? (
        <div className="space-y-6">
          {/* PR Overview Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-blue-600">#{prDetail.number}</span>
                  <h3 className="text-lg font-bold text-slate-900">{prDetail.title}</h3>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
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

              {/* Signature Feature Jump Button */}
              <button
                onClick={() => onNavigateToImpact(prDetail.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors shrink-0"
              >
                <Network className="w-4 h-4" />
                <span>Trace Change Impact Graph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Risk Assessment Box */}
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${
              prDetail.riskLevel === 'high' 
                ? 'bg-rose-50/60 border-rose-200 text-rose-900' 
                : 'bg-blue-50/60 border-blue-200 text-blue-900'
            }`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                prDetail.riskLevel === 'high' ? 'text-rose-600' : 'text-blue-600'
              }`} />
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Regression Risk Analysis: {prDetail.riskLevel.toUpperCase()}
                </h4>
                <p className="text-xs leading-relaxed text-slate-700">
                  {prDetail.riskSummary}
                </p>
              </div>
            </div>

            {/* Changed Files Summary */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">Modified Files ({prDetail.changedFiles.length})</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {prDetail.changedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200 text-xs font-mono">
                    <span className="truncate text-slate-800">{file.path}</span>
                    <div className="flex items-center gap-2 shrink-0 font-bold">
                      <span className="text-emerald-600 flex items-center gap-0.5">
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

          {/* Unified Diff Viewer */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800">Unified PR Diff View</h3>
            <DiffViewer diffText={prDetail.rawDiff} filePath={`PR #${prDetail.number} Unified Diff`} />
          </div>
        </div>
      ) : null}
    </div>
  );
};
