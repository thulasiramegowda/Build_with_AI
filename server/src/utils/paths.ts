import fs from 'fs';
import path from 'path';

export function resolveFixtureDir(repoId: string): string {
  const candidates = [
    path.resolve(process.cwd(), 'server/src/fixtures', repoId),
    path.resolve(process.cwd(), 'src/fixtures', repoId),
    path.resolve(__dirname, '../../src/fixtures', repoId),
    path.resolve(__dirname, '../fixtures', repoId),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}
