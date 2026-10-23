import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  FolderGit2, 
  Lock, 
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  AlertCircle,
  Database
} from 'lucide-react';
import { api, AuthStatusResponse } from '../api/client';
import { Badge } from '../components/Badge';

export const SettingsView: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuthStatus().then(res => {
      setAuthStatus(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      <div className="pb-4 border-b border-warm-border">
        <h2 className="text-xl font-bold text-warm-primary tracking-tight">Settings & Integrations</h2>
        <p className="text-xs text-warm-secondary mt-0.5">
          GitHub permissions, AI provider connection, and security sandbox guarantees.
        </p>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-warm-accent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* GitHub App Integration Card */}
          <div className="bg-warm-card rounded-xl border border-warm-border p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-warm-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warm-primary text-warm-card flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-warm-primary">GitHub App / OAuth Integration</h3>
                  <p className="text-xs text-warm-secondary">Repository metadata & pull request read access</p>
                </div>
              </div>
              <Badge variant={authStatus?.githubConfigured ? 'emerald' : 'amber'}>
                {authStatus?.githubConfigured ? 'OAUTH CONFIGURED' : 'SETUP REQUIRED'}
              </Badge>
            </div>

            {authStatus?.githubConfigured ? (
              <div className="space-y-3 text-xs text-warm-secondary">
                <div className="p-3.5 bg-warm-bg rounded-lg border border-warm-border space-y-2">
                  <span className="font-bold text-warm-primary block">Active Security Scopes:</span>
                  <ul className="space-y-1 font-mono text-[11px] text-warm-primary">
                    <li className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>repo:read — Read-only repository code and AST tree ingestion</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>pull_requests:read — Pull request unified diff review</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-warm-secondary">
                <div className="p-4 bg-warm-bg border border-warm-border rounded-lg space-y-2.5">
                  <span className="font-bold text-warm-primary flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-warm-accent" />
                    How to configure GitHub OAuth:
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-warm-secondary leading-relaxed pl-1">
                    <li>
                      Visit{' '}
                      <a 
                        href="https://github.com/settings/developers" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 underline font-semibold"
                      >
                        GitHub Developer Settings &rarr; OAuth Apps
                      </a>
                    </li>
                    <li>Click <strong>"New OAuth App"</strong>.</li>
                    <li>Set Application name to <code>CodePulse</code>.</li>
                    <li>Set Homepage URL to <code>http://localhost:5173</code>.</li>
                    <li>
                      Set Authorization callback URL to:
                      <code className="block bg-warm-card p-1.5 rounded border border-warm-border text-warm-primary font-mono text-[11px] mt-1">
                        http://localhost:3001/api/auth/github/callback
                      </code>
                    </li>
                    <li>Generate a client secret and add both to your local <code>.env</code> file:</li>
                  </ol>
                  <pre className="p-2.5 bg-warm-card text-warm-primary font-mono text-[11px] rounded border border-warm-border overflow-x-auto">
{`GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback`}
                  </pre>
                </div>
              </div>
            )}

            <div className="p-3 bg-warm-highlight border border-warm-border rounded-lg flex items-start gap-2.5 text-warm-secondary text-xs">
              <Lock className="w-4 h-4 text-warm-accent shrink-0 mt-0.5" />
              <div>
                <strong className="text-warm-primary block">Strict Read-Only Guarantee:</strong>
                <span>CodePulse operates under least-privilege principles. No tokens have push, commit, or merge permissions on your GitHub repositories.</span>
              </div>
            </div>
          </div>

          {/* AI Model Provider Card */}
          <div className="bg-warm-card rounded-xl border border-warm-border p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-warm-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warm-accent text-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-warm-primary">Google Gemini AI Engine</h3>
                  <p className="text-xs text-warm-secondary">Architecture explanations & contextual patch synthesis</p>
                </div>
              </div>
              <Badge variant={authStatus?.geminiConfigured ? 'emerald' : 'slate'}>
                {authStatus?.geminiConfigured ? 'GEMINI FLASH ACTIVE' : 'DETERMINISTIC FALLBACK ACTIVE'}
              </Badge>
            </div>

            <p className="text-xs text-warm-secondary leading-relaxed">
              When <code className="font-mono bg-warm-bg px-1 py-0.5 rounded border border-warm-border">GEMINI_API_KEY</code> is configured in <code className="font-mono bg-warm-bg px-1 py-0.5 rounded border border-warm-border">.env</code>, CodePulse uses Gemini 1.5 Flash for natural-language explanations and patch synthesis. If unset, CodePulse operates with its built-in deterministic heuristic rule engine with zero external network dependencies.
            </p>
          </div>

          {/* MySQL Database Persistence Card */}
          <div className="bg-warm-card rounded-xl border border-warm-border p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-warm-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-warm-primary">MySQL Relational Persistence</h3>
                  <p className="text-xs text-warm-secondary">Session store, repository metadata, AST metrics & contract audits</p>
                </div>
              </div>
              <Badge variant="blue">MYSQL SCHEMA READY</Badge>
            </div>

            <div className="space-y-2 text-xs text-warm-secondary leading-relaxed">
              <p>
                CodePulse stores user sessions, AST analysis runs, and detected contract findings in MySQL. When MySQL is unreachable or not configured, it gracefully defaults to an in-memory fallback so tests and local exploration continue uninterrupted.
              </p>
              <div className="p-3 bg-warm-bg rounded-lg border border-warm-border font-mono text-[11px] text-warm-primary">
                mysql -u root -p codepulse &lt; server/src/db/schema.sql
              </div>
            </div>
          </div>

          {/* Security & HttpOnly Cookie Sandbox Card */}
          <div className="bg-warm-card rounded-xl border border-warm-border p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-warm-primary text-sm">
              <Lock className="w-4 h-4 text-warm-accent" />
              <span>Session Security Architecture</span>
            </div>
            <ul className="space-y-1.5 text-xs text-warm-secondary">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>HttpOnly Cookies:</strong> Sessions are managed via secure <code className="font-mono text-warm-primary bg-warm-bg px-1 rounded">codepulse_session</code> cookies. Tokens are inaccessible to client-side scripts, protecting against XSS.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Zero Query Param Leaks:</strong> Bearer tokens are never exposed in URL query parameters or stored in localStorage.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Cryptographic State Validation:</strong> OAuth handshakes enforce single-use 48-character state nonces with 10-minute TTLs to defeat CSRF and replay attacks.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
