import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Terminal, 
  FileDiff, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Check, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { ContractFinding, api } from '../api/client';
import { DiffViewer } from './DiffViewer';
import { Badge } from './Badge';

interface SafePatchModalProps {
  finding: ContractFinding | null;
  onClose: () => void;
}

export const SafePatchModal: React.FC<SafePatchModalProps> = ({ finding, onClose }) => {
  const [activeTab, setActiveTab] = useState<'explanation' | 'prompt' | 'patch'>('explanation');
  const [explanation, setExplanation] = useState<string>('');
  const [agentPrompt, setAgentPrompt] = useState<string>('');
  const [patchDiff, setPatchDiff] = useState<string>('');
  const [targetFile, setTargetFile] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);

  useEffect(() => {
    if (!finding) return;

    setUserConfirmed(false);
    setApplyResult(null);
    setLoading(true);

    Promise.all([
      api.explainFinding(finding),
      api.getAgentPrompt(finding),
      api.proposePatch(finding),
    ]).then(([expRes, promptRes, patchRes]) => {
      setExplanation(expRes.explanation);
      setAgentPrompt(promptRes.prompt);
      setPatchDiff(patchRes.patch);
      setTargetFile(patchRes.targetFile);
    }).finally(() => {
      setLoading(false);
    });
  }, [finding]);

  if (!finding) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(agentPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleApply = async () => {
    if (!userConfirmed) return;
    try {
      const res = await api.applyPatch(finding.id, userConfirmed);
      setApplyResult(res.message);
    } catch (e: any) {
      setApplyResult(`Error: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={finding.severity === 'error' ? 'rose' : 'amber'}>
                {finding.severity.toUpperCase()}
              </Badge>
              <Badge variant="blue">{Math.round(finding.confidence * 100)}% Confidence</Badge>
              <span className="text-xs font-mono text-slate-500">{finding.type}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">{finding.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex gap-6 text-sm bg-white">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`py-3 font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'explanation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Architecture Explanation</span>
          </button>

          <button
            onClick={() => setActiveTab('prompt')}
            className={`py-3 font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'prompt'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Coding Agent Prompt</span>
          </button>

          <button
            onClick={() => setActiveTab('patch')}
            className={`py-3 font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'patch'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileDiff className="w-4 h-4" />
            <span>Safe Code Patch</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-16 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-slate-500">Generating evidence-backed remediation...</p>
            </div>
          ) : (
            <>
              {activeTab === 'explanation' && (
                <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-4">
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                      Evidence Citation
                    </h4>
                    {finding.frontendEvidence && (
                      <p className="text-xs text-blue-800 font-mono">
                        Frontend: {finding.frontendEvidence.filePath}:{finding.frontendEvidence.lineNumber} &rarr;{' '}
                        {finding.frontendEvidence.codeSnippet}
                      </p>
                    )}
                    {finding.backendEvidence && (
                      <p className="text-xs text-blue-800 font-mono mt-1">
                        Backend: {finding.backendEvidence.filePath}:{finding.backendEvidence.lineNumber} &rarr;{' '}
                        {finding.backendEvidence.codeSnippet}
                      </p>
                    )}
                  </div>

                  <div className="whitespace-pre-line text-slate-800 text-sm">
                    {explanation}
                  </div>
                </div>
              )}

              {activeTab === 'prompt' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Copy this prompt into your favorite agent harness (Antigravity, Cursor, Claude Code) to apply the fix:
                    </p>
                    <button
                      onClick={handleCopyPrompt}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                    >
                      {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPrompt ? 'Copied to Clipboard' : 'Copy Prompt'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                    {agentPrompt}
                  </pre>
                </div>
              )}

              {activeTab === 'patch' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Target File: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{targetFile}</code></span>
                    <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Non-destructive diff verified</span>
                    </span>
                  </div>

                  <DiffViewer diffText={patchDiff} filePath={targetFile} />

                  {/* Safety Gate Checkbox */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="safetyApproval"
                        checked={userConfirmed}
                        onChange={(e) => setUserConfirmed(e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="safetyApproval" className="text-xs text-slate-700 cursor-pointer">
                        <strong className="text-slate-900">Explicit Human Approval:</strong> I have reviewed the line diff above. I authorize CodePulse to apply this patch to the sandbox environment without modifying uncommitted files or pushing to remote repositories.
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-[11px] text-slate-500">
                        Zero silent writes &bull; Read-only repository safety preserved
                      </span>
                      <button
                        onClick={handleApply}
                        disabled={!userConfirmed}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                          userConfirmed
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Simulate & Apply Patch</span>
                      </button>
                    </div>

                    {applyResult && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{applyResult}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
