import { config } from '../config';
import { UserProfile, RepositoryMetadata, PullRequestDiff, RouteDefinition, ApiClientCall } from '../types';
import { analyzeCodeContent } from '../engine/staticAnalyzer';

export interface LiveIngestionResult {
  commitSha: string;
  totalFiles: number;
  allFilePaths: string[];
  topLevelFolders: string[];
  frameworks: string[];
  routes: RouteDefinition[];
  apiCalls: ApiClientCall[];
  components: { name: string; filePath: string; imports?: string[] }[];
  models: { name: string; filePath: string }[];
}

export const githubService = {
  isConfigured(): boolean {
    return Boolean(config.github.clientId && config.github.clientSecret);
  },

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: config.github.clientId,
      redirect_uri: config.github.callbackUrl,
      scope: 'repo read:user user:email',
      state,
      allow_signup: 'true',
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  },

  async exchangeCodeForToken(code: string): Promise<string> {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: config.github.callbackUrl,
      }),
    });

    if (!res.ok) {
      throw new Error(`GitHub token exchange failed: HTTP ${res.status}`);
    }

    const data = await res.json() as any;
    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    return data.access_token;
  },

  async fetchUserProfile(accessToken: string): Promise<UserProfile> {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'CodePulse-App',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch GitHub profile: HTTP ${res.status}`);
    }

    const data = await res.json() as any;
    return {
      id: String(data.id),
      login: data.login,
      name: data.name || data.login,
      avatarUrl: data.avatar_url,
      email: data.email || null,
      htmlUrl: data.html_url,
    };
  },

  async fetchUserRepositories(accessToken: string): Promise<RepositoryMetadata[]> {
    const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50&affiliation=owner,collaborator', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'CodePulse-App',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch repositories from GitHub API: HTTP ${res.status}`);
    }

    const data = await res.json() as any[];
    return data.map((r) => ({
      id: String(r.id),
      name: r.name,
      owner: r.owner.login,
      fullName: r.full_name,
      description: r.description,
      defaultBranch: r.default_branch || 'main',
      languages: r.language ? { [r.language]: 100 } : {},
      frameworks: [],
      analysisStatus: 'unscanned',
      lastAnalyzed: null,
      isFixture: false,
      url: r.html_url,
      isPrivate: r.private,
    }));
  },

  async fetchRepositoryPullRequests(accessToken: string, owner: string, repo: string): Promise<any[]> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=20`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'CodePulse-App',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch PRs from GitHub: HTTP ${res.status}`);
    }

    return res.json() as Promise<any[]>;
  },

  async fetchPullRequestDiff(accessToken: string, owner: string, repo: string, pullNumber: number): Promise<string> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'CodePulse-App',
        'Accept': 'application/vnd.github.v3.diff',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch PR diff: HTTP ${res.status}`);
    }

    return res.text();
  },

  /**
   * Fetch recursive git tree and commit SHA for repository default branch
   */
  async fetchRepositoryTree(
    accessToken: string,
    owner: string,
    repo: string,
    defaultBranch: string = 'main'
  ): Promise<{ commitSha: string; tree: any[] }> {
    let commitSha = defaultBranch;
    let treeSha = defaultBranch;

    // 1. Fetch latest commit for branch
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${defaultBranch}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'CodePulse-App',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (commitRes.ok) {
      const commitData = await commitRes.json() as any;
      commitSha = commitData.sha || defaultBranch;
      treeSha = commitData.commit?.tree?.sha || commitSha;
    } else if (commitRes.status === 404 && defaultBranch === 'main') {
      // Fallback to 'master' if main returned 404
      const masterRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/master`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'CodePulse-App',
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      if (masterRes.ok) {
        const commitData = await masterRes.json() as any;
        commitSha = commitData.sha || 'master';
        treeSha = commitData.commit?.tree?.sha || commitSha;
      }
    }

    // 2. Fetch recursive git tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'CodePulse-App',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!treeRes.ok) {
      if (treeRes.status === 403) {
        throw new Error('GitHub API rate limit exceeded or access forbidden. Please wait a moment or check repository permissions.');
      }
      throw new Error(`GitHub tree fetch failed: HTTP ${treeRes.status} for ${owner}/${repo}`);
    }

    const treeData = await treeRes.json() as any;
    return {
      commitSha,
      tree: Array.isArray(treeData.tree) ? treeData.tree : [],
    };
  },

  /**
   * Fetch raw file content from GitHub using commit ref
   */
  async fetchFileRawContent(
    accessToken: string,
    owner: string,
    repo: string,
    filePath: string,
    ref: string
  ): Promise<string> {
    const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'CodePulse-App',
        'Accept': 'application/vnd.github.v3.raw',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch file content for ${filePath}: HTTP ${res.status}`);
    }

    const text = await res.text();
    // Handle edge case where base64 JSON payload is returned instead of raw text
    if (text.startsWith('{') && text.includes('"encoding":"base64"')) {
      try {
        const json = JSON.parse(text);
        if (json.content && json.encoding === 'base64') {
          return Buffer.from(json.content, 'base64').toString('utf8');
        }
      } catch {
        // Fall back to text
      }
    }
    return text;
  },

  /**
   * Ingest and statically analyze real GitHub repository files
   */
  async ingestAndAnalyzeRepository(
    accessToken: string,
    owner: string,
    repo: string,
    defaultBranch: string = 'main'
  ): Promise<LiveIngestionResult> {
    const { commitSha, tree } = await this.fetchRepositoryTree(accessToken, owner, repo, defaultBranch);

    const IGNORED_PREFIXES = [
      'node_modules/',
      '.git/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      '.cache/',
      'vendor/',
      'out/',
      'public/',
      'assets/',
      'images/',
      '.vscode/',
      '.idea/',
    ];

    const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.sol'];

    // Filter tree to code files
    const validBlobs = tree.filter((item: any) => {
      if (item.type !== 'blob') return false;
      const pathLower = item.path.toLowerCase();
      if (IGNORED_PREFIXES.some(prefix => pathLower.startsWith(prefix) || pathLower.includes('/' + prefix))) return false;
      const isSource = SOURCE_EXTENSIONS.some(ext => pathLower.endsWith(ext));
      const isConfig = pathLower.endsWith('package.json') || pathLower.endsWith('requirements.txt');
      return isSource || isConfig;
    });

    const allFilePaths: string[] = validBlobs.map((b: any) => b.path);

    // Extract top-level project folders
    const topLevelFolders = Array.from(
      new Set(
        allFilePaths
          .map(p => p.split('/')[0])
          .filter(f => f && !f.includes('.'))
      )
    );

    // Prioritize high-value source files for static AST analysis
    const priorityScore = (itemPath: string): number => {
      const p = itemPath.toLowerCase();
      let score = 0;
      if (p.endsWith('package.json') || p.endsWith('requirements.txt')) score += 100;
      if (p.includes('route') || p.includes('controller') || p.includes('endpoint')) score += 80;
      if (p.includes('api/') || p.includes('server/') || p.includes('backend/')) score += 70;
      if (p.endsWith('.sol') || p.includes('contract')) score += 65;
      if (p.includes('probe') || p.includes('sensor') || p.includes('telemetry') || p.includes('iot')) score += 65;
      if (p.includes('component') || p.includes('view') || p.includes('page') || p.endsWith('.tsx') || p.endsWith('.jsx')) score += 50;
      if (p.includes('model') || p.includes('schema') || p.includes('entity')) score += 45;
      return score;
    };

    const sortedFiles = [...validBlobs].sort((a, b) => priorityScore(b.path) - priorityScore(a.path));
    // Cap at 45 files to prevent rate limiting or long execution times
    const candidateFiles = sortedFiles.slice(0, 45);

    const results = {
      routes: [] as RouteDefinition[],
      apiCalls: [] as ApiClientCall[],
      components: [] as any[],
      models: [] as any[],
    };

    const frameworksFound = new Set<string>();

    // Fetch and analyze candidates concurrently in batches of 6
    const BATCH_SIZE = 6;
    for (let i = 0; i < candidateFiles.length; i += BATCH_SIZE) {
      const batch = candidateFiles.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (file: any) => {
          try {
            // Skip files > 120KB to keep analysis fast and responsive
            if (file.size && file.size > 120000) return;

            const content = await this.fetchFileRawContent(accessToken, owner, repo, file.path, commitSha);
            analyzeCodeContent(content, file.path, results);

            // Framework detection
            if (file.path.toLowerCase().endsWith('package.json')) {
              try {
                const pkg = JSON.parse(content);
                const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
                if (allDeps.react) frameworksFound.add('React');
                if (allDeps.express) frameworksFound.add('Express');
                if (allDeps.vite) frameworksFound.add('Vite');
                if (allDeps.next) frameworksFound.add('Next.js');
                if (allDeps.axios) frameworksFound.add('Axios');
                if (allDeps.hardhat) frameworksFound.add('Hardhat');
                if (allDeps.ethers) frameworksFound.add('Ethers.js');
                if (allDeps.web3) frameworksFound.add('Web3.js');
              } catch {
                // Ignore json parse error in package.json
              }
            }

            if (file.path.toLowerCase().endsWith('requirements.txt')) {
              const lower = content.toLowerCase();
              if (lower.includes('fastapi')) frameworksFound.add('FastAPI');
              if (lower.includes('flask')) frameworksFound.add('Flask');
              if (lower.includes('pydantic')) frameworksFound.add('Pydantic');
              if (lower.includes('django')) frameworksFound.add('Django');
            }
          } catch (err: any) {
            console.warn(`[CodePulse Ingestion] Skipped file ${file.path}: ${err.message}`);
          }
        })
      );
    }

    // Language / domain detections based on discovered files
    if (allFilePaths.some(p => p.endsWith('.sol') || p.includes('blockchain/'))) {
      frameworksFound.add('Solidity (Smart Contracts)');
    }
    if (allFilePaths.some(p => p.includes('aqua_ethic_probe') || p.includes('sensor') || p.includes('probe'))) {
      frameworksFound.add('IoT Telemetry Probe');
    }
    if (allFilePaths.some(p => p.endsWith('.py'))) {
      frameworksFound.add('Python');
    }
    if (allFilePaths.some(p => p.endsWith('.ts') || p.endsWith('.tsx'))) {
      frameworksFound.add('TypeScript');
    }

    return {
      commitSha,
      totalFiles: allFilePaths.length,
      allFilePaths,
      topLevelFolders,
      frameworks: Array.from(frameworksFound),
      routes: results.routes,
      apiCalls: results.apiCalls,
      components: results.components,
      models: results.models,
    };
  }
};
