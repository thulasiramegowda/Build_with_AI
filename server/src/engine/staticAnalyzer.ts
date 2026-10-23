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
  const withoutQuery = routePath.split('?')[0];
  return withoutQuery
    .trim()
    .replace(/\/+/g, '/') // collapse multiple slashes
    .replace(/\/$/, '') // remove trailing slash
    .replace(/\/:([a-zA-Z0-9_]+)/g, '/{param}') // :id -> {param}
    .replace(/\{([a-zA-Z0-9_]+)\}/g, '{param}') // {id} -> {param} (FastAPI/OpenAPI style)
    .replace(/\$\{([^}]+)\}/g, '{param}') // ${id} -> {param}
    .toLowerCase();
}

export function analyzeCodeContent(
  content: string,
  filePath: string,
  results: { routes: RouteDefinition[]; apiCalls: ApiClientCall[]; components: any[]; models: any[] }
) {
  const lines = content.split('\n');
  const normalizedFilePath = filePath.replace(/\\/g, '/');
  const baseName = path.basename(filePath, path.extname(filePath));
  const ext = path.extname(filePath).toLowerCase();

  // 1. Component detection
  const isComponentPath =
    normalizedFilePath.includes('/components/') ||
    normalizedFilePath.includes('/views/') ||
    normalizedFilePath.includes('/pages/') ||
    ['.tsx', '.jsx'].includes(ext);

  if (isComponentPath) {
    const importLines = lines.filter(l => l.trim().startsWith('import '));
    results.components.push({
      name: baseName,
      filePath: normalizedFilePath,
      imports: importLines.map(l => l.trim()),
    });
  }

  // 2. Model / Entity detection
  const isModelPath =
    normalizedFilePath.includes('/models/') ||
    normalizedFilePath.includes('/schemas/') ||
    normalizedFilePath.includes('/entities/') ||
    normalizedFilePath.includes('/db/');

  if (isModelPath) {
    results.models.push({
      name: baseName,
      filePath: normalizedFilePath,
    });
  }

  // 3. Solidity Smart Contract detection
  if (ext === '.sol') {
    const contractRegex = /(?:contract|interface)\s+([a-zA-Z0-9_]+)/g;
    let match;
    while ((match = contractRegex.exec(content)) !== null) {
      results.models.push({
        name: `${match[1]} (Contract)`,
        filePath: normalizedFilePath,
      });
    }
  }

  // 4. Node / Express / Fastify / Nest Route regexes
  const routeRegex = /(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/i;

  // Python FastAPI / Flask / Blueprint route regexes: @app.get("/path"), @router.post("/path"), @bp.route("/path", methods=['GET'])
  const pythonDecoratedRouteRegex = /@(?:app|router|bp|blueprint|api)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/i;
  const pythonBpRouteRegex = /@(?:app|bp|blueprint)\.route\s*\(\s*['"`]([^'"`]+)['"`](?:.*?methods\s*=\s*\[['"`]([a-zA-Z]+)['"`]\])?/i;

  // Client API calls: axios, fetch, requests, httpx
  const axiosRegex = /(?:axios|api|client)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/i;
  const fetchRegex = /fetch\s*\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*\{\s*method:\s*['"`]([a-zA-Z]+)['"`])?/i;
  const pythonRequestsRegex = /(?:requests|httpx)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/i;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const isPython = ext === '.py';

    if (!isPython) {
      // Check Node/Express Route
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
          filePath: normalizedFilePath,
          lineNumber: lineNum,
          parameters,
          handlerName: `handler_${baseName}_L${lineNum}`,
        });
      }

      // Check Axios / API Client call
      const axiosMatch = line.match(axiosRegex);
      if (axiosMatch) {
        const method = axiosMatch[1].toUpperCase() as ApiClientCall['method'];
        const rawUrl = axiosMatch[2];
        results.apiCalls.push({
          id: `call-${results.apiCalls.length + 1}`,
          method,
          url: rawUrl,
          normalizedPath: normalizePath(rawUrl),
          filePath: normalizedFilePath,
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
          filePath: normalizedFilePath,
          lineNumber: lineNum,
          callerComponent: baseName,
        });
      }
    } else {
      // Check Python Route
      const pyRouteMatch = line.match(pythonDecoratedRouteRegex);
      if (pyRouteMatch) {
        const method = pyRouteMatch[1].toUpperCase() as RouteDefinition['method'];
        const rawPath = pyRouteMatch[2];
        const paramsMatch = rawPath.match(/\{([a-zA-Z0-9_]+)\}/g);
        const parameters = paramsMatch ? paramsMatch.map(p => p.slice(1, -1)) : [];

        results.routes.push({
          id: `route-py-${results.routes.length + 1}`,
          method,
          path: rawPath,
          normalizedPath: normalizePath(rawPath),
          filePath: normalizedFilePath,
          lineNumber: lineNum,
          parameters,
          handlerName: `py_${baseName}_L${lineNum}`,
        });
      } else {
        const pyBpMatch = line.match(pythonBpRouteRegex);
        if (pyBpMatch) {
          const rawPath = pyBpMatch[1];
          const method = (pyBpMatch[2] ? pyBpMatch[2].toUpperCase() : 'GET') as RouteDefinition['method'];
          results.routes.push({
            id: `route-py-${results.routes.length + 1}`,
            method,
            path: rawPath,
            normalizedPath: normalizePath(rawPath),
            filePath: normalizedFilePath,
            lineNumber: lineNum,
            parameters: [],
            handlerName: `py_bp_${baseName}_L${lineNum}`,
          });
        }
      }

      // Check Python Requests / HTTPX
      const pyReqMatch = line.match(pythonRequestsRegex);
      if (pyReqMatch) {
        const method = pyReqMatch[1].toUpperCase() as ApiClientCall['method'];
        const rawUrl = pyReqMatch[2];
        results.apiCalls.push({
          id: `call-py-${results.apiCalls.length + 1}`,
          method,
          url: rawUrl,
          normalizedPath: normalizePath(rawUrl),
          filePath: normalizedFilePath,
          lineNumber: lineNum,
          callerComponent: baseName,
        });
      }
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
        if (['.ts', '.tsx', '.js', '.jsx', '.py', '.sol'].includes(ext)) {
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
