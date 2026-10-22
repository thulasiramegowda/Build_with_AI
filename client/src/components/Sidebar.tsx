import React from 'react';
import { 
  Activity, 
  Layers, 
  GitPullRequest, 
  FileCode2, 
  ShieldAlert, 
  Network, 
  Settings, 
  FolderGit2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export type NavTab = 'overview' | 'repositories' | 'architecture' | 'contracts' | 'prs' | 'impact' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  contractErrorsCount: number;
  openPRsCount: number;
  isDemoMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  contractErrorsCount,
  openPRsCount,
  isDemoMode,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<any>; badge?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'repositories', label: 'Repositories', icon: FolderGit2 },
    { id: 'architecture', label: 'Architecture Explorer', icon: Layers },
    { 
      id: 'contracts', 
      label: 'API Contracts', 
      icon: ShieldAlert, 
      badge: contractErrorsCount, 
      badgeColor: 'bg-rose-100 text-rose-700' 
    },
    { 
      id: 'prs', 
      label: 'Pull Request Reviews', 
      icon: GitPullRequest, 
      badge: openPRsCount, 
      badgeColor: 'bg-blue-100 text-blue-700' 
    },
    { id: 'impact', label: 'Change Impact Graph', icon: Network },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
          <Activity className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-semibold text-slate-900 tracking-tight text-base leading-none">CodePulse</h1>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Repo Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full font-bold ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Connection Status Card */}
      <div className="p-4 border-t border-slate-200">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-500 font-medium">Engine Mode</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            {isDemoMode ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Demo (KrishiSetu)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live GitHub</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Deterministic AST + Gemini AI
          </p>
        </div>
      </div>
    </aside>
  );
};
