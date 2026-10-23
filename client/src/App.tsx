import React, { useState, useEffect, useCallback } from 'react';
import { NavigationDrawer, NavTab } from './components/NavigationDrawer';
import { Topbar } from './components/Topbar';
import { OverviewView } from './views/OverviewView';
import { RepositoriesView } from './views/RepositoriesView';
import { ArchitectureView } from './views/ArchitectureView';
import { ContractsView } from './views/ContractsView';
import { PRReviewsView } from './views/PRReviewsView';
import { ChangeImpactView } from './views/ChangeImpactView';
import { SettingsView } from './views/SettingsView';
import { 
  RepoMetadata, 
  ContractFinding, 
  AuthStatusResponse, 
  api 
} from './api/client';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [authStatus, setAuthStatus] = useState<AuthStatusResponse | null>(null);
  const [repos, setRepos] = useState<RepoMetadata[]>([]);
  const [activeRepo, setActiveRepo] = useState<RepoMetadata | null>(null);
  const [findings, setFindings] = useState<ContractFinding[]>([]);
  const [contractsSummary, setContractsSummary] = useState<{
    totalFindings: number;
    errorsCount: number;
    warningsCount: number;
    infoCount: number;
    verifiedContracts: number;
  } | null>(null);
  const [openPRsCount, setOpenPRsCount] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [targetPrId, setTargetPrId] = useState<string>('pr-14');
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Load auth state and repos
  const refreshWorkspace = useCallback(async () => {
    try {
      const [authRes, reposRes] = await Promise.all([
        api.getAuthStatus(),
        api.getRepos(),
      ]);

      setAuthStatus(authRes);
      setRepos(reposRes);

      // If active repo is currently set, keep it synchronized
      setActiveRepo((prev) => {
        if (!prev) return null;
        const matching = reposRes.find((r) => r.id === prev.id);
        return matching || null;
      });
    } catch (e: any) {
      console.error('Failed to refresh workspace:', e);
    }
  }, []);

  // Handle Initial Mount & OAuth redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    const authError = urlParams.get('auth_error');

    if (authSuccess === 'success') {
      showToast('success', 'Successfully connected with GitHub!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authError) {
      showToast('error', `GitHub Authentication failed: ${authError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    refreshWorkspace();
  }, [refreshWorkspace]);

  // Load findings and PRs when an active repo is analyzed
  const loadRepoDetails = useCallback(async (repo: RepoMetadata) => {
    if (repo.analysisStatus !== 'analyzed') {
      setFindings([]);
      setContractsSummary(null);
      setOpenPRsCount(0);
      return;
    }

    try {
      const [contractsRes, prsRes] = await Promise.all([
        api.getContracts(repo.id),
        api.getPRs(repo.id),
      ]);

      setFindings(contractsRes.findings || []);
      setContractsSummary(
        contractsRes.summary || {
          totalFindings: 0,
          errorsCount: 0,
          warningsCount: 0,
          infoCount: 0,
          verifiedContracts: 0,
        }
      );
      setOpenPRsCount(prsRes.length);
    } catch (e: any) {
      console.error('Failed to load analyzed repo data:', e);
    }
  }, []);

  // Select a repository
  const handleSelectRepo = (repo: RepoMetadata) => {
    setActiveRepo(repo);
    loadRepoDetails(repo);
  };

  // Run analysis for a repository
  const handleAnalyzeRepo = async (repoId?: string) => {
    const targetId = repoId || activeRepo?.id;
    if (!targetId) return;

    setIsAnalyzing(true);
    try {
      const result = await api.analyzeRepo(targetId);
      showToast('success', `Static and contract analysis complete for ${targetId}`);

      // Refresh repos list to get updated analysis status
      const updatedRepos = await api.getRepos();
      setRepos(updatedRepos);

      const updatedTarget = updatedRepos.find((r) => r.id === targetId);
      if (updatedTarget) {
        setActiveRepo(updatedTarget);
        await loadRepoDetails(updatedTarget);
      }
    } catch (e: any) {
      showToast('error', `Analysis failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // GitHub Auth trigger
  const handleConnectGitHub = () => {
    if (!authStatus?.githubConfigured) {
      setCurrentTab('settings');
      showToast(
        'info',
        'GitHub OAuth credentials not yet configured in server .env. See setup instructions.'
      );
      return;
    }
    // Redirect to backend OAuth route
    window.location.href = '/api/auth/github';
  };

  // Demo Mode toggle
  const handleToggleDemoMode = async () => {
    try {
      const res = await api.toggleDemoMode();
      showToast(
        'info',
        res.isDemoModeActive
          ? 'Demo Mode enabled with KrishiSetu sample fixture.'
          : 'Demo Mode disabled.'
      );
      await refreshWorkspace();
      setActiveRepo(null);
      setFindings([]);
      setContractsSummary(null);
      setOpenPRsCount(0);
    } catch (e: any) {
      showToast('error', `Failed to toggle demo mode: ${e.message}`);
    }
  };

  // Logout trigger
  const handleLogout = async () => {
    try {
      await api.logout();
      showToast('info', 'Signed out from GitHub.');
      setActiveRepo(null);
      setFindings([]);
      setContractsSummary(null);
      setOpenPRsCount(0);
      await refreshWorkspace();
    } catch (e: any) {
      console.error('Logout error:', e);
    }
  };

  const handleNavigateToImpact = (prId: string) => {
    setTargetPrId(prId);
    setCurrentTab('impact');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-warm-bg font-sans text-warm-primary selection:bg-warm-accent/20">
      {/* Navigation Drawer (Slide-out) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        contractErrorsCount={contractsSummary?.errorsCount}
        openPRsCount={openPRsCount}
        isAnalyzed={activeRepo?.analysisStatus === 'analyzed'}
        authenticated={authStatus?.authenticated ?? false}
        isDemoMode={authStatus?.mode === 'demo'}
        activeRepoName={
          activeRepo ? `${activeRepo.owner}/${activeRepo.name}` : undefined
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar with Hamburger Toggle */}
        <Topbar
          onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
          repos={repos}
          activeRepo={activeRepo}
          onSelectRepo={handleSelectRepo}
          authenticated={authStatus?.authenticated ?? false}
          user={authStatus?.user ?? null}
          isDemoMode={authStatus?.mode === 'demo'}
          githubConfigured={authStatus?.githubConfigured ?? false}
          onConnectGitHub={handleConnectGitHub}
          onToggleDemoMode={handleToggleDemoMode}
          onLogout={handleLogout}
          onAnalyze={() => activeRepo && handleAnalyzeRepo(activeRepo.id)}
          isAnalyzing={isAnalyzing}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : toastMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-warm-card text-warm-primary border-warm-border'
              }`}
            >
              {toastMessage.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              {toastMessage.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="ml-2 text-warm-secondary hover:text-warm-primary p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {currentTab === 'overview' && (
            <OverviewView
              authenticated={authStatus?.authenticated ?? false}
              user={authStatus?.user ?? null}
              isDemoMode={authStatus?.mode === 'demo'}
              githubConfigured={authStatus?.githubConfigured ?? false}
              repo={activeRepo}
              availableRepos={repos}
              onSelectRepo={handleSelectRepo}
              onConnectGitHub={handleConnectGitHub}
              onToggleDemoMode={handleToggleDemoMode}
              onAnalyzeRepo={() => activeRepo && handleAnalyzeRepo(activeRepo.id)}
              isAnalyzing={isAnalyzing}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'repositories' && (
            <RepositoriesView
              repos={repos}
              activeRepo={activeRepo}
              onSelectRepo={handleSelectRepo}
              onAnalyzeRepo={handleAnalyzeRepo}
              isAnalyzing={isAnalyzing}
              onConnectGitHub={handleConnectGitHub}
              authenticated={authStatus?.authenticated ?? false}
              isDemoMode={authStatus?.mode === 'demo'}
            />
          )}

          {currentTab === 'architecture' && (
            <ArchitectureView
              repo={activeRepo}
              onAnalyzeRepo={() => activeRepo && handleAnalyzeRepo(activeRepo.id)}
              isAnalyzing={isAnalyzing}
            />
          )}

          {currentTab === 'contracts' && (
            <ContractsView
              repo={activeRepo}
              findings={findings}
              summary={contractsSummary}
              onAnalyzeRepo={() => activeRepo && handleAnalyzeRepo(activeRepo.id)}
              isAnalyzing={isAnalyzing}
            />
          )}

          {currentTab === 'prs' && (
            <PRReviewsView
              repo={activeRepo}
              onNavigateToImpact={handleNavigateToImpact}
              onAnalyzeRepo={() => activeRepo && handleAnalyzeRepo(activeRepo.id)}
              isAnalyzing={isAnalyzing}
            />
          )}

          {currentTab === 'impact' && (
            <ChangeImpactView
              repo={activeRepo}
              prId={targetPrId}
              onAnalyzeRepo={() => activeRepo && handleAnalyzeRepo(activeRepo.id)}
              isAnalyzing={isAnalyzing}
            />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};
