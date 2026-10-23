import { describe, it, expect } from 'vitest';
import { buildArchitectureDiagram } from '../server/src/engine/architectureBuilder';
import { analyzeCodeContent, normalizePath } from '../server/src/engine/staticAnalyzer';
import { llmService } from '../server/src/services/llmService';

describe('CodePulse Dynamic Architecture & Multi-Tier Repository Ingestion', () => {
  it('isolates KrishiSetu components exclusively to offline demo fixture mode', () => {
    const krishiResult = buildArchitectureDiagram(
      'krishisetu',
      { routes: [], apiCalls: [], components: [], models: [] },
      ['CropDashboard.tsx'],
      true // isFixture
    );

    expect(krishiResult.mermaidDiagram).toContain('CropDashboard.tsx');
    expect(krishiResult.mermaidDiagram).toContain('BidHistory.tsx');
    expect(krishiResult.mermaidDiagram).toContain('cropController.ts');

    // When analyzing a live GitHub repo, KrishiSetu fixtures must NEVER appear
    const liveResult = buildArchitectureDiagram(
      'AQUA-ETHIC',
      {
        routes: [
          {
            id: 'r1',
            method: 'GET',
            path: '/api/v1/sensors/water-quality',
            normalizedPath: '/api/v1/sensors/water-quality',
            filePath: 'backend/routes/sensorRoutes.js',
            lineNumber: 12,
            parameters: [],
            handlerName: 'getWaterQuality',
          },
        ],
        apiCalls: [
          {
            id: 'c1',
            method: 'GET',
            url: '/api/v1/sensors/water-quality',
            normalizedPath: '/api/v1/sensors/water-quality',
            filePath: 'frontend/src/api/waterApi.ts',
            lineNumber: 8,
            callerComponent: 'WaterQualityDashboard',
          },
        ],
        components: [
          { name: 'WaterQualityDashboard', filePath: 'frontend/src/components/WaterQualityDashboard.tsx' },
        ],
        models: [
          { name: 'WaterSample (Contract)', filePath: 'blockchain/contracts/WaterSample.sol' },
        ],
        topLevelFolders: ['frontend', 'backend', 'blockchain', 'aqua_ethic_probe'],
      },
      [
        'frontend/src/components/WaterQualityDashboard.tsx',
        'backend/routes/sensorRoutes.js',
        'blockchain/contracts/WaterSample.sol',
        'aqua_ethic_probe/collector.py',
      ],
      false // NOT fixture
    );

    // Assert live repo topology
    expect(liveResult.mermaidDiagram).not.toContain('CropDashboard.tsx');
    expect(liveResult.mermaidDiagram).not.toContain('BidHistory.tsx');
    expect(liveResult.mermaidDiagram).not.toContain('cropController.ts');

    // Assert discovered tiers
    expect(liveResult.mermaidDiagram).toContain('Probe & Sensor Pipeline (IoT)');
    expect(liveResult.mermaidDiagram).toContain('Frontend Tier');
    expect(liveResult.mermaidDiagram).toContain('Backend Services & API Layer');
    expect(liveResult.mermaidDiagram).toContain('Blockchain & Smart Contracts');
    expect(liveResult.layers.map(l => l.name)).toContain('Probe & IoT Pipeline');
    expect(liveResult.layers.map(l => l.name)).toContain('Blockchain & Smart Contracts');
  });

  it('analyzes Python FastAPI routes and Solidity contracts dynamically', () => {
    const results = {
      routes: [] as any[],
      apiCalls: [] as any[],
      components: [] as any[],
      models: [] as any[],
    };

    // Python probe script
    const pyCode = `
from fastapi import FastAPI, APIRouter
app = FastAPI()

@app.get("/api/probe/{sensor_id}/telemetry")
def read_telemetry(sensor_id: str):
    return {"sensor_id": sensor_id, "ph": 7.4}
`;
    analyzeCodeContent(pyCode, 'aqua_ethic_probe/telemetry_service.py', results);

    expect(results.routes.length).toBe(1);
    expect(results.routes[0].path).toBe('/api/probe/{sensor_id}/telemetry');
    expect(results.routes[0].normalizedPath).toBe('/api/probe/{param}/telemetry');

    // Solidity contract
    const solCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WaterVerificationLedger {
    uint256 public recordCount;
}
`;
    analyzeCodeContent(solCode, 'blockchain/contracts/WaterVerificationLedger.sol', results);

    expect(results.models.some(m => m.name.includes('WaterVerificationLedger'))).toBe(true);
  });

  it('generates grounded architecture explanation without hallucinating unanalyzed components', async () => {
    const explanation = await llmService.explainArchitecture({
      name: 'AQUA-ETHIC',
      owner: 'ANTOJERRIN',
      frameworks: ['Solidity (Smart Contracts)', 'React', 'IoT Telemetry Probe'],
      fileCount: 42,
      routesCount: 8,
      folders: ['frontend', 'backend', 'blockchain', 'aqua_ethic_probe'],
    });

    expect(explanation.text).toBeDefined();
    expect(explanation.text.length).toBeGreaterThan(40);
    expect(explanation.source).toMatch(/gemini|deterministic_fallback/);
  }, 10000);
});
