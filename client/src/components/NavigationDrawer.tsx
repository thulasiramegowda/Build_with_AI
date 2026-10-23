import React, { useEffect } from 'react';
import { 
  Activity, 
  Layers, 
  GitPullRequest, 
  ShieldAlert, 
  Network, 
  Settings, 
  FolderGit2,
  X,
  Sparkles,
  ShieldCheck,
  Github
} from 'lucide-react';
import { Badge } from './Badge';

export type NavTab = 'overview' | 'repositories' | 'architecture' | 'contracts' | 'prs' | 'impact' | 'settings';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  contractErrorsCount?: number;
  openPRsCount?: number;
  isAnalyzed: boolean;
  authenticated: boolean;
  isDemoMode: boolean;
  activeRepoName?: string;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  contractErrorsCount,
  openPRsCount,
  isAnalyzed,
  authenticated,
  isDemoMode,
  activeRepoName,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navItems: { id: NavTab; label: string; icon: React.FC<any>; badge?: number; badgeVariant?: 'rose' | 'blue' | 'slate' }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'repositories', label: 'Repositories', icon: FolderGit2 },
    { id: 'architecture', label: 'Architecture Explorer', icon: Layers },
    { 
      id: 'contracts', 
      label: 'API Contracts', 
      icon: ShieldAlert, 
      badge: isAnalyzed && contractErrorsCount !== undefined && contractErrorsCount > 0 ? contractErrorsCount : undefined,
      badgeVariant: 'rose'
    },
    { 
      id: 'prs', 
      label: 'Pull Request Reviews', 
      icon: GitPullRequest, 
      badge: isAnalyzed && openPRsCount !== undefined && openPRsCount > 0 ? openPRsCount : undefined,
      badgeVariant: 'blue'
    },
    { id: 'impact', label: 'Change Impact Graph', icon: Network },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop (mobile/tablet & overlay) */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-warm-primary/30 backdrop-blur-sm z-40 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-warm-sidebar border-r border-warm-border z-50 flex flex-col shadow-xl transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main Navigation Drawer"
      >
        {/* Header */}
        <div className="h-16 px-5 border-b border-warm-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-warm-accent flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-bold text-warm-primary tracking-tight text-sm leading-none">CodePulse</h2>
              <p className="text-[11px] text-warm-secondary mt-1 font-mono">Repo Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-warm-border/60 text-warm-secondary hover:text-warm-primary transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Workspace Info */}
        <div className="p-4 border-b border-warm-border/60 bg-warm-card/60">
          <span className="text-[10px] font-semibold text-warm-secondary uppercase tracking-wider block mb-1">
            Active Workspace
          </span>
          <div className="flex items-center gap-2 text-xs font-semibold text-warm-primary truncate">
            <FolderGit2 className="w-3.5 h-3.5 text-warm-accent shrink-0" />
            <span className="truncate">{activeRepoName || 'No repository selected'}</span>
          </div>
          <div className="mt-2">
            {isAnalyzed ? (
              <Badge variant="emerald">Analysis Complete</Badge>
            ) : activeRepoName ? (
              <Badge variant="amber">Not Yet Analyzed</Badge>
            ) : (
              <Badge variant="slate">Unconnected</Badge>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-warm-card text-warm-primary font-bold shadow-sm border border-warm-border text-warm-accent'
                    : 'text-warm-secondary hover:text-warm-primary hover:bg-warm-border/40'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-warm-accent' : 'text-warm-secondary'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && (
                  <Badge variant={item.badgeVariant || 'slate'} className="text-[10px] py-0 px-1.5">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Connection Status */}
        <div className="p-4 border-t border-warm-border bg-warm-card/40">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-warm-secondary font-medium">GitHub Status</span>
            {authenticated ? (
              <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Connected</span>
              </span>
            ) : isDemoMode ? (
              <span className="flex items-center gap-1 text-warm-accent-hover font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-warm-accent" />
                <span>Demo Fixture</span>
              </span>
            ) : (
              <span className="text-warm-secondary text-[11px]">Not Connected</span>
            )}
          </div>
          <p className="text-[11px] text-warm-secondary leading-tight">
            Deterministic static AST extraction with human-approved patch proposals.
          </p>
        </div>
      </aside>
    </>
  );
};
