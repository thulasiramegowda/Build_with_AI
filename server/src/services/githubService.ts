import { config } from '../config';
import { UserProfile, RepositoryMetadata, PullRequestDiff } from '../types';

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
  }
};
