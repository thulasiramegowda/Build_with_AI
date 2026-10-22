import fs from 'fs';
import path from 'path';
import { RouteDefinition, ApiClientCall } from '../types';

export interface AnalysisResult {
  routes: RouteDefinition[];
  apiCalls: ApiClientCall[];
  components: { name: string; filePath: string; imports: string[] }[];
  models: { name: string; filePath: string }[];
  fileCount: number;
}

export function normalizePath(routePath: string): string {
  return routePath
    .trim()
    .replace(/\/+/g, '/') // collapse multiple slashes
    .replace(/\/$/, '') // remove trailing slash
    .replace(/\/:([a-zA-Z0-9_]+)/g, '/{param}') // :id -> {param}
    .replace(/\$\{([^}]+)\}/g, '{param}') // ${id} -> {param}
    .toLowerCase();
}

export function analyzeCodeContent(
  content: string,
  filePath: string,
  results: { routes: RouteDefinition[]; apiCalls: ApiClientCall[]; components: any[]; models: any[] }
) {
  const lines = content.split('\n');

  // Check if component or model file
  const baseName = path.basename(filePath, path.extname(filePath));
  if (filePath.includes('/components/') || filePath.includes('\\components\\')) {
    const importLines = lines.filter(l => l.trim().startsWith('import '));
    results.components.push({
      name: baseName,
      filePath,
      imports: importLines.map(l => l.trim()),
    });
  }

  if (filePath.includes('/models/') || filePath.includes('\\models\\')) {
    results.models.push({
      name: baseName,
      filePath,
    });
  }

  // Route definitions: router.get('/path', ...), app.post('/path', ...)
  const routeRegex = /(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/i;

  // Client API calls: axios.get('/path', ...), fetch('/path', ...)
  const axiosRegex = /axios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/i;
  const fetchRegex = /fetch\s*\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*\{\s*method:\s*['"`]([a-zA-Z]+)['"`])?/i;

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check Route
    const routeMatch = line.match(routeRegex);
    if (routeMatch) {
      const method = routeMatch[1].toUpperCase() as RouteDefinition['method'];
      const rawPath = routeMatch[2];
      const paramsMatch = rawPath.match(/:[a-zA-Z0-9_]+/g);
      const parameters = paramsMatch ? paramsMatch.map(p => p.slice(1)) : [];

      results.routes.push({
        id: `route-${results.routes.length + 1}`,
        method,
        path: rawPath,
        normalizedPath: normalizePath(rawPath),
        filePath,
        lineNumber: lineNum,
        parameters,
        handlerName: `handler_${baseName}_L${lineNum}`,
      });
    }

    // Check Axios
    const axiosMatch = line.match(axiosRegex);
    if (axiosMatch) {
      const method = axiosMatch[1].toUpperCase() as ApiClientCall['method'];
      const rawUrl = axiosMatch[2];
      results.apiCalls.push({
        id: `call-${results.apiCalls.length + 1}`,
        method,
        url: rawUrl,
        normalizedPath: normalizePath(rawUrl),
        filePath,
        lineNumber: lineNum,
        callerComponent: baseName,
      });
    }

    // Check Fetch
    const fetchMatch = line.match(fetchRegex);
    if (fetchMatch) {
      const rawUrl = fetchMatch[1];
      const method = (fetchMatch[2] ? fetchMatch[2].toUpperCase() : 'GET') as ApiClientCall['method'];
      results.apiCalls.push({
        id: `call-${results.apiCalls.length + 1}`,
        method,
        url: rawUrl,
        normalizedPath: normalizePath(rawUrl),
        filePath,
        lineNumber: lineNum,
        callerComponent: baseName,
      });
    }
  });
}

export function analyzeDirectory(dirPath: string): AnalysisResult {
  const results: AnalysisResult = {
    routes: [],
    apiCalls: [],
    components: [],
    models: [],
    fileCount: 0,
  };

  function traverse(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'build', '.cache'].includes(entry.name)) {
          continue;
        }
        traverse(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          results.fileCount++;
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const relPath = path.relative(dirPath, fullPath).replace(/\\/g, '/');
            analyzeCodeContent(content, relPath, results);
          } catch (e) {
            console.error(`Error reading ${fullPath}`, e);
          }
        }
      }
    }
  }

  traverse(dirPath);
  return results;
}
