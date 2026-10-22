export interface ParsedDiffFile {
  path: string;
  oldPath?: string;
  additions: number;
  deletions: number;
  diffHunks: string[];
  changedSymbols: string[];
}

export function parseUnifiedDiff(diffText: string): ParsedDiffFile[] {
  const files: ParsedDiffFile[] = [];
  const lines = diffText.split('\n');

  let currentFile: ParsedDiffFile | null = null;
  let currentHunk: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('diff --git')) {
      if (currentFile) {
        if (currentHunk.length > 0) {
          currentFile.diffHunks.push(currentHunk.join('\n'));
          currentHunk = [];
        }
        files.push(currentFile);
      }

      // Extract new file path: diff --git a/path b/path
      const parts = line.split(' ');
      const bPath = parts[3] ? parts[3].replace(/^b\//, '') : 'unknown';

      currentFile = {
        path: bPath,
        additions: 0,
        deletions: 0,
        diffHunks: [],
        changedSymbols: [],
      };
      continue;
    }

    if (!currentFile) continue;

    if (line.startsWith('@@')) {
      if (currentHunk.length > 0) {
        currentFile.diffHunks.push(currentHunk.join('\n'));
        currentHunk = [];
      }
      currentHunk.push(line);

      // Extract function context if present in hunk header: @@ -10,5 +10,6 @@ function name
      const funcMatch = line.match(/@@\s+[^@]+@@\s+(.*)/);
      if (funcMatch && funcMatch[1].trim()) {
        const symbol = funcMatch[1].trim();
        if (!currentFile.changedSymbols.includes(symbol)) {
          currentFile.changedSymbols.push(symbol);
        }
      }
      continue;
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentFile.additions++;
      currentHunk.push(line);

      // Detect function or route declarations inside additions
      const fnMatch = line.match(/(?:function|const|async function|export function)\s+([a-zA-Z0-9_]+)/);
      if (fnMatch && !currentFile.changedSymbols.includes(fnMatch[1])) {
        currentFile.changedSymbols.push(fnMatch[1]);
      }
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      currentFile.deletions++;
      currentHunk.push(line);
    } else if (line.startsWith(' ')) {
      currentHunk.push(line);
    }
  }

  if (currentFile) {
    if (currentHunk.length > 0) {
      currentFile.diffHunks.push(currentHunk.join('\n'));
    }
    files.push(currentFile);
  }

  return files;
}

export function evaluateRegressionRisk(
  changedFiles: ParsedDiffFile[],
  routesCount: number
): { riskLevel: 'high' | 'medium' | 'low'; riskSummary: string } {
  let hasRouteChanges = false;
  let hasModelChanges = false;
  let totalAdditions = 0;
  let totalDeletions = 0;

  for (const file of changedFiles) {
    totalAdditions += file.additions;
    totalDeletions += file.deletions;

    if (file.path.includes('routes') || file.path.includes('controllers')) {
      hasRouteChanges = true;
    }
    if (file.path.includes('models') || file.path.includes('schema')) {
      hasModelChanges = true;
    }
  }

  if (hasRouteChanges && hasModelChanges) {
    return {
      riskLevel: 'high',
      riskSummary: `High risk: Pull request modifies both core route handlers and data models across ${changedFiles.length} files (+${totalAdditions}/-${totalDeletions}). Client contract breakages and database state synchronization regressions are probable.`,
    };
  }

  if (hasRouteChanges || totalDeletions > 25) {
    return {
      riskLevel: 'medium',
      riskSummary: `Medium risk: Route or controller logic was modified in ${changedFiles.length} files (+${totalAdditions}/-${totalDeletions}). Downstream frontend components and integration tests should be inspected for contract compliance.`,
    };
  }

  return {
    riskLevel: 'low',
    riskSummary: `Low risk: Contained change impacting ${changedFiles.length} files (+${totalAdditions}/-${totalDeletions}). No core schema or public API contracts were altered.`,
  };
}
