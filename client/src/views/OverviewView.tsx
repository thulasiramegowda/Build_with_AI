import React from 'react';
import { 
  FolderGit2, 
  Layers, 
  ShieldAlert, 
  GitPullRequest, 
  FileCode, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Cpu
} from 'lucide-react';
import { RepoMetadata } from '../api/client';
import { Badge } from '../components/Badge';
import { NavTab } from '../components/Sidebar';

interface OverviewViewProps {
  repo: RepoMetadata | null;
  contractErrorsCount: number;
  openPRsCount: number;
  onNavigate: (tab: NavTab) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  repo,
  contractErrorsCount,
  openPRsCount,
  onNavigate,
}) => {
  if (!repo) return null;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Hero Repo Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-slate-500">{repo.owner} /</span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{repo.name}</h2>
              <Badge variant="emerald">Live Ingested</Badge>
            </div>
            <p className="text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
              {repo.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {repo.frameworks.map((fw) => (
              <Badge key={fw} variant="slate">
                {fw}
              </Badge>
            ))}
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Scanned Files</span>
              <FileCode className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{repo.fileCount || repo.totalFiles}</div>
            <span className="text-[11px] text-slate-500">React + Express TS</span>
          </div>

          <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Backend Routes</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{repo.detectedRoutesCount || 4}</div>
            <span className="text-[11px] text-slate-500">Express REST Handlers</span>
          </div>

          <div 
            onClick={() => onNavigate('contracts')}
            className="bg-rose-50/60 p-4 rounded-lg border border-rose-200/80 cursor-pointer hover:bg-rose-50 transition-colors"
          >
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-xs font-bold">Contract Bugs</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700">{contractErrorsCount}</div>
            <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-0.5">
              <span>Inspect Mismatches</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div 
            onClick={() => onNavigate('prs')}
            className="bg-blue-50/60 p-4 rounded-lg border border-blue-200/80 cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-xs font-bold">Monitored PRs</span>
              <GitPullRequest className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{openPRsCount}</div>
            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
              <span>View Diff Audits</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Critical Contract Warning Banner */}
      {contractErrorsCount > 0 && (
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {contractErrorsCount} Integration Contract Mismatches Detected
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                Frontend client requests (e.g. `/api/v1/farmer/crops`) do not match backend Express handlers.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('contracts')}
            className="bg-white text-rose-700 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-rose-50 transition-colors shadow-sm shrink-0"
          >
            Resolve Contracts
          </button>
        </div>
      )}

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Architecture Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Architecture Explorer</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Explore the system tier topology from React UI components through Express API gateways down to data models.
            </p>
          </div>
          <div className="pt-6">
            <button
              onClick={() => onNavigate('architecture')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <span>Open Architecture Diagram</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Change Impact Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Mermaid Change Impact Graph</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Answering: <em>"If I change this part of my codebase, what else might break, and why?"</em> Traces PR blast radius directly to UI & tests.
            </p>
          </div>
          <div className="pt-6">
            <button
              onClick={() => onNavigate('impact')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors"
            >
              <span>Explore Change Impact Graph</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
