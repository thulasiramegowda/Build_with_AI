import React, { useState } from 'react';
import { FolderGit2, ArrowRight, Play, RefreshCw, Sparkles, Search, Github } from 'lucide-react';
import { RepoMetadata } from '../api/client';
import { Badge } from '../components/Badge';

interface RepositoriesViewProps {
  repos: RepoMetadata[];
  activeRepo: RepoMetadata | null;
  onSelectRepo: (repo: RepoMetadata) => void;
  onAnalyzeRepo: (repoId: string) => void;
  isAnalyzing: boolean;
  onConnectGitHub: () => void;
  authenticated: boolean;
  isDemoMode: boolean;
}

export const RepositoriesView: React.FC<RepositoriesViewProps> = ({
  repos,
  activeRepo,
  onSelectRepo,
  onAnalyzeRepo,
  isAnalyzing,
  onConnectGitHub,
  authenticated,
  isDemoMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = repos.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-border">
        <div>
          <h2 className="text-xl font-bold text-warm-primary tracking-tight">Authorized Repositories</h2>
          <p className="text-xs text-warm-secondary mt-1">
            {authenticated 
              ? 'Repositories retrieved directly from your connected GitHub account.'
              : isDemoMode 
                ? 'Sample offline repositories available in Demo Mode.'
                : 'Connect GitHub to access and analyze your authorized repositories.'}
          </p>
        </div>

        {!authenticated && !isDemoMode && (
          <button
            onClick={onConnectGitHub}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warm-primary hover:bg-black text-warm-card text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Connect GitHub</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      {repos.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-warm-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter repositories by name or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-warm-card border border-warm-border rounded-xl text-xs text-warm-primary placeholder:text-warm-secondary focus:outline-none focus:ring-2 focus:ring-warm-accent/20"
          />
        </div>
      )}

      {/* Repository List */}
      {filtered.length === 0 ? (
        <div className="bg-warm-card border border-warm-border rounded-xl p-12 text-center space-y-3">
          <FolderGit2 className="w-10 h-10 text-warm-secondary mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-warm-primary">No repositories available</h3>
          <p className="text-xs text-warm-secondary max-w-sm mx-auto">
            {!authenticated && !isDemoMode
              ? 'Connect your GitHub account to load authorized repositories.'
              : 'No matching repositories found.'}
          </p>
          {!authenticated && (
            <div className="pt-2">
              <button
                onClick={onConnectGitHub}
                className="px-4 py-2 rounded-lg bg-warm-primary text-warm-card text-xs font-bold hover:bg-black transition-colors"
              >
                Connect GitHub Now
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((repo) => {
            const isActive = activeRepo?.id === repo.id;
            return (
              <div
                key={repo.id}
                className={`bg-warm-card rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  isActive
                    ? 'border-warm-accent ring-2 ring-warm-accent/15'
                    : 'border-warm-border hover:border-warm-accent/60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-warm-accent text-white' : 'bg-warm-sidebar text-warm-secondary'
                      }`}>
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-warm-secondary">{repo.owner} /</span>
                          <h3 className="font-bold text-warm-primary text-sm">{repo.name}</h3>
                        </div>
                        <span className="text-[11px] text-warm-secondary font-mono">{repo.defaultBranch}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isActive && <Badge variant="amber">CURRENT</Badge>}
                      {repo.analysisStatus === 'analyzed' ? (
                        <Badge variant="emerald">ANALYZED</Badge>
                      ) : (
                        <Badge variant="slate">UNSCANNED</Badge>
                      )}
                    </div>
                  </div>

                  {repo.description && (
                    <p className="text-xs text-warm-secondary line-clamp-2 leading-relaxed">
                      {repo.description}
                    </p>
                  )}

                  {repo.frameworks && repo.frameworks.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {repo.frameworks.map((fw) => (
                        <Badge key={fw} variant="slate">
                          {fw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-warm-border/60 flex items-center justify-between mt-4">
                  <span className="text-[11px] text-warm-secondary font-mono">
                    {repo.totalFiles !== undefined ? `${repo.totalFiles} files` : 'Not scanned'}
                  </span>

                  <div className="flex items-center gap-2">
                    {repo.analysisStatus === 'unscanned' && isActive && (
                      <button
                        onClick={() => onAnalyzeRepo(repo.id)}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-warm-accent hover:bg-warm-accent-hover text-white text-xs font-bold transition-all shadow-xs"
                      >
                        {isAnalyzing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>Analyze</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectRepo(repo)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-warm-sidebar text-warm-primary'
                          : 'bg-warm-primary hover:bg-black text-warm-card shadow-xs'
                      }`}
                    >
                      <span>{isActive ? 'Selected' : 'Select'}</span>
                      {!isActive && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
