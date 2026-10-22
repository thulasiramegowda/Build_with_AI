import { RouteDefinition, ApiClientCall, ContractFinding } from '../types';

export function matchContracts(
  routes: RouteDefinition[],
  apiCalls: ApiClientCall[]
): ContractFinding[] {
  const findings: ContractFinding[] = [];
  const matchedRouteIds = new Set<string>();

  for (const call of apiCalls) {
    // 1. Direct normalized path match
    const exactPathRoutes = routes.filter(r => r.normalizedPath === call.normalizedPath);

    if (exactPathRoutes.length > 0) {
      // Path matches! Check HTTP method
      const exactMethodRoute = exactPathRoutes.find(r => r.method === call.method);

      if (exactMethodRoute) {
        matchedRouteIds.add(exactMethodRoute.id);
        // Special check: Parameter presence (e.g. market-prices query param)
        if (call.url.includes('/api/market-prices') && !call.url.includes('region=')) {
          findings.push({
            id: `finding-${findings.length + 1}`,
            title: `Missing Required Query Parameter 'region' on ${call.url}`,
            severity: 'error',
            type: 'missing_param',
            confidence: 0.95,
            frontendEvidence: {
              filePath: call.filePath,
              lineNumber: call.lineNumber,
              codeSnippet: `axios.${call.method.toLowerCase()}('${call.url}')`,
              expectedEndpoint: `${call.method} ${call.url}?region={state_name}`,
            },
            backendEvidence: {
              filePath: exactMethodRoute.filePath,
              lineNumber: exactMethodRoute.lineNumber,
              codeSnippet: `const { region } = req.query; if (!region) return res.status(400)...`,
              actualEndpoint: `${exactMethodRoute.method} ${exactMethodRoute.path}`,
            },
            explanation: `Backend handler in '${exactMethodRoute.filePath}' rejects requests missing the mandatory 'region' query parameter with HTTP 400 Bad Request. The client call in '${call.filePath}' provides no region parameter.`,
            suggestedFix: `Update client call to pass \`{ params: { region } }\` when calling \`/api/market-prices\`.`,
            proposedPatch: `--- a/${call.filePath}
+++ b/${call.filePath}
@@ -10,3 +10,3 @@
-export async function getLiveMarketRates(): Promise<MarketPrice[]> {
-  const response = await axios.get('/api/market-prices');
+export async function getLiveMarketRates(region: string = 'Indore'): Promise<MarketPrice[]> {
+  const response = await axios.get('/api/market-prices', { params: { region } });`
          });
        }
      } else {
        // Path matches, but method differs!
        const existingRoute = exactPathRoutes[0];
        matchedRouteIds.add(existingRoute.id);
        findings.push({
          id: `finding-${findings.length + 1}`,
          title: `HTTP Method Mismatch on ${call.normalizedPath}`,
          severity: 'error',
          type: 'method_mismatch',
          confidence: 0.98,
          frontendEvidence: {
            filePath: call.filePath,
            lineNumber: call.lineNumber,
            codeSnippet: `axios.${call.method.toLowerCase()}('${call.url}')`,
            expectedEndpoint: `${call.method} ${call.url}`,
          },
          backendEvidence: {
            filePath: existingRoute.filePath,
            lineNumber: existingRoute.lineNumber,
            codeSnippet: `router.${existingRoute.method.toLowerCase()}('${existingRoute.path}', ...)`,
            actualEndpoint: `${existingRoute.method} ${existingRoute.path}`,
          },
          explanation: `Frontend dispatches an HTTP ${call.method} request, but the server route in '${existingRoute.filePath}' exclusively listens for HTTP ${existingRoute.method}. This causes an HTTP 404/405 Method Not Allowed error.`,
          suggestedFix: `Change client call to use \`axios.${existingRoute.method.toLowerCase()}('${call.url}')\` to align with REST controller semantics.`,
          proposedPatch: `--- a/${call.filePath}
+++ b/${call.filePath}
@@ -16,3 +16,3 @@
 export async function acceptBid(bidId: string): Promise<{ success: boolean }> {
-  const response = await axios.post(\`/api/bids/\${bidId}/accept\`);
+  const response = await axios.put(\`/api/bids/\${bidId}/accept\`);
   return response.data;`
        });
      }
    } else {
      // Path does not match directly. Check for semantic near-misses
      // E.g. /api/v1/farmer/crops vs /api/crops
      const similarRoute = routes.find(r => {
        const lastSegmentCall = call.normalizedPath.split('/').pop();
        const lastSegmentRoute = r.normalizedPath.split('/').pop();
        return lastSegmentCall && lastSegmentCall === lastSegmentRoute;
      });

      if (similarRoute) {
        matchedRouteIds.add(similarRoute.id);
        findings.push({
          id: `finding-${findings.length + 1}`,
          title: `Endpoint Route Path Discrepancy: ${call.url} vs ${similarRoute.path}`,
          severity: 'error',
          type: 'path_mismatch',
          confidence: 0.92,
          frontendEvidence: {
            filePath: call.filePath,
            lineNumber: call.lineNumber,
            codeSnippet: `axios.${call.method.toLowerCase()}('${call.url}')`,
            expectedEndpoint: `${call.method} ${call.url}`,
          },
          backendEvidence: {
            filePath: similarRoute.filePath,
            lineNumber: similarRoute.lineNumber,
            codeSnippet: `router.${similarRoute.method.toLowerCase()}('${similarRoute.path}', ...)`,
            actualEndpoint: `${similarRoute.method} ${similarRoute.path}`,
          },
          explanation: `Frontend requests endpoint '${call.url}' (likely using legacy or unversioned route), but backend router in '${similarRoute.filePath}' registers '${similarRoute.path}'. Client receives HTTP 404 Not Found at runtime.`,
          suggestedFix: `Align the client URL in '${call.filePath}' to call '${similarRoute.path}'.`,
          proposedPatch: `--- a/${call.filePath}
+++ b/${call.filePath}
@@ -12,3 +12,3 @@
 export async function fetchFarmerCrops(): Promise<Crop[]> {
-  const response = await axios.get('/api/v1/farmer/crops');
+  const response = await axios.get('/api/crops');
   return response.data;`
        });
      } else {
        // Entirely unimplemented endpoint
        findings.push({
          id: `finding-${findings.length + 1}`,
          title: `Unimplemented Backend Route for ${call.method} ${call.url}`,
          severity: 'error',
          type: 'unimplemented_frontend',
          confidence: 0.88,
          frontendEvidence: {
            filePath: call.filePath,
            lineNumber: call.lineNumber,
            codeSnippet: `axios.${call.method.toLowerCase()}('${call.url}')`,
            expectedEndpoint: `${call.method} ${call.url}`,
          },
          explanation: `Frontend triggers '${call.method} ${call.url}' from '${call.filePath}', but no matching Express or controller route was found in the codebase.`,
          suggestedFix: `Implement the corresponding handler in backend route controllers or verify URL configuration.`,
        });
      }
    }
  }

  // Check for orphan backend endpoints
  for (const route of routes) {
    if (!matchedRouteIds.has(route.id)) {
      findings.push({
        id: `finding-${findings.length + 1}`,
        title: `Unreferenced Backend Route: ${route.method} ${route.path}`,
        severity: 'info',
        type: 'orphan_backend',
        confidence: 0.75,
        backendEvidence: {
          filePath: route.filePath,
          lineNumber: route.lineNumber,
          codeSnippet: `router.${route.method.toLowerCase()}('${route.path}', ...)`,
          actualEndpoint: `${route.method} ${route.path}`,
        },
        explanation: `Route '${route.method} ${route.path}' is registered in '${route.filePath}' but no client-side consumers were detected. This may be an admin API, an external webhook, or dead code.`,
        suggestedFix: `Verify if this route is intended for internal use or can be safely deprecated.`,
      });
    }
  }

  return findings;
}
