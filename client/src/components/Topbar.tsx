import React from 'react';
import { 
  Menu, 
  FolderGit2, 
  ChevronDown, 
  Sparkles, 
  ShieldCheck, 
  Github, 
  LogOut, 
  Play, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { RepoMetadata, UserProfile } from '../api/client';
import { Badge } from './Badge';

interface TopbarProps {
  onToggleDrawer: () => void;
  repos: RepoMetadata[];
  activeRepo: RepoMetadata | null;
  onSelectRepo: (repo: RepoMetadata) => void;
  authenticated: boolean;
  user: UserProfile | null;
  isDemoMode: boolean;
  githubConfigured: boolean;
  onConnectGitHub: () => void;
  onToggleDemoMode: () => void;
  onLogout: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleDrawer,
  repos,
  activeRepo,
  onSelectRepo,
  authenticated,
  user,
  isDemoMode,
  githubConfigured,
  onConnectGitHub,
  onToggleDemoMode,
  onLogout,
  onAnalyze,
  isAnalyzing,
}) => {
  return (
    <header className="h-16 bg-warm-card border-b border-warm-border px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-30">
      {/* Left: Hamburger Button + Brand + Repo Context */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Hamburger Menu Toggle */}
        <button
          onClick={onToggleDrawer}
          className="p-2 rounded-lg bg-warm-sidebar hover:bg-warm-border text-warm-primary transition-colors border border-warm-border"
          aria-label="Toggle Navigation Menu"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2 select-none">
          <span className="font-bold text-warm-primary tracking-tight text-base hidden sm:inline">
            CodePulse
          </span>
        </div>

        {/* Repository Context Dropdown (if repos exist) */}
        {repos.length > 0 && (
          <div className="relative flex items-center">
            <span className="hidden md:inline-block text-xs text-warm-secondary font-mono mr-2">
              repo:
            </span>
            <div className="relative">
              <select
                value={activeRepo?.id || ''}
                onChange={(e) => {
                  const found = repos.find(r => r.id === e.target.value);
                  if (found) onSelectRepo(found);
                }}
                className="appearance-none bg-warm-bg border border-warm-border rounded-lg py-1.5 pl-3 pr-8 text-xs font-bold text-warm-primary hover:border-warm-accent transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-warm-accent/20"
              >
                <option value="" disabled>-- Select Repository --</option>
                {repos.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.owner}/{r.name} {r.isFixture ? '(Demo Fixture)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-warm-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Analyze Action Button (shown in topbar if repo selected but unscanned) */}
        {activeRepo && activeRepo.analysisStatus === 'unscanned' && (
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-accent hover:bg-warm-accent-hover text-white text-xs font-bold shadow-sm transition-all"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Analyze Repo</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Right: Auth / Demo Status & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Connection Status Badge */}
        {authenticated ? (
          <Badge variant="emerald" className="hidden md:inline-flex gap-1 items-center">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>GitHub Live</span>
          </Badge>
        ) : isDemoMode ? (
          <Badge variant="amber" className="hidden md:inline-flex gap-1 items-center">
            <Sparkles className="w-3 h-3 text-warm-accent" />
            <span>Demo Mode</span>
          </Badge>
        ) : (
          <Badge variant="slate" className="hidden md:inline-flex">
            Not Connected
          </Badge>
        )}

        {/* Authentication Controls */}
        {authenticated && user ? (
          <div className="flex items-center gap-2">
            <img
              src={user.avatarUrl}
              alt={user.login}
              className="w-7 h-7 rounded-full border border-warm-border shadow-xs"
            />
            <span className="text-xs font-bold text-warm-primary hidden sm:inline">
              {user.login}
            </span>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-md hover:bg-warm-border/60 text-warm-secondary hover:text-warm-primary transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Demo Toggle Button */}
            <button
              onClick={onToggleDemoMode}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isDemoMode
                  ? 'bg-warm-accent-light text-warm-accent-hover border-warm-accent/40 shadow-xs'
                  : 'bg-warm-bg text-warm-secondary border-warm-border hover:text-warm-primary'
              }`}
              title={isDemoMode ? 'Exit Demo Mode' : 'Explore Sample Fixture'}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-warm-accent" />
                <span className="hidden sm:inline">{isDemoMode ? 'Demo Active' : 'Explore Demo'}</span>
              </span>
            </button>

            {/* Connect GitHub Button */}
            <button
              onClick={onConnectGitHub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-primary hover:bg-black text-warm-card text-xs font-bold shadow-sm transition-all"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Connect GitHub</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
