import React from 'react';
import { FolderGit2, CheckCircle2, ArrowRight, FileCode, Layers, GitBranch } from 'lucide-react';
import { RepoMetadata } from '../api/client';
import { Badge } from '../components/Badge';

interface RepositoriesViewProps {
  repos: RepoMetadata[];
  activeRepo: RepoMetadata | null;
  onSelectRepo: (repo: RepoMetadata) => void;
}

export const RepositoriesView: React.FC<RepositoriesViewProps> = ({
  repos,
  activeRepo,
  onSelectRepo,
}) => {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Authorized Repositories</h2>
        <p className="text-xs text-slate-500 mt-1">
          Select a repository to explore its architecture, audit API contracts, and trace change impacts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {repos.map((repo) => {
          const isActive = activeRepo?.id === repo.id;
          return (
            <div
              key={repo.id}
              className={`bg-white rounded-xl border p-6 shadow-sm flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-blue-600 ring-2 ring-blue-600/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <FolderGit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500">{repo.owner} /</span>
                        <h3 className="font-bold text-slate-900 text-base">{repo.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>{repo.defaultBranch}</span>
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <Badge variant="blue">ACTIVE WORKSPACE</Badge>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {repo.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {repo.frameworks.map((fw) => (
                    <Badge key={fw} variant="slate">
                      {fw}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-4">
                <span className="text-xs text-slate-400 font-mono">
                  {repo.fileCount || repo.totalFiles} files cataloged
                </span>
                <button
                  onClick={() => onSelectRepo(repo)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  }`}
                >
                  <span>{isActive ? 'Current Repository' : 'Switch & Analyze'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
