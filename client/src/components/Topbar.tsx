import React from 'react';
import { 
  GitBranch, 
  ChevronDown, 
  FolderGit2, 
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { RepoMetadata } from '../api/client';

interface TopbarProps {
  repos: RepoMetadata[];
  activeRepo: RepoMetadata | null;
  onSelectRepo: (repo: RepoMetadata) => void;
  isDemoMode: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  repos,
  activeRepo,
  onSelectRepo,
  isDemoMode,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      {/* Left: Repository Context Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 text-slate-400">
            <FolderGit2 className="w-4 h-4 text-slate-400" />
            <span>Repository:</span>
          </span>

          <div className="relative group">
            <select
              value={activeRepo?.id || ''}
              onChange={(e) => {
                const found = repos.find(r => r.id === e.target.value);
                if (found) onSelectRepo(found);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-md py-1.5 pl-3 pr-8 text-sm font-semibold text-slate-900 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {repos.map(r => (
                <option key={r.id} value={r.id}>
                  {r.owner}/{r.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Branch Context */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600">
          <GitBranch className="w-3.5 h-3.5 text-slate-500" />
          <span>{activeRepo?.defaultBranch || 'main'}</span>
        </div>

        {/* Re-analyze Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded hover:bg-slate-100"
          title="Re-run static analysis"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span className="hidden md:inline">Re-scan</span>
        </button>
      </div>

      {/* Right: Environment & User Status */}
      <div className="flex items-center gap-3">
        {isDemoMode ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Local Demo Workspace</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>GitHub Connected</span>
          </div>
        )}

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
            CP
          </div>
          <span className="text-xs font-medium text-slate-700 hidden sm:inline">reviewer</span>
        </div>
      </div>
    </header>
  );
};
