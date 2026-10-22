import { ImpactGraphData, ImpactGraphNode, ImpactGraphEdge } from '../types';
import { ParsedDiffFile } from './diffParser';
import { RouteDefinition, ApiClientCall } from '../types';

export function buildImpactGraph(
  diffFiles: ParsedDiffFile[],
  routes: RouteDefinition[],
  apiCalls: ApiClientCall[],
  components: { name: string; filePath: string }[]
): ImpactGraphData {
  const nodes: ImpactGraphNode[] = [];
  const edges: ImpactGraphEdge[] = [];
  const addedNodeIds = new Set<string>();

  function addNode(node: ImpactGraphNode) {
    if (!addedNodeIds.has(node.id)) {
      addedNodeIds.add(node.id);
      nodes.push(node);
    }
  }

  // 1. Add Changed Files as Root Nodes
  for (const file of diffFiles) {
    const fileId = `node_${file.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
    addNode({
      id: fileId,
      label: `Modified: ${file.path.split('/').pop()}`,
      type: 'changed_file',
      status: 'modified',
      filePath: file.path,
    });

    // 2. Correlate with Routes
    for (const route of routes) {
      if (file.path.includes(route.filePath) || route.filePath.includes(file.path)) {
        const routeNodeId = `route_${route.id}`;
        addNode({
          id: routeNodeId,
          label: `${route.method} ${route.path}`,
          type: 'endpoint',
          status: 'affected',
          filePath: route.filePath,
        });

        edges.push({
          source: fileId,
          target: routeNodeId,
          relation: 'imports',
          confidence: 0.95,
        });

        // 3. Correlate Route with Frontend API Calls & Components
        for (const call of apiCalls) {
          if (call.normalizedPath === route.normalizedPath) {
            const compNodeId = `comp_${call.callerComponent}`;
            addNode({
              id: compNodeId,
              label: `<UI Component>\n${call.callerComponent}`,
              type: 'component',
              status: 'affected',
              filePath: call.filePath,
            });

            edges.push({
              source: routeNodeId,
              target: compNodeId,
              relation: 'renders',
              confidence: 0.9,
            });
          }
        }

        // 4. Correlate with Tests
        const testNodeId = `test_${route.id}`;
        addNode({
          id: testNodeId,
          label: `Missing Test Coverage!\n(No spec for ${route.path})`,
          type: 'test',
          status: 'affected',
        });
        edges.push({
          source: routeNodeId,
          target: testNodeId,
          relation: 'tests',
          confidence: 0.85,
        });
      }
    }
  }

  // If no routes directly matched (e.g. client component changed), connect directly
  for (const file of diffFiles) {
    const fileId = `node_${file.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
    for (const comp of components) {
      if (file.path.includes(comp.filePath) || comp.filePath.includes(file.path)) {
        const compNodeId = `comp_${comp.name}`;
        addNode({
          id: compNodeId,
          label: `<UI Component>\n${comp.name}`,
          type: 'component',
          status: 'modified',
          filePath: comp.filePath,
        });
        edges.push({
          source: fileId,
          target: compNodeId,
          relation: 'renders',
          confidence: 1.0,
        });
      }
    }
  }

  // Build Mermaid string
  const mermaidLines: string[] = ['graph TD'];
  mermaidLines.push('  %% Styles');
  mermaidLines.push('  classDef modified fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b;');
  mermaidLines.push('  classDef endpoint fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;');
  mermaidLines.push('  classDef component fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#6b21a8;');
  mermaidLines.push('  classDef test fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;');

  for (const node of nodes) {
    // Sanitize label for Mermaid
    const cleanLabel = node.label.replace(/"/g, "'").replace(/\n/g, '<br/>');
    mermaidLines.push(`  ${node.id}["${cleanLabel}"]`);
    if (node.type === 'changed_file') {
      mermaidLines.push(`  class ${node.id} modified;`);
    } else if (node.type === 'endpoint') {
      mermaidLines.push(`  class ${node.id} endpoint;`);
    } else if (node.type === 'component') {
      mermaidLines.push(`  class ${node.id} component;`);
    } else if (node.type === 'test') {
      mermaidLines.push(`  class ${node.id} test;`);
    }
  }

  for (const edge of edges) {
    mermaidLines.push(`  ${edge.source} -->|${edge.relation}| ${edge.target}`);
  }

  const mermaidDiagram = mermaidLines.join('\n');

  return {
    nodes,
    edges,
    mermaidDiagram,
  };
}
