import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { OverviewView } from './views/OverviewView';
import { RepositoriesView } from './views/RepositoriesView';
import { ArchitectureView } from './views/ArchitectureView';
import { ContractsView } from './views/ContractsView';
import { PRReviewsView } from './views/PRReviewsView';
import { ChangeImpactView } from './views/ChangeImpactView';
import { SettingsView } from './views/SettingsView';
import { RepoMetadata, ContractFinding, api } from './api/client';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [repos, setRepos] = useState<RepoMetadata[]>([]);
  const [activeRepo, setActiveRepo] = useState<RepoMetadata | null>(null);
  const [findings, setFindings] = useState<ContractFinding[]>([]);
  const [contractsSummary, setContractsSummary] = useState({
    totalFindings: 0,
    errorsCount: 0,
    warningsCount: 0,
    infoCount: 0,
    verifiedContracts: 0,
  });
  const [openPRsCount, setOpenPRsCount] = useState<number>(2);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [targetPrId, setTargetPrId] = useState<string>('pr-14');

  const loadData = async (repoId: string) => {
    setIsRefreshing(true);
    try {
      const [authRes, reposRes, repoDetail, contractsRes, prsRes] = await Promise.all([
        api.getAuthStatus(),
        api.getRepos(),
        api.getRepoDetails(repoId),
        api.getContracts(repoId),
        api.getPRs(repoId),
      ]);

      setIsDemoMode(authRes.mode === 'demo');
      setRepos(reposRes);
      setActiveRepo(repoDetail);
      setFindings(contractsRes.findings || []);
      setContractsSummary(contractsRes.summary || {
        totalFindings: 0,
        errorsCount: 0,
        warningsCount: 0,
        infoCount: 0,
        verifiedContracts: 0,
      });
      setOpenPRsCount(prsRes.length);
    } catch (e) {
      console.error('Failed to load repository workspace', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData('krishisetu');
  }, []);

  const handleSelectRepo = (repo: RepoMetadata) => {
    setActiveRepo(repo);
    loadData(repo.id);
  };

  const handleNavigateToImpact = (prId: string) => {
    setTargetPrId(prId);
    setCurrentTab('impact');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        contractErrorsCount={contractsSummary.errorsCount}
        openPRsCount={openPRsCount}
        isDemoMode={isDemoMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <Topbar
          repos={repos}
          activeRepo={activeRepo}
          onSelectRepo={handleSelectRepo}
          isDemoMode={isDemoMode}
          onRefresh={() => activeRepo && loadData(activeRepo.id)}
          isRefreshing={isRefreshing}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {currentTab === 'overview' && (
            <OverviewView
              repo={activeRepo}
              contractErrorsCount={contractsSummary.errorsCount}
              openPRsCount={openPRsCount}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'repositories' && (
            <RepositoriesView
              repos={repos}
              activeRepo={activeRepo}
              onSelectRepo={handleSelectRepo}
            />
          )}

          {currentTab === 'architecture' && activeRepo && (
            <ArchitectureView repoId={activeRepo.id} />
          )}

          {currentTab === 'contracts' && (
            <ContractsView
              findings={findings}
              summary={contractsSummary}
            />
          )}

          {currentTab === 'prs' && activeRepo && (
            <PRReviewsView
              repoId={activeRepo.id}
              onNavigateToImpact={handleNavigateToImpact}
            />
          )}

          {currentTab === 'impact' && activeRepo && (
            <ChangeImpactView
              repoId={activeRepo.id}
              prId={targetPrId}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  );
};
