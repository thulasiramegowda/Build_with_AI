import path from 'path';
import { RouteDefinition, ApiClientCall } from '../types';

export interface ArchitectureLayer {
  name: string;
  type: string;
  count: number;
}

export interface ArchitectureDiagramResult {
  mermaidDiagram: string;
  layers: ArchitectureLayer[];
}

function sanitizeId(str: string): string {
  return str.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 32);
}

export function buildArchitectureDiagram(
  repoName: string,
  analysis: {
    routes: RouteDefinition[];
    apiCalls: ApiClientCall[];
    components: { name: string; filePath: string }[];
    models: { name: string; filePath: string }[];
    topLevelFolders?: string[];
  },
  allFilePaths: string[] = [],
  isFixture: boolean = false
): ArchitectureDiagramResult {
  // If KrishiSetu offline sample fixture, keep its dedicated agricultural commerce flow
  if (isFixture && repoName.toLowerCase().includes('krishisetu')) {
    const krishiMermaid = `flowchart TD
  subgraph Frontend["Frontend Tier (React + Vite)"]
    UI_Crop["CropDashboard.tsx"]
    UI_Bid["BidHistory.tsx"]
    API_Crops["api/crops.ts"]
    API_Bids["api/bids.ts"]
    API_Prices["api/marketPrices.ts"]
  end

  subgraph Gateway["Express API Layer"]
    R_Crop["/api/crops"]
    R_Bid["/api/bids"]
    R_Prices["/api/market-prices"]
  end

  subgraph Controllers["Business Logic Controllers"]
    C_Crop["cropController.ts"]
    C_Bid["bidController.ts"]
  end

  subgraph Database["Data Models & Storage"]
    M_Crop[("Crop.ts (Records)")]
    M_Bid[("Bid.ts (Records)")]
  end

  UI_Crop --> API_Crops
  UI_Crop --> API_Prices
  UI_Bid --> API_Bids

  API_Crops -.->|HTTP GET/POST| R_Crop
  API_Bids -.->|HTTP GET/PUT| R_Bid
  API_Prices -.->|HTTP GET| R_Prices

  R_Crop --> C_Crop
  R_Bid --> C_Bid

  C_Crop --> M_Crop
  C_Bid --> M_Bid

  classDef client fill:#FAF7EE,stroke:#D9A62E,stroke-width:1.5px,color:#252923;
  classDef server fill:#FFFDF7,stroke:#77766E,stroke-width:1.5px,color:#252923;
  classDef db fill:#F3F0E6,stroke:#059669,stroke-width:1.5px,color:#065F46;

  class UI_Crop,UI_Bid,API_Crops,API_Bids,API_Prices client;
  class R_Crop,R_Bid,R_Prices,C_Crop,C_Bid server;
  class M_Crop,M_Bid db;`;

    return {
      mermaidDiagram: krishiMermaid,
      layers: [
        { name: 'Frontend Tier', type: 'client', count: analysis.components.length + analysis.apiCalls.length },
        { name: 'Express API Layer', type: 'routing', count: analysis.routes.length },
        { name: 'Controllers & Models', type: 'database', count: analysis.models.length + 2 },
      ],
    };
  }

  // =========================================================================
  // DYNAMIC REPOSITORY ARCHITECTURE BUILDER (e.g. ANTOJERRIN/AQUA-ETHIC)
  // =========================================================================

  // Group files into discovered architectural domains
  const frontendFiles = allFilePaths.filter(p => 
    p.startsWith('frontend/') || p.startsWith('client/') || p.includes('/components/') || p.includes('/views/') || p.endsWith('.tsx') || p.endsWith('.jsx')
  );

  const backendFiles = allFilePaths.filter(p => 
    p.startsWith('backend/') || p.startsWith('server/') || p.includes('/routes/') || p.includes('/controllers/') || p.includes('/api/')
  );

  const blockchainFiles = allFilePaths.filter(p => 
    p.startsWith('blockchain/') || p.startsWith('contracts/') || p.includes('/contracts/') || p.endsWith('.sol') || p.includes('hardhat') || p.includes('truffle')
  );

  const probeFiles = allFilePaths.filter(p => 
    p.startsWith('aqua_ethic_probe/') || p.includes('probe') || p.includes('sensor') || p.includes('telemetry') || p.includes('iot')
  );

  const modelFiles = allFilePaths.filter(p => 
    p.includes('/models/') || p.includes('/schemas/') || p.includes('/entities/') || p.includes('/db/')
  );

  const subgraphs: string[] = [];
  const edges: string[] = [];
  const layers: ArchitectureLayer[] = [];

  const clientNodes: string[] = [];
  const serverNodes: string[] = [];
  const blockchainNodes: string[] = [];
  const probeNodes: string[] = [];
  const dbNodes: string[] = [];

  // 1. Probe / IoT Tier
  if (probeFiles.length > 0) {
    const probeItems = probeFiles.slice(0, 4).map((f, i) => {
      const id = `Probe_${sanitizeId(path.basename(f))}_${i}`;
      probeNodes.push(id);
      return `    ${id}["${path.basename(f)} (Sensor Probe)"]`;
    });
    subgraphs.push(`  subgraph Probes["Probe & Sensor Pipeline (IoT)"]\n${probeItems.join('\n')}\n  end`);
    layers.push({ name: 'Probe & IoT Pipeline', type: 'probe', count: probeFiles.length });
  }

  // 2. Frontend Tier
  if (frontendFiles.length > 0 || analysis.components.length > 0) {
    const uiItems: string[] = [];
    
    // Discovered components
    const componentsToShow = (analysis.components.length > 0 ? analysis.components : frontendFiles.slice(0, 4).map(f => ({ name: path.basename(f), filePath: f }))).slice(0, 4);
    componentsToShow.forEach((c, i) => {
      const id = `FE_UI_${sanitizeId(c.name)}_${i}`;
      clientNodes.push(id);
      uiItems.push(`    ${id}["${c.name}"]`);
    });

    // Discovered client API calls or services
    if (analysis.apiCalls.length > 0) {
      const uniqueCallers = Array.from(new Set(analysis.apiCalls.map(c => c.callerComponent))).slice(0, 3);
      uniqueCallers.forEach((name, i) => {
        const id = `FE_API_${sanitizeId(name)}_${i}`;
        clientNodes.push(id);
        uiItems.push(`    ${id}["${name} (Client API)"]`);
      });
    }

    subgraphs.push(`  subgraph Frontend["Frontend Tier (User Interface)"]\n${uiItems.join('\n')}\n  end`);
    layers.push({ name: 'Frontend Tier', type: 'client', count: frontendFiles.length || analysis.components.length });
  }

  // 3. Backend & API Gateway Tier
  if (backendFiles.length > 0 || analysis.routes.length > 0) {
    const backendItems: string[] = [];

    // Routes
    if (analysis.routes.length > 0) {
      analysis.routes.slice(0, 5).forEach((r, i) => {
        const id = `API_Route_${sanitizeId(r.path)}_${i}`;
        serverNodes.push(id);
        backendItems.push(`    ${id}["${r.method} ${r.path}"]`);
      });
    } else {
      // Show discovered backend modules
      backendFiles.slice(0, 4).forEach((f, i) => {
        const id = `BE_Mod_${sanitizeId(path.basename(f))}_${i}`;
        serverNodes.push(id);
        backendItems.push(`    ${id}["${path.basename(f)} (Backend Handler)"]`);
      });
    }

    subgraphs.push(`  subgraph Backend["Backend Services & API Layer"]\n${backendItems.join('\n')}\n  end`);
    layers.push({ name: 'Backend Services & API Layer', type: 'routing', count: backendFiles.length || analysis.routes.length });
  }

  // 4. Blockchain & Smart Contracts Tier
  if (blockchainFiles.length > 0) {
    const bcItems = blockchainFiles.slice(0, 4).map((f, i) => {
      const id = `BC_${sanitizeId(path.basename(f))}_${i}`;
      blockchainNodes.push(id);
      return `    ${id}["${path.basename(f)} (Smart Contract)"]`;
    });
    subgraphs.push(`  subgraph Blockchain["Blockchain & Smart Contracts"]\n${bcItems.join('\n')}\n  end`);
    layers.push({ name: 'Blockchain & Smart Contracts', type: 'blockchain', count: blockchainFiles.length });
  }

  // 5. Data Models & Storage Tier
  if (modelFiles.length > 0 || analysis.models.length > 0) {
    const modelItemsToShow = (analysis.models.length > 0 ? analysis.models : modelFiles.slice(0, 4).map(f => ({ name: path.basename(f), filePath: f }))).slice(0, 3);
    const dbItems = modelItemsToShow.map((m, i) => {
      const id = `DB_${sanitizeId(m.name)}_${i}`;
      dbNodes.push(id);
      return `    ${id}[("${m.name} (Storage)")]`;
    });
    subgraphs.push(`  subgraph Storage["Data Models & Persistence"]\n${dbItems.join('\n')}\n  end`);
    layers.push({ name: 'Data & Persistence', type: 'database', count: modelFiles.length || analysis.models.length });
  }

  // If repository has generic structure, create a clean topology
  if (subgraphs.length === 0) {
    subgraphs.push(`  subgraph Core["Repository Architecture (${repoName})"]
    Core_Mod["Discovered Source Modules"]
  end`);
    clientNodes.push('Core_Mod');
    layers.push({ name: 'Core Application', type: 'client', count: allFilePaths.length });
  }

  // 6. Connect Relationships across tiers
  if (probeNodes.length > 0 && serverNodes.length > 0) {
    edges.push(`  ${probeNodes[0]} -.->|Telemetry Ingestion| ${serverNodes[0]}`);
  }
  if (clientNodes.length > 0 && serverNodes.length > 0) {
    edges.push(`  ${clientNodes[0]} -.->|HTTP REST Calls| ${serverNodes[0]}`);
  }
  if (serverNodes.length > 0 && dbNodes.length > 0) {
    edges.push(`  ${serverNodes[0]} -->|Persists State| ${dbNodes[0]}`);
  }
  if (serverNodes.length > 0 && blockchainNodes.length > 0) {
    edges.push(`  ${serverNodes[0]} -->|Audit Verification| ${blockchainNodes[0]}`);
  }

  // 7. Compose Diagram with CodePulse Warm Palette
  const classDefs = `  classDef client fill:#FAF7EE,stroke:#D9A62E,stroke-width:1.5px,color:#252923;
  classDef server fill:#FFFDF7,stroke:#77766E,stroke-width:1.5px,color:#252923;
  classDef db fill:#F3F0E6,stroke:#059669,stroke-width:1.5px,color:#065F46;
  classDef blockchain fill:#F5F3FF,stroke:#7C3AED,stroke-width:1.5px,color:#4C1D95;
  classDef probe fill:#ECFEFF,stroke:#0891B2,stroke-width:1.5px,color:#164E63;`;

  const stylingAssignments: string[] = [];
  if (clientNodes.length > 0) stylingAssignments.push(`  class ${clientNodes.join(',')} client;`);
  if (serverNodes.length > 0) stylingAssignments.push(`  class ${serverNodes.join(',')} server;`);
  if (dbNodes.length > 0) stylingAssignments.push(`  class ${dbNodes.join(',')} db;`);
  if (blockchainNodes.length > 0) stylingAssignments.push(`  class ${blockchainNodes.join(',')} blockchain;`);
  if (probeNodes.length > 0) stylingAssignments.push(`  class ${probeNodes.join(',')} probe;`);

  const mermaidDiagram = `flowchart TD
${subgraphs.join('\n\n')}

${edges.join('\n')}

${classDefs}
${stylingAssignments.join('\n')}`;

  return {
    mermaidDiagram,
    layers,
  };
}
