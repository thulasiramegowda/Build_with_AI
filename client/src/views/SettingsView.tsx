import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Key, 
  Sparkles, 
  FolderGit2, 
  Lock, 
  ExternalLink,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';
import { Badge } from '../components/Badge';

export const SettingsView: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuthStatus().then(res => {
      setAuthStatus(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Settings & Integrations</h2>
        <p className="text-xs text-slate-500 mt-1">
          GitHub permissions, AI provider connection, and security sandbox guarantees.
        </p>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* GitHub App Integration Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">GitHub App Integration</h3>
                  <p className="text-xs text-slate-500">Repository metadata & pull request read access</p>
                </div>
              </div>
              <Badge variant={authStatus?.githubConfigured ? 'emerald' : 'blue'}>
                {authStatus?.githubConfigured ? 'LIVE GITHUB CONFIGURED' : 'LOCAL DEMO MODE (ACTIVE)'}
              </Badge>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">Granted Security Scopes:</span>
                <ul className="space-y-1 font-mono text-[11px] text-slate-700">
                  <li className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>repo:read — Read-only static AST codebase ingestion</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>pull_requests:read — Pull request diff inspections</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Strict Read-Only Guarantee:</strong>
                  <span>CodePulse operates under least-privilege principles. No tokens have push, commit, or merge permissions on your GitHub repositories.</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Model Provider Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Google Gemini LLM Engine</h3>
                  <p className="text-xs text-slate-500">Architecture explanations and contextual patch proposals</p>
                </div>
              </div>
              <Badge variant={authStatus?.geminiConfigured ? 'emerald' : 'slate'}>
                {authStatus?.geminiConfigured ? 'GEMINI 1.5 FLASH ACTIVE' : 'DETERMINISTIC FALLBACK ACTIVE'}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              When <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">GEMINI_API_KEY</code> is configured in <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">.env</code>, CodePulse uses Gemini 1.5 Flash for natural-language explanations and patch synthesis. If unset, CodePulse's deterministic rule-based engine generates instant, 100% verified explanations and patch templates offline.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
