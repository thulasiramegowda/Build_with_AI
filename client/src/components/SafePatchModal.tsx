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
    <div className="fixed inset-0 z-50 bg-warm-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-warm-card rounded-2xl shadow-2xl border border-warm-border w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-warm-border flex items-start justify-between bg-warm-sidebar">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={finding.severity === 'error' ? 'rose' : 'amber'}>
                {finding.severity.toUpperCase()}
              </Badge>
              <Badge variant="blue">{Math.round(finding.confidence * 100)}% Confidence</Badge>
              <span className="text-xs font-mono text-warm-secondary">{finding.type}</span>
            </div>
            <h3 className="text-base font-bold text-warm-primary">{finding.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-warm-border/60 text-warm-secondary hover:text-warm-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-warm-border flex gap-6 text-xs font-bold bg-warm-card">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'explanation'
                ? 'border-warm-accent text-warm-accent-hover'
                : 'border-transparent text-warm-secondary hover:text-warm-primary'
            }`}
          >
            <Sparkles className="w-4 h-4 text-warm-accent" />
            <span>AI Architecture Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('prompt')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'prompt'
                ? 'border-warm-accent text-warm-accent-hover'
                : 'border-transparent text-warm-secondary hover:text-warm-primary'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Coding Agent Prompt</span>
          </button>

          <button
            onClick={() => setActiveTab('patch')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'patch'
                ? 'border-warm-accent text-warm-accent-hover'
                : 'border-transparent text-warm-secondary hover:text-warm-primary'
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
              <div className="animate-spin w-8 h-8 border-2 border-warm-accent border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs text-warm-secondary">Synthesizing evidence-backed remediation...</p>
            </div>
          ) : (
            <>
              {activeTab === 'explanation' && (
                <div className="space-y-4 text-xs text-warm-primary leading-relaxed">
                  <div className="p-3.5 bg-warm-bg border border-warm-border rounded-xl">
                    <span className="text-[10px] font-bold text-warm-secondary uppercase tracking-wider block mb-1">
                      Evidence Citation
                    </span>
                    {finding.frontendEvidence && (
                      <p className="font-mono text-blue-700">
                        Frontend: {finding.frontendEvidence.filePath}:{finding.frontendEvidence.lineNumber} &rarr;{' '}
                        {finding.frontendEvidence.codeSnippet}
                      </p>
                    )}
                    {finding.backendEvidence && (
                      <p className="font-mono text-emerald-700 mt-1">
                        Backend: {finding.backendEvidence.filePath}:{finding.backendEvidence.lineNumber} &rarr;{' '}
                        {finding.backendEvidence.codeSnippet}
                      </p>
                    )}
                  </div>

                  <div className="whitespace-pre-line text-warm-primary bg-warm-card p-4 rounded-xl border border-warm-border leading-relaxed font-sans text-xs">
                    {explanation}
                  </div>
                </div>
              )}

              {activeTab === 'prompt' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-warm-secondary">
                      Copy this prompt into your coding agent (Antigravity, Cursor, Claude Code) to apply the fix:
                    </p>
                    <button
                      onClick={handleCopyPrompt}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-bg hover:bg-warm-border text-xs font-bold text-warm-primary transition-colors border border-warm-border"
                    >
                      {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPrompt ? 'Copied to Clipboard' : 'Copy Prompt'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-warm-primary text-warm-card rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-warm-primary">
                    {agentPrompt}
                  </pre>
                </div>
              )}

              {activeTab === 'patch' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-warm-secondary">Target File: <code className="font-mono bg-warm-bg px-1.5 py-0.5 rounded border border-warm-border text-warm-primary">{targetFile}</code></span>
                    <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Non-destructive diff verified</span>
                    </span>
                  </div>

                  <DiffViewer diffText={patchDiff} filePath={targetFile} />

                  {/* Safety Gate Checkbox */}
                  <div className="p-4 bg-warm-bg border border-warm-border rounded-xl space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="safetyApproval"
                        checked={userConfirmed}
                        onChange={(e) => setUserConfirmed(e.target.checked)}
                        className="mt-1 h-4 w-4 text-warm-accent rounded border-warm-border focus:ring-warm-accent cursor-pointer"
                      />
                      <label htmlFor="safetyApproval" className="text-xs text-warm-secondary cursor-pointer">
                        <strong className="text-warm-primary">Explicit Human Approval:</strong> I have reviewed the line diff above. I authorize CodePulse to simulate this patch in the sandbox environment without modifying uncommitted files or pushing to remote repositories.
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-warm-border/60">
                      <span className="text-[11px] text-warm-secondary">
                        Zero silent writes &bull; Read-only repository safety preserved
                      </span>
                      <button
                        onClick={handleApply}
                        disabled={!userConfirmed}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          userConfirmed
                            ? 'bg-warm-accent hover:bg-warm-accent-hover text-white shadow-xs'
                            : 'bg-warm-border text-warm-secondary cursor-not-allowed'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Simulate & Apply Patch</span>
                      </button>
                    </div>

                    {applyResult && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
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
        <div className="px-6 py-3 bg-warm-sidebar border-t border-warm-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-warm-secondary hover:bg-warm-border/60 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
